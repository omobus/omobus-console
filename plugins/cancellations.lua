-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local uri = require 'url'
local validate = require 'validate'


local function get_calendar(stor, sestb)
    local q = "select left(min(route_date), 4) y, substring(min(route_date), 6, 2) m, count(*) qty from j_cancellations"
    if sestb.erpid ~= nil then
	q = q .. " where user_id in (select * from my_staff(%user_id%, 1::bool_t))"
    elseif sestb.department ~= nil then
	q = q .. " where user_id in (select user_id from users where hidden=0 and dep_ids && string_to_array(%dep_id%,',')::uids_t)"
    elseif sestb.distributor ~= nil then
	q = q .. " where user_id in (select user_id from users where hidden=0 and distr_ids && string_to_array(%distr_id%,',')::uids_t)"
    elseif sestb.agency ~= nil then
	q = q .. " where user_id in (select user_id from users where hidden=0 and agency_id=any(string_to_array(%agency_id%,',')))"
    end
    q = q .. " group by left(route_date, 7)"
    q = q .. " order by 1 desc, 2 desc"

    return stor.get(function(tran, func_execute) return func_execute(tran, q,
        "//cancellations/calendar/", {user_id=sestb.erpid, dep_id=sestb.department, distr_id=sestb.distributor, agency_id=sestb.agency})
    end
    )
end

local function get_data(stor, sestb, year, month)
    return stor.get(function(tran, func_execute)
	local tb, err, q
	tb = {}
	q =
[[
select 
    j.user_id, u.descr u_name, j.route_date, j.canceling_type_id, t.descr canceling_type, j.note, j.hidden 
from j_cancellations j
    left join users u on u.user_id = j.user_id
    left join canceling_types t on t.canceling_type_id = j.canceling_type_id
where j.route_date>="monthDate_First"('%y%-%m%-01')::date_t and j.route_date<="monthDate_Last"('%y%-%m%-01')::date_t
]]
	if sestb.erpid ~= nil then
	    q = q .. " and j.user_id in (select * from my_staff(%user_id%, 1::bool_t))"
	elseif sestb.department ~= nil then
	    q = q .. " and u.dep_ids && string_to_array(%dep_id%,',')::uids_t"
	elseif sestb.distributor ~= nil then
	    q = q .. " and u.distr_ids && string_to_array(%distr_id%,',')::uids_t"
	elseif sestb.agency ~= nil then
	    q = q .. " and u.agency_id=any(string_to_array(%agency_id%,','))"
	end
	q = q .. " order by j.route_date desc, u.descr"

	tb.cancellations, err = func_execute(tran, q, "//cancellations/j/", 
	    {user_id = sestb.erpid, dep_id = sestb.department, distr_id = sestb.distributor, agency_id = sestb.agency, y = year, m = month});
	if err == nil or err == false then
	    if sestb.erpid ~= nil then
		tb.users, err = func_execute(tran,
		    "select s.s user_id, u.descr, u.dev_login from my_staff(%user_id%, 1::bool_t) s "..
			"left join users u on u.user_id=s.s where u.hidden=0",
		    "//cancellations/users/", {user_id = sestb.erpid})
	    elseif sestb.department ~= nil then
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login from users " ..
			"where hidden=0 and dep_ids && string_to_array(%dep_id%,',')::uids_t order by descr",
		    "//cancellations/users/", {dep_id = sestb.department})
	    elseif sestb.distributor ~= nil then
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login from users " ..
			"where hidden=0 and distr_ids && string_to_array(%distr_id%,',')::uids_t order by descr",
		    "//cancellations/users/", {distr_id = sestb.distributor})
	    elseif sestb.agency ~= nil then
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login from users " ..
			"where hidden=0 and agency_id=any(string_to_array(%agency_id%,',')) order by descr",
		    "//cancellations/users/", {agency_id = sestb.agency})
	    else
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login from users " ..
			"where hidden=0 order by descr",
		    "//cancellations/users/")
	    end
	end
	if err == nil or err == false then
	    tb.types, err = func_execute(tran,
		"select canceling_type_id, descr from canceling_types where hidden=0 order by descr",
		"//cancellations/canceling_types/")
	end
	return tb, err
    end
    )
end

local function restore(stor, uid, route_date, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_canceling(%req_uid%, 'restore', %user_id%, %route_date%)
]]
-- *** sql query: end
        , "//cancellations/restore/"
        , {req_uid = uid, route_date = route_date, user_id = user_id})
    end
    )
end

