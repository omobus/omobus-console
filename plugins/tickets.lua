-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local uri = require 'url'
local validate = require 'validate'


local function get_data(stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	tb.tickets, err = func_execute(tran,
-- *** sql query: begin
[[
select j.ticket_id, j.user_id, u.descr u_name, j.issue_id, i.descr issue, j.note, j.resolution, j.closed, j.inserted_ts::datetime_t fix_dt from tickets j
    left join users u on u.user_id = j.user_id
    left join issues i on i.issue_id = j.issue_id
where (%user_id% is null or j.user_id in (select * from my_staff(%user_id%, 1::bool_t)))
    and (%distr_id% is null or u.distr_ids && string_to_array(%distr_id%,',')::uids_t)
    and (%agency_id% is null or u.agency_id=any(string_to_array(%agency_id%,',')))
order by j.closed, j.ticket_id::int desc
]]
-- *** sql query: end
	    , "//tickets/tickets/"
	    , {user_id = sestb.erpid == nil and stor.NULL or sestb.erpid, distr_id = sestb.distributor == null and stor.NULL or sestb.distributor,
	       agency_id = sestb.agency == null and stor.NULL or sestb.agency}
	)
	if err == nil or err == false then
	    if sestb.erpid ~= nil then
		tb.users, err = func_execute(tran,
		    "select s.s user_id, u.descr, u.dev_login, u.hidden from my_staff(%user_id%, 1::bool_t) s "..
			"left join users u on u.user_id=s.s order by u.descr",
		    "//tickets/users/", {user_id = sestb.erpid})
	    elseif sestb.distributor ~= nil then
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login, hidden from users " ..
			"where distr_ids && string_to_array(%distr_id%,',')::uids_t order by descr",
		    "//tickets/users/", {distr_id = sestb.distributor})
	    elseif sestb.agency ~= nil then
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login, hidden from users " ..
			"where agency_id=any(string_to_array(%agency_id%,',')) order by descr",
		    "//tickets/users/", {agency_id = sestb.agency})
	    else
		tb.users, err = func_execute(tran,
		    "select user_id, descr, dev_login, hidden from users " ..
			"order by descr",
		    "//tickets/users/")
	    end
	end
	if err == nil or err == false then
	    tb.issues, err = func_execute(tran, 
		"select issue_id, descr, extra_info hint from issues where hidden=0 order by row_no, descr", 
		"//tickets/issues/")
	end
	return tb, err
    end
    )
end

local function resolution(stor, uid, ticket_id, note)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_resolution(%req_uid%, %ticket_id%, %note%)
]]
-- *** sql query: end
        , "//tickets/resolution/"
        , {req_uid = uid, ticket_id = ticket_id, note = note})
    end
    )
end

local function post(stor, uid, user_id, issue_id, note, closed)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_ticket(%req_uid%, %user_id%, %issue_id%, %note%, %closed%)
]]
-- *** sql query: end
        , "//tickets/new/"
        , {req_uid = uid, user_id = user_id, issue_id = issue_id, closed = closed, note = note})
    end
    )
end

local function ajax_data(sestb, params, stor, res)
    local tb, err
    tb, err = get_data(stor, sestb)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil then
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, "{}")
    else
	if tb.users ~= nil then
	    for i, v in ipairs(tb.users) do
		v.hidden = tonumber(v.hidden)
	    end
	end
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, json.encode(tb))
    end
end

local function ajax_resolution(permtb, sestb, params, content, stor, res)
    local p = nil
    if type(content) == "string" then p = uri.parseQuery(content) end
    -- validate input data
    assert(permtb.resolution ~= nil and permtb.resolution == true, 
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(validate.isuid(params.ticket_id), 
	string.format("function %s() >>> PANIC <<< invalid ticket_id.", debug.getinfo(1,"n").name))
    assert(p.note ~= nil and #p.note >= permtb.min_resolution_length, 
	string.format("function %s() >>> PANIC <<< invalid resolution note.", debug.getinfo(1,"n").name))

    if p.note == nil then p.note = "" end
    -- execute query
    local err = resolution(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.ticket_id, p.note)
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
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name))
    assert(p ~= nil and p.user_id == params.user_id, 
	string.format("function %s() >>> PANIC <<< invalid input parameters.", debug.getinfo(1,"n").name))
    assert(validate.isuid(p.issue_id), 
	string.format("function %s() >>> PANIC <<< invalid issue_id.", debug.getinfo(1,"n").name))
    if p.note == nil then p.note = "" end
    if p.closed == nil then p.closed = 0 end
    -- execute query
    local err = post(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.user_id, 
	p.issue_id, p.note, p.closed)
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
    <link rel="stylesheet" href="]] .. V.static_prefix .. [[/colorbox.css" />
    <script src="]] .. V.static_prefix .. [[/libs/jquery-2.1.1.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/tickets.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup($('#pluginContainer')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	ajax_data(sestb, params, stor, res)
    elseif method == "POST" then
	ajax_new(permtb, sestb, params, content, stor, res)
    elseif method == "PUT" then
	ajax_resolution(permtb, sestb, params, content, stor, res)
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
