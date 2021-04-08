-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local multipart = require 'multipart'
local validate = require 'validate'
local core = require 'core'


local function data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs
	tb = {}
	tb._mans = {}
	qs =
[[
select
    md5(format('%s:%s', j.user_id, j.route_date)) row_id,
    j.user_id, u.descr u_name, j.user_id u_code, u.dev_login, u.area,
    (
	select array_to_string(array_agg(descr::text),'|') from distributors aa,
	    (select uu distr_id, row_number() over() rowno from unnest(u.distr_ids) uu) bb
	where aa.distr_id=bb.distr_id order by min(bb.rowno)
    ) distributors,
    (
	select array_to_string(array_agg(descr::text),'|') from departments aa,
	    (select uu dep_id, row_number() over() rowno from unnest(u.dep_ids) uu) bb
	where aa.dep_id=bb.dep_id order by min(bb.rowno)
    ) departments,
    j.route_date,
    j.canceling_type_id, t.descr canceling_type,
    j.note,
    j.hidden,
    u.executivehead_id head_id, ex.descr head_name
from j_cancellations j
    left join canceling_types t on t.canceling_type_id = j.canceling_type_id
    left join users u on u.user_id = j.user_id
    left join users ex on ex.user_id = u.executivehead_id
$(0)
order by j.route_date desc, u.descr, u.dev_login, u.user_id
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, 
		qs:replace("$(0)", "where j.user_id in (select * from my_staff(%user_id%, 1::bool_t))"),
		"//cancellations/get", { 
		    user_id = sestb.erpid 
		})
	    if err == nil or err == false then
		tb._mans.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    where hidden=0 and user_id in (select * from my_staff(%user_id%, 1::bool_t))
order by descr
]]
		    , "//cancellations/mans/users/", { 
			user_id = sestb.erpid 
		    }
		)
	    end
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.rows, err = func_execute(tran, 
		qs:replace("$(0)", "where (%dep_id% is null or u.dep_ids is null or u.dep_ids && string_to_array(%dep_id%,',')::uids_t) and (%country_id% is null or (u.country_id=any(string_to_array(%country_id%,',')::uids_t)))"),
		"//cancellations/get", { 
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		})
	    if err == nil or err == false then
		tb._mans.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    where hidden = 0
	and (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or country_id=any(string_to_array(%country_id%,',')::uids_t))
order by descr
]]
		    , "//cancellations/mans/users/", { 
			dep_id = sestb.department == nil and stor.NULL or sestb.department,
			country_id = sestb.country == nil and stor.NULL or sestb.country
		    }
		)
	    end
	elseif sestb.distributor ~= nil then
	    tb.rows, err = func_execute(tran, 
		qs:replace("$(0)", "where u.distr_ids && string_to_array(%distr_id%,',')::uids_t"),
		"//cancellations/get", { 
		    distr_id = sestb.distributor
		})
	    if err == nil or err == false then
		tb._mans.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    where hidden = 0 and distr_ids && string_to_array(%distr_id%,',')::uids_t
order by descr
]]
		    , "//cancellations/mans/users/", { 
			distr_id = sestb.distributor
		    }
		)
	    end
	elseif sestb.agency ~= nil then
	    tb.rows, err = func_execute(tran, 
		qs:replace("$(0)", "where u.agency_id = any(string_to_array(%agency_id%,','))"),
		"//cancellations/get", { 
		    agency_id = sestb.agency
		})
	    if err == nil or err == false then
		tb._mans.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    where hidden=0 and agency_id = any(string_to_array(%agency_id%,','))
order by descr
]]
		    , "//cancellations/mans/users/", { 
			agency_id = sestb.agency
		    }
		)
	    end
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""), "//cancellations/get")

	    if err == nil or err == false then
		tb._mans.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    where hidden=0 
order by descr
]]
		    , "//cancellations/mans/users/"
		)
	    end
	end

	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//cancellations/users/"
	    )
	end

	if err == nil or err == false then
	    tb._mans.types, err = func_execute(tran,
[[
select canceling_type_id, descr from canceling_types 
    where hidden=0 
order by descr
]]
		, "//cancellations/mans/canceling_types/"
	    )
	end

	return tb, err
    end
    )
end

local function restore(stor, uid, reqdt, route_date, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_canceling(%req_uid%, %req_dt%, 'restore', %user_id%, %route_date%)
]]
	, "//cancellations/restore/"
	, {req_uid = uid, req_dt = reqdt, route_date = route_date, user_id = user_id})
    end
    )
end