local function reject(stor, uid, route_date, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_canceling(%req_uid%, 'revoke', %user_id%, %route_date%)
]]
-- *** sql query: end
        , "//cancellations/reject/"
        , {req_uid = uid, route_date = route_date, user_id = user_id})
    end
    )
end

local function post(stor, uid, user_id, b_date, e_date, type_id, note)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_canceling(%req_uid%, %user_id%, %type_id%, %b_date%, %e_date%, %note%)
]]
-- *** sql query: end
        , "//cancellations/new/"
        , {req_uid = uid, user_id = user_id, b_date = b_date, e_date = e_date, type_id = type_id, note = note})
    end
    )
end


local function row_id(v)
    local crc = hash.crc64()
    crc:calc(iif(v.u_name~=nil,v.u_name,'-') .. ':' .. v.user_id .. ':' .. v.route_date);
    return crc:get()
end

local function ajax_data(sestb, params, stor, res)
    local tb, err, f
    if params.calendar ~= nil then
	tb, err = get_calendar(stor, sestb)
    else
	f = true
	-- validate input data
	assert(params.year ~= nil, 
	    string.format("function %s() >>> PANIC <<< year is undefined.", debug.getinfo(1,"n").name))
	assert(params.month ~= nil,
	     string.format("function %s()>>> PANIC <<< month is undefined.", debug.getinfo(1,"n").name))
	params.year = tonumber(params.year)
	params.month = tonumber(params.month)
	assert(params.month >= 1 and params.month <= 12, 
	    string.format("function %s() >>> PANIC <<< month should be between 1 and 12.", debug.getinfo(1,"n").name))
	-- execute query
	tb, err = get_data(stor, sestb, params.year, params.month)
    end
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil then
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, "{}")
    else
	if f == true and tb.cancellations ~= nil then 
	    for i, v in ipairs(tb.cancellations) do
		v.row_id = row_id(v) 
		v.row_no = i
		v.hidden = tonumber(v.hidden)
	    end
	end
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, json.encode(tb))
    end
end

local function ajax_restore(permtb, sestb, params, stor, res)
    -- validate input data
    assert(permtb.restore ~= nil and permtb.restore == true, 
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name))
    assert(validate.isdate(params.route_date), 
	string.format("function %s() >>> PANIC <<< invalid route_date.", debug.getinfo(1,"n").name))
    -- execute query
    local err = restore(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.route_date, params.user_id)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_reject(permtb, sestb, params, stor, res)
    -- validate input data
    assert(permtb.reject ~= nil and permtb.reject == true, 
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name))
    assert(validate.isdate(params.route_date), 
	string.format("function %s() >>> PANIC <<< invalid route_date.", debug.getinfo(1,"n").name))
    -- execute query
    local err = reject(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.route_date, params.user_id)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_new(permtb, sestb, params, content, stor, res)
    local p = nil
    if type(content) == "string" then p = uri.parseQuery(content) end
    -- validate input data
    assert(permtb.add ~= nil,
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name))
    assert(p ~= nil and p.user_id == params.user_id, 
	string.format("function %s() >>> PANIC <<< invalid input parameters.", debug.getinfo(1,"n").name))
    assert(validate.isdate(p.b_date), 
	string.format("function %s() >>> PANIC <<< invalid b_date.", debug.getinfo(1,"n").name))
    assert(validate.isdate(p.e_date), 
	string.format("function %s() >>> PANIC <<< invalid e_date.", debug.getinfo(1,"n").name))
    assert(validate.isuid(p.canceling_type_id), 
	string.format("function %s() >>> PANIC <<< invalid canceling_type_id.", debug.getinfo(1,"n").name))
    if p.note == nil then p.note = "" end
    -- execute query
    local err = post(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.user_id, 
	p.b_date, p.e_date, p.canceling_type_id, p.note)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    return [[
    <script src="]] .. V.static_prefix .. [[/libs/jquery-2.1.1.js"> </script>
    <script src="]] .. V.static_prefix .. [[/dailycalendar.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/cancellations.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return 
	((params.y~=nil and params.m~=nil) and "" or "var d = new Date();") ..
	"startup($('#pluginContainer')," ..
	((params.y~=nil and params.m~=nil) and (params.y..","..params.m..",") or "d.getYear()+1900,d.getMonth()+1,") ..
	json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	ajax_data(sestb, params, stor, res)
    elseif method == "POST" then
	ajax_new(permtb, sestb, params, content, stor, res)
    elseif method == "PUT" then
	ajax_restore(permtb, sestb, params, stor, res)
    elseif method == "DELETE" then
	ajax_reject(permtb, sestb, params, stor, res)
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
