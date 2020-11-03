-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local core = require 'core'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local uri = require 'url'
local validate = require 'validate'
local zlib = require 'zlib'


local function data(stor, sestb, year, month, uid)
    return stor.get(function(tran, func_execute)
	local tb, err = {}, nil

	tb.months, err = func_execute(tran,
[[
select distinct extract(year from p_date::date) "year", extract(month from p_date::date) "month" from schedules
    where hidden=0
order by "year" desc, "month" desc
]]
	    , "//scheduler/months/"
	)
	if not (err == nil or err == false) then
	    return nil, err
	end

        if sestb.erpid ~= nil then
	    tb.users, err = func_execute(tran,
[[
select s user_id, u.descr, u.dev_login from my_staff(%user_id%, 1::bool_t) s 
    left join users u on u.user_id=s
where u.hidden=0 and s in (select distinct user_id from schedules where hidden=0)
]]
		, "//scheduler/users/"
		, {user_id = sestb.erpid}
	    )
        elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 
	and (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
order by descr
]]
		, "//scheduler/users/"
		, {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
        elseif sestb.distributor ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 and distr_ids && string_to_array(%distr_id%,',')::uids_t and user_id in (select distinct user_id from schedules where hidden=0)
order by descr
]]
		, "//scheduler/users/"
		, {distr_id = sestb.distributor}
	    )
        elseif sestb.agency ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 and agency_id=any(string_to_array(%agency_id%,',')) and user_id in (select distinct user_id from schedules where hidden=0)
order by descr
]]
		, "//scheduler/users/"
		, {agency_id = sestb.agency})
        else
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 and user_id in (select distinct user_id from schedules where hidden=0)
order by descr
]]
		, "//scheduler/users/"
	    )
        end
	if not (err == nil or err == false) then
	    return nil, err
	end

	if not (tb.months ~= nil and #tb.months >= 1 and tb.users ~= nil and #tb.users >= 1) then
	    return nil, err
	end

	if year == nil or month == nil then
	    local ptr = tb.months[1]
	    year = ptr.year
	    month = ptr.month
	end

	if uid == nil then
	    uid = tb.users[1].user_id
	else
	    local f, v
	    for _, v in ipairs(tb.users) do
		if v.user_id == uid then
		    f = true
		end
	    end
	    if not f then
		return nil, err
	    end
	end

	tb.month = month
	tb.year = year
	tb.user_id = uid

        if sestb.erpid ~= nil then
	    tb.employees, err = func_execute(tran,
[[
select s user_id, u.descr, u.dev_login from my_staff(%user_id%, 0::bool_t) s 
    left join users u on u.user_id=s
where u.hidden=0
]]
		, "//scheduler/employees/"
		, {user_id = uid}
	    )
	end
	if not (err == nil or err == false) then
	    return nil, err
	end

	tb.sched, err = func_execute(tran,
[[
select 
    p_date,
    extract(day from p_date::date) mday,
    x.closed,
    case 
	when s.h_date is not null then s.descr
	when t.descr is not null and NIL(trim(c.note)) is not null then format('%s (%s)', t.descr, c.note)
	else coalesce(t.descr, c.note)
    end canceling_note
from schedules x
    left join j_cancellations c on c.route_date = x.p_date and c.user_id = x.user_id and c.hidden = 0
    left join canceling_types t on t.canceling_type_id = c.canceling_type_id
    left join users u on u.user_id = x.user_id
    left join sysholidays s on s.h_date = x.p_date and s.country_id = u.country_id and s.hidden = 0
where x.user_id = %user_id% and '%y%-%m%-01'::date::date_t <= x.p_date and x.p_date <= "monthDate_Last"('%y%-%m%-01')::date_t and x.hidden = 0
order by mday
]]
	    , "//scheduler/data/"
	    , {user_id = uid, y = year, m = month}
	)
	if not (err == nil or err == false) then
	    return nil, err
	end

	tb.jobs = {}
	for i = 1,4 do
	    local t
	    t, err = func_execute(tran,
[[
select x.p_date, j.key, j.value
    from schedules x, each(jobs[%num%]) j
where x.user_id = %user_id% and '%y%-%m%-01'::date::date_t <= x.p_date and x.p_date <= "monthDate_Last"('%y%-%m%-01')::date_t and x.hidden = 0 and j.value is not null and trim(j.value)<>''
    union
select x.p_date, 'employee_name', u.descr "value"
    from schedules x, each(jobs[%num%]) j, users u
where x.user_id = %user_id% and '%y%-%m%-01'::date::date_t <= x.p_date and x.p_date <= "monthDate_Last"('%y%-%m%-01')::date_t and x.hidden = 0 and j.value is not null and trim(j.value)<>''
    and j.key = 'employee_id' and u.user_id = j.value
order by p_date, key
]]
		, string.format("//scheduler/jobs_%d/", i)
		, {user_id = uid, y = year, m = month, num = i}
	    )
	    if not (err == nil or err == false) then
		return nil, err
	    else
		table.insert(tb.jobs, t);
	    end
	end

	return tb, err
    end
    )
