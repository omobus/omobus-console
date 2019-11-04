-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'


local function get_data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select
    j.validated, j.hidden rejected, a.hidden closed, 
    j.account_id, a.code a_code, a.descr a_name, a.address, j.user_id, u.descr u_name,
    j.validator_id v_code, v.descr v_name, j.fix_dt, j.note, t.descr discard_type, j.route_date, j.activity_type_id
from j_discards j
    left join accounts a on a.account_id = j.account_id
    left join discard_types t on t.discard_type_id = j.discard_type_id
    left join users u on u.user_id = j.user_id
    left join users v on v.user_id = j.validator_id
where
    (
	(j.validated=0 and j.hidden = 0 and a.hidden = 0 and %registered%=1)
	or (j.validated=1 and j.hidden = 0 and a.hidden = 0 and %validated%=1)
	or (j.hidden=1 and a.hidden = 0 and %rejected%=1)
	or (a.hidden=1 and %closed%=1)
    )
    and (%user_id% is null or j.user_id in (select * from my_staff(%user_id%, 1::bool_t)))
    and (%distr_id% is null or u.distr_ids && string_to_array(%distr_id%,',')::uids_t)
    and (%agency_id% is null or u.agency_id=any(string_to_array(%agency_id%,',')))
order by j.fix_dt desc
]]
-- *** sql query: end
    , "//discards/get/"
    , {user_id = sestb.erpid == nil and stor.NULL or sestb.erpid, 
       distr_id = sestb.distributor == null and stor.NULL or sestb.distributor, agency_id = sestb.agency == null and stor.NULL or sestb.agency,
       registered = permtb.registered == true and 1 or 0, validated = permtb.validated == true and 1 or 0, rejected = permtb.rejected == true and 1 or 0,
       closed = permtb.closed == true and 1 or 0})
    end
    )
end

local function accept(stor, uid, account_id, user_id, route_date, activity_type_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_discard(%req_uid%, 'validate', %account_id%, %user_id%, %route_date%, %activity_type_id%)
]]
-- *** sql query: end
        , "//discards/validate/"
        , {req_uid = uid, account_id = account_id, user_id = user_id, route_date = route_date,
	    activity_type_id = activity_type_id})
    end
    )
end

local function reject(stor, uid, account_id, user_id, route_date, activity_type_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_discard(%req_uid%, 'reject', %account_id%, %user_id%, %route_date%, %activity_type_id%)
]]
-- *** sql query: end
        , "//discards/reject/"
        , {req_uid = uid, account_id = account_id, user_id = user_id, route_date = route_date,
	    activity_type_id = activity_type_id})
    end
    )
end

local function ajax_data(permtb, sestb, stor, res)
    local tb, err = get_data(permtb, stor, sestb)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil then
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, "{}")
    else
	for i, v in ipairs(tb) do
	    v.row_no = i
	    v.validated = tonumber(v.validated)
	    v.rejected = tonumber(v.rejected)
	    v.closed = tonumber(v.closed)
	end
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, json.encode(tb))
    end
end

local function ajax_validate(permtb, sestb, params, stor, res)
    -- validate input data
    assert(permtb.validate ~= nil and permtb.validate == true, 
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.account_id), 
	string.format("function %s() >>> PANIC <<< invalid account_id.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.route_date), 
	string.format("function %s() >>> PANIC <<< invalid route_date.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.activity_type_id), 
	string.format("function %s() >>> PANIC <<< invalid activity_type_id.", debug.getinfo(1,"n").name, method))
    -- execute query
    local err = accept(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.account_id, params.user_id, 
	params.route_date, params.activity_type_id)
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
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.account_id), 
	string.format("function %s() >>> PANIC <<< invalid account_id.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.user_id), 
	string.format("function %s() >>> PANIC <<< invalid user_id.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.route_date), 
	string.format("function %s() >>> PANIC <<< invalid route_date.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.activity_type_id), 
	string.format("function %s() >>> PANIC <<< invalid activity_type_id.", debug.getinfo(1,"n").name, method))
    -- execute query
    local err = reject(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.account_id, params.user_id, 
	params.route_date, params.activity_type_id)
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
    <script src="]] .. V.static_prefix .. [[/plugins/discards.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return  "startup($('#pluginContainer')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	ajax_data(permtb.v ~= nil and permtb.v or {registered=true}, sestb, stor, res)
    elseif method == "PUT" then
	ajax_validate(permtb, sestb, params, stor, res)
    elseif method == "DELETE" then
	ajax_reject(permtb, sestb, params, stor, res)
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
