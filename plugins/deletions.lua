-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'


local function data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs
	tb = {}
	qs =
[[
select
    j.validated, j.hidden rejected, a.hidden closed, 
    j.account_id, a.code a_code, a.descr a_name, a.address,
    /*reg.descr region,*/
    /*c.descr city,*/
    a.rc_id, r.descr rc, r.ka_type,
    a.poten_id, p.descr poten,
    a.chan_id, ch.descr chan,
    j.user_id, u.descr u_name, u.dev_login, u.area,
    j.validator_id v_code, v.descr v_name,
    j.fix_dt, 
    j.note,
    j.photo::varchar,
    u.executivehead_id head_id, ex.descr head_name
from j_deletions j
    left join accounts a on a.account_id = j.account_id
    left join potentials p on a.poten_id = p.poten_id
    left join channels ch on a.chan_id = ch.chan_id
    left join retail_chains r on a.rc_id = r.rc_id
    /*left join regions reg on a.region_id = reg.region_id*/
    /*left join cities c on a.city_id = c.city_id*/
    left join users u on u.user_id = j.user_id
    left join users ex on ex.user_id = u.executivehead_id
    left join users v on v.user_id = j.validator_id
where
    $(0)(
	(j.validated = 0 and j.hidden = 0 and a.hidden = 0 and %registered% = 1)
	or (j.validated = 1 and j.hidden = 0 and a.hidden = 0 and %validated% = 1)
	or (j.hidden = 1 and a.hidden = 0 and %rejected% = 1)
	or (a.hidden = 1 and %closed% = 1)
    )
order by j.inserted_ts desc, j.fix_dt desc
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "j.user_id in (select * from my_staff(%user_id%, 0::bool_t)) and "),
		"/plugins/deletions/get", { user_id = sestb.erpid,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0,
		    closed = (permtb.data ~= nil and permtb.data.closed == true) and 1 or 0
		})
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "(%dep_id% is null or u.dep_ids is null or u.dep_ids && string_to_array(%dep_id%,',')::uids_t) and (%country_id% is null or (u.country_id=any(string_to_array(%country_id%,',')::uids_t))) and "),
		"/plugins/deletions/get", { 
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0,
		    closed = (permtb.data ~= nil and permtb.data.closed == true) and 1 or 0
		})
	elseif sestb.distributor ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "u.distr_ids && string_to_array(%distr_id%,',')::uids_t and "),
		"/plugins/deletions/get", { distr_id = sestb.distributor,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0,
		    closed = (permtb.data ~= nil and permtb.data.closed == true) and 1 or 0
		})
	elseif sestb.agency ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "u.agency_id = any(string_to_array(%agency_id%,',')) and "),
		"/plugins/deletions/get", { agency_id = sestb.agency,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0,
		    closed = (permtb.data ~= nil and permtb.data.closed == true) and 1 or 0
		})
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"/plugins/deletions/get", {
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0,
		    closed = (permtb.data ~= nil and permtb.data.closed == true) and 1 or 0
		})
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "/plugins/deletions/users/"
	    )
	end
	if (permtb.columns or {}).channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "/plugins/deletions/channels/"
	    )
	end
	if (permtb.columns or {}).potential == true and (err == nil or err == false) then
	    tb.potentials, err = func_execute(tran,
[[
select poten_id, descr, hidden from potentials
    order by descr
]]
		, "/plugins/deletions/potentials/"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_type, hidden from retail_chains
    order by descr
]]
		, "/plugins/deletions/retail_chains/"
	    )
	end
	return tb, err
    end
    )
end

local function photo(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select photo_get(%blob_id%::blob_t) photo
]]
	, "/plugins/deletions/photo", {blob_id = blob_id})
    end
    )
end

local function accept(stor, uid, reqdt, account_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_deletion(%req_uid%, %req_dt%, 'validate', %account_id%)
]]
	, "/plugins/deletions/validate/"
	, {req_uid = uid, req_dt = reqdt, account_id = account_id})
    end
    )
end

local function reject(stor, uid, reqdt, account_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_deletion(%req_uid%, %req_dt%, 'reject', %account_id%)
]]
	, "/plugins/deletions/reject/"
	, {req_uid = uid, req_dt = reqdt, account_id = account_id})
    end
    )
end

local function personalize(data)
    local p = {}
    local idx_users = {}
    local idx_channels = {}
    local idx_potens = {}
    local idx_rcs = {}
    local idx_heads = {}

    for i, v in ipairs(data.rows) do
	v.row_no = i

	idx_users[v.user_id] = 1
	if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
	if v.poten_id ~= nil then idx_potens[v.poten_id] = 1; end
	if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
	if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
    end

    p.rows = data.rows
    p.users = core.reduce(data.users, 'user_id', idx_users)
    p.heads = core.reduce(data.users, 'user_id', idx_heads)
    p.channels = core.reduce(data.channels, 'chan_id', idx_channels)
    p.potentials = core.reduce(data.potentials, 'poten_id', idx_potens)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', idx_rcs)

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/lazyload-12.4.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.potentials.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/deletions.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb));
end

function M.data(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.blob ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.blob_id), "invalid [blob_id] parameter.")
	    -- execute query
	    tb, err = photo(stor, params.blob_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 or tb[1].photo == nil then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].photo)
	    end
	else
	    tb, err = data(permtb, stor, sestb)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or tb.rows == nil or #tb.rows == 0 then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, json.encode(personalize(tb)))
	    end
	end
    elseif method == "PUT" then
	-- validate input data
	assert(permtb.validate ~= nil and permtb.validate == true, "operation does not permitted.")
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.account_id), "invalid [account_id] parameter.")
	-- execute query
	err = accept(stor, sestb.erpid or sestb.username, params._datetime, params.account_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" then
	-- validate input data
	assert(permtb.reject ~= nil and permtb.reject == true, "operation does not permitted.")
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.account_id), "invalid [account_id] parameter.")
	-- execute query
	err = reject(stor, sestb.erpid or sestb.username, params._datetime, params.account_id)
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