local function revoke(stor, uid, reqdt, route_date, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_canceling(%req_uid%, %req_dt%, 'revoke', %user_id%, %route_date%)
]]
	, "//cancellations/reject/"
	, {req_uid = uid, req_dt = reqdt, route_date = route_date, user_id = user_id})
    end
    )
end

local function post(stor, uid, reqdt, user_id, b_date, e_date, type_id, note)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_canceling(%req_uid%, %req_dt%, %user_id%, %type_id%, %b_date%, %e_date%, %note%)
]]
	, "//cancellations/new/"
	, {req_uid = uid, req_dt = reqdt, user_id = user_id, b_date = b_date, e_date = e_date, type_id = type_id, note = note})
    end
    )
end

local function staff(stor, sestb, user_id)
    return stor.get(function(tran, func_execute)
	local tb, err
	if sestb.erpid ~= nil then
	    tb, err = func_execute(tran,
[[
select user_id from users 
    where user_id in (select * from my_staff(%head_id%, 1::bool_t)) and user_id = %user_id%
]]
		, "//cancellations/staff/", { 
		    user_id = user_id,
		    head_id = sestb.erpid 
		}
	    )
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb, err = func_execute(tran,
[[
select user_id from users 
    where user_id = %user_id%
	and (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
]]
		, "//cancellations/staff/", { 
		    user_id = user_id,
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
	elseif sestb.distributor ~= nil then
	    tb, err = func_execute(tran,
[[
select user_id from users 
    where distr_ids && string_to_array(%distr_id%,',')::uids_t and user_id = %user_id%
]]
		, "//cancellations/staff/", { 
		    user_id = user_id,
		    distr_id = sestb.distributor
		}
	    )
	elseif sestb.agency ~= nil then
	    tb, err = func_execute(tran,
[[
select user_id from users 
    where agency_id = any(string_to_array(%agency_id%,',')) and user_id = %user_id%
]]
		, "//cancellations/staff/", { 
		    user_id = user_id,
		    agency_id = sestb.agency
		}
	    )
	else
	    tb, err = func_execute(tran,
[[
select user_id from users 
    where user_id = %user_id%
]]
		, "//cancellations/staff/", { 
		    user_id = user_id
		}
	    )
	end
	return err ~= true and tb ~= nil and #tb == 1 and tb[1].user_id == user_id
    end
    )
end

local function personalize(data)
    local p = {}
    local idx_users = {}
    local idx_heads = {}

    if data.rows ~= nil then
	for i, v in ipairs(data.rows) do
	    v.row_no = i
	    if v.distributors ~= nil then
		v.distributors = core.split(v.distributors, '|')
	    end
	    if v.departments ~= nil then
		v.departments = core.split(v.departments, '|')
	    end

	    idx_users[v.user_id] = 1
	    if v.head_id ~= nil then 
		idx_heads[v.head_id] = 1
	    end
	end
    end

    p.rows = data.rows
    p.mans = {}
    p.mans.users = data._mans.users
    p.mans.canceling_types = data._mans.types
    p.users = core.reduce(data.users, 'user_id', idx_users)
    p.heads = core.reduce(data.users, 'user_id', idx_heads)

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.cancelingtypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.daterange.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/cancellations.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb));
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	tb, err = data(permtb, stor, sestb)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(personalize(tb)))
	end
    elseif method == "POST" then
	local mp
	-- validate input data
	assert(permtb.add ~= nil, "operation does not permitted.")
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(mp.user_id), "invalid [user_id] parameter.")
	assert(validate.isdate(mp.b_date), "invalid [b_date] parameter.")
	assert(validate.isdate(mp.e_date), "invalid [e_date] parameter.")
	assert(validate.isuid(mp.canceling_type_id), "invalid [canceling_type_id] parameter.")
	assert(staff(stor, sestb, mp.user_id), "[user_id] is not in staff.")
	if mp.note == nil then mp.note = stor.NULL end
	-- execute query
	err = post(stor, sestb.erpid or sestb.username, mp._datetime, mp.user_id, mp.b_date, mp.e_date, 
	    mp.canceling_type_id, mp.note)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "PUT" then
	-- validate input data
	assert(permtb.restore ~= nil and permtb.restore == true, "operation does not permitted.")
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(params.route_date), "invalid [route_date] parameter.")
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	-- execute query
	err = restore(stor, sestb.erpid or sestb.username, params._datetime, params.route_date, params.user_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" then
	-- validate input data
	assert(permtb.revoke ~= nil and permtb.revoke == true, "operation does not permitted.")
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.route_date), "invalid [route_date] parameter.")
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	-- execute query
	err = revoke(stor, sestb.erpid or sestb.username, params._datetime, params.route_date, params.user_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