end

local function set(stor, uid, reqdt, user_id, p_date, num, type, employee_id, a_name)
    return stor.get(function(tran, func_execute)
	return func_execute(tran,
[[
select * from console.req_schedule(%req_uid%, %req_dt%, %user_id%, %p_date%, %num%, array['type',%type%::text,'employee_id',%employee_id%::text,'a_name',%a_name%::text]) rows
]]
	    , "//scheduler/set/"
	    , {
		req_uid = uid, 
		req_dt = reqdt,
		user_id = user_id, 
		p_date = p_date, 
		num = num,
		type = type,
		employee_id = employee_id or stor.NULL, 
	        a_name = a_name or stor.NULL
	    }
	)
    end, false)
end

local function drop(stor, uid, reqdt, user_id, p_date, num)
    return stor.get(function(tran, func_execute)
	return func_execute(tran,
[[
select * from console.req_schedule(%req_uid%, %req_dt%, %user_id%, %p_date%, %num%) rows
]]
	    , "//scheduler/drop/"
	    , {
		req_uid = uid, 
		req_dt = reqdt,
		user_id = user_id, 
		p_date = p_date, 
		num = num
	    }
	)
    end, false)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.monthcal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/scheduler.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    if params.year ~= nil and type(params.year) ~= 'number' then
	params.year = tonumber(params.year)
    end
    if params.month ~= nil and type(params.month) ~= 'number' then
	params.month = tonumber(params.month)
    end
    if params.year ~= nil and params.month ~= nil and validate.isuid(params.user_id) then
	return string.format("startup(%s,%s);", json.encode({year=params.year, month=params.month, user_id=params.user_id}), 
	    json.encode(permtb))
    else
	return string.format("startup(null,%s);", json.encode(permtb))
    end
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	-- validate input data
        params.year = tonumber(params.year)
        params.month = tonumber(params.month)
	assert(params.user_id == nil or validate.isuid(params.user_id), "invalid [user_id] parameter.")
        assert(params.month == nil or (params.month >= 1 and params.month <= 12), "[month] parameter should be between 1 and 12.")
	-- execute query
	local tb, err = data(stor, sestb, params.year, params.month, params.user_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil then
	    scgi.writeHeader(res, 403, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Not permitted")
	else
	    local idx, v = {}, nil
	    tb.days = {}
	    for _, v in ipairs(tb.sched or {}) do
		tb.days[ tostring(v.mday) ] = v
		v.mday = nil
		v.jobs = {{},{},{},{}}
		idx[v.p_date] = v
	    end
	    for i, x in ipairs(tb.jobs) do
		for _, j in ipairs(x) do
		    idx[j.p_date].jobs[i][j.key] = j.value
		end
	    end
	    tb.jobs = nil
	    tb.sched = nil
	    tb.myself = sestb.erpid ~= nil and sestb.erpid == tb.user_id
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(tb))
	end
    elseif method == "PUT" then
	local types = {"office","account","audit","coaching"}
	local p = type(content) == "string" and uri.parseQuery(content) or {}
	params.num = tonumber(params.num)
	-- validate input data
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	assert(validate.isdate(params.date), "invalid [date] parameter.")
	assert(1 <= params.num and params.num <= 4, "[num] parameter should be between 1 and 4.")
	assert(core.contains(types, p.type), "unsupported [type] attribute.")
	assert(p.employee_id == nil or validate.isuid(p.employee_id), "invalid [employee_id] parameter.")
	-- execute query
	if sestb.erpid ~= nil and sestb.erpid == params.user_id then
	    local tb, err = set(stor, sestb.erpid or sestb.username, params._datetime, params.user_id, params.date, params.num, 
		p.type, p.employee_id, p.a_name)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"Internal server error\"}")
	    else
		local x = {}
		x.updated_rows = (tb == nil or #tb ~= 1 or tb[1].rows == nil) and 0 or tb[1].rows
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, json.encode(x))
	    end
	else
	    scgi.writeHeader(res, 403, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "{\"status\":\"Not permitted\"}")
	end
    elseif method == "DELETE" then
	params.num = tonumber(params.num)
	-- validate input data
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	assert(validate.isdate(params.date), "invalid [date] parameter.")
	assert(1 <= params.num and params.num <= 4, "[num] parameter should be between 1 and 4.")
	-- execute query
	if sestb.erpid ~= nil and sestb.erpid == params.user_id then
	    local tb, err = drop(stor, sestb.erpid or sestb.username, params._datetime, params.user_id, params.date, params.num)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"Internal server error\"}")
	    else
		local x = {}
		x.updated_rows = (tb == nil or #tb ~= 1 or tb[1].rows == nil) and 0 or tb[1].rows
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, json.encode(x))
	    end
	else
	    scgi.writeHeader(res, 403, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "{\"status\":\"Not permitted\"}")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
