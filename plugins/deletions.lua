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
    j.validator_id v_code, v.descr v_name, j.fix_dt, j.note, j.photo::varchar blob_id
from j_deletions j
    left join accounts a on a.account_id = j.account_id
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
    and (%dep_id% is null or u.dep_ids && string_to_array(%dep_id%,',')::uids_t)
    and (%distr_id% is null or u.distr_ids && string_to_array(%distr_id%,',')::uids_t)
    and (%agency_id% is null or u.agency_id=any(string_to_array(%agency_id%,',')))
order by j.fix_dt desc
]]
-- *** sql query: end
    , "//deletions/get/"
    , {user_id = sestb.erpid == nil and stor.NULL or sestb.erpid, 
       dep_id = sestb.department == null and stor.NULL or sestb.department, 
       distr_id = sestb.distributor == null and stor.NULL or sestb.distributor, 
       agency_id = sestb.agency == null and stor.NULL or sestb.agency,
       registered = permtb.registered == true and 1 or 0, validated = permtb.validated == true and 1 or 0, rejected = permtb.rejected == true and 1 or 0,
       closed = permtb.closed == true and 1 or 0})
    end
    )
end

local function photo_get(stor, account_id, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select account_id, photo from j_deletions where account_id=%account_id% and photo=%blob_id%
]]
-- *** sql query: end
        , "//deletions/photo/"
        , {account_id = account_id, blob_id = blob_id})
    end
    )
end

local function accept(stor, uid, account_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_deletion(%req_uid%, 'validate', %account_id%)
]]
-- *** sql query: end
        , "//deletions/validate/"
        , {req_uid = uid, account_id = account_id})
    end
    )
end

local function reject(stor, uid, account_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_deletion(%req_uid%, 'reject', %account_id%)
]]
-- *** sql query: end
        , "//deletions/reject/"
        , {req_uid = uid, account_id = account_id})
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

local function ajax_photo(params, stor, res)
    -- validate input data
    assert(validate.isuid(params.account_id), 
	string.format("function %s() >>> PANIC <<< invalid account_id.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.blob_id), 
	string.format("function %s() >>> PANIC <<< invalid blob_id.", debug.getinfo(1,"n").name, method))
    -- execute query
    local tb, err = photo_get(stor, params.account_id, params.blob_id)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil or #tb ~= 1 then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Invalid input parameters")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
	scgi.writeBody(res, tb[1].photo)
    end
end

local function ajax_validate(permtb, sestb, params, stor, res)
    -- validate input data
    assert(permtb.validate ~= nil and permtb.validate == true, 
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name, method))
    assert(validate.isuid(params.account_id), 
	string.format("function %s() >>> PANIC <<< invalid account_id.", debug.getinfo(1,"n").name, method))
    -- execute query
    local err = accept(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.account_id)
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
    -- execute query
    local err = reject(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.account_id)
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
    <script src="]] .. V.static_prefix .. [[/libs/jquery.colorbox-1.5.14.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/deletions.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup($('#pluginContainer')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	if params.blob == nil then 
	    ajax_data(permtb.v ~= nil and permtb.v or {registered=true}, sestb, stor, res)
	else
	    ajax_photo(params, stor, res)
	end
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
