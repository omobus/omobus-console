-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local multipart = require 'multipart'
local validate = require 'validate'


local function get_data(stor)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	tb.rows, err = func_execute(tran,
-- *** sql query: begin
[[
select 
    m.tm_id, m.descr, m.country_id, c.descr country, m.brand_ids[1] brand_id, b.descr brand, b.dep_id, d.descr department, blob_length(m.blob) size, m.author_id, 
    case when u.user_id is null then m.author_id else u.descr end author, m.updated_ts::datetime_t updated_dt
from training_materials m
    left join countries c on c.country_id=m.country_id
    left join brands b on b.brand_id=m.brand_ids[1]
    left join departments d on d.dep_id=b.dep_id
    left join users u on u.user_id=m.author_id
where m.hidden=0
order by m.descr, m.tm_id
]]
-- *** sql query: end
	    , "//training_materials/rows/",
	    {}
	)
	if err == nil or err == false then
	    tb.brands, err = func_execute(tran,
		"select brand_id, descr from brands where hidden=0 order by descr",
	    "//training_materials/brands/")
	end
	if err == nil or err == false then
	    tb.countries, err = func_execute(tran,
		"select country_id, descr from countries where hidden=0 order by descr",
	    "//training_materials/countries/")
	end
	return tb, err
    end
    )
end

local function get_blob(stor, tm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select tm_id, blob pdf from training_materials 
    where tm_id=%tm_id%
]]
-- *** sql query: end
	, "//training_materials/PDF/"
	, {tm_id = tm_id})
    end
    )
end

local function get_author(stor, tm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select author_id from training_materials where tm_id=%tm_id%
]]
-- *** sql query: end
	, "//training_materials/author/"
	, {tm_id = tm_id})
    end
    )
end

local function remove(stor, uid, tm_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
update training_materials set hidden=1 
    where tm_id=%tm_id%
]]
-- *** sql query: end
        , "//training_materials/remove/"
        , {req_uid = uid, tm_id = tm_id})
    end
    )
end

local function post(stor, uid, params, blob)
    params.req_uid = uid
    params.blob = nil
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
insert into training_materials(descr, blob, country_id, brand_ids, dep_id, author_id)
    values(%name%, %1:blob%, %country_id%, string_to_array(%brand_id%,','), (select dep_id from brands where brand_id=%brand_id%), %req_uid%)
]]
-- *** sql query: end
        , "//training_materials/new/"
        , params
	, blob)
    end
    )
end

local function put(stor, uid, params)
    params.req_uid = uid
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
update training_materials set descr=%name%, country_id=%country_id%, brand_ids=string_to_array(%brand_id%,','), dep_id=(select dep_id from brands where brand_id=%brand_id%)
    where tm_id=%tm_id%
]]
-- *** sql query: end
        , "//training_materials/edit/"
        , params)
    end
    )
end


local function ajax_data(sestb, params, stor, res)
    local tb, err
    tb, err = get_data(stor)
    if tb ~= nil and tb.rows ~= nil then
	u_id = iif(sestb.erpid ~= nil, sestb.erpid, sestb.username)
	for i, v in ipairs(tb.rows) do
	    v.row_no = i
	    v.owner = (v.author_id ~= nil and u_id:lower() == v.author_id:lower()) and true or false
	end
    end
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil then
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, "{}")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, json.encode(tb))
    end
end

local function ajax_remove(permtb, sestb, params, stor, res)
    -- validate input data
    assert(validate.isuid(params.tm_id), 
	string.format("function %s() >>> PANIC <<< invalid tm_id.", debug.getinfo(1,"n").name))
    -- check target owner
    if permtb.remove == nil or permtb.remove ~= true then
	local tb, err = get_author(stor, params.tm_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to remove training material created by %s.",
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- execute query
    if remove(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.tm_id) then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_new(permtb, sestb, params, tb, stor, res)
    -- validate input data
    assert(tb, 
	string.format("function %s() >>> PANIC <<< unable to parse multipart data.", debug.getinfo(1,"n").name))
    assert(permtb.add ~= nil,
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(tb.blob, 
	string.format("function %s() >>> PANIC <<< invalid PDF.", debug.getinfo(1,"n").name))
    assert(tb.blob.size > 0, 
	string.format("function %s() >>> PANIC <<< PDF is empty.", debug.getinfo(1,"n").name))
    assert(tb.blob.size <= permtb.add.max_file_size_mb*1024*1024, 
	string.format("function %s() >>> PANIC <<< PDF should be less then %d MB.", debug.getinfo(1,"n").name,
	permtb.add.max_file_size_mb*1024*1024))
    assert(#tb.name,
	string.format("function %s() >>> PANIC <<< invalid name.", debug.getinfo(1,"n").name))
    assert(tb.country_id == nil or validate.isuid(tb.country_id), 
	string.format("function %s() >>> PANIC <<< invalid country_id.", debug.getinfo(1,"n").name))
    assert(tb.brand_id == nil or validate.isuid(tb.brand_id), 
	string.format("function %s() >>> PANIC <<< invalid brand_id.", debug.getinfo(1,"n").name))
    -- set unknown values
    if tb.country_id == nil or #tb.country_id == 0 then tb.country_id = stor.NULL end
    if tb.brand_id == nil or #tb.brand_id == 0 then tb.brand_id = stor.NULL end
    -- execute query
    if post(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), tb, tb.blob.contents) then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_edit(permtb, sestb, params, tb, stor, res)
    -- validate input data
    assert(validate.isuid(params.tm_id), 
	string.format("function %s() >>> PANIC <<< invalid tm_id.", debug.getinfo(1,"n").name))
    assert(tb, 
	string.format("function %s() >>> PANIC <<< unable to parse multipart data.", debug.getinfo(1,"n").name))
    assert(tb.tm_id == params.tm_id, 
	string.format("function %s() >>> PANIC <<< invalid input parameters.", debug.getinfo(1,"n").name))
    assert(#tb.name,
	string.format("function %s() >>> PANIC <<< invalid name.", debug.getinfo(1,"n").name))
    assert(tb.country_id == nil or validate.isuid(tb.country_id), 
	string.format("function %s() >>> PANIC <<< invalid country_id.", debug.getinfo(1,"n").name))
    assert(tb.brand_id == nil or validate.isuid(tb.brand_id), 
	string.format("function %s() >>> PANIC <<< invalid brand_id.", debug.getinfo(1,"n").name))
    -- check target owner
    if permtb.edit == nil or permtb.edit ~= true then
	local tb, err = get_author(stor, params.tm_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to edit training material created by %s.",
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- set unknown values
    if tb.country_id == nil or #tb.country_id == 0 then tb.country_id = stor.NULL end
    if tb.brand_id == nil or #tb.brand_id == 0 then tb.brand_id = stor.NULL end
    -- execute query
    if put(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), tb) then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_blob(params, stor, res)
    -- validate input data
    assert(validate.isuid(params.tm_id), 
	string.format("function %s() >>> PANIC <<< invalid tm_id.", debug.getinfo(1,"n").name))
    -- execute query
    local tb, err = get_blob(stor, params.tm_id)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil or #tb ~= 1 then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Invalid input parameters")
    else
	scgi.writeHeader(res, 200, {
	    ["Content-Type"] = mime.pdf,
	    ["Content-Disposition"] = "inline; filename=\"" .. params.tm_id .. ".pdf\""
	    })
	scgi.writeBody(res, tb[1].pdf)
    end
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    return [[
    <link rel="stylesheet" href="]] .. V.static_prefix .. [[/colorbox.css" />
    <script src="]] .. V.static_prefix .. [[/libs/jquery-2.1.1.js"> </script>
    <script src="]] .. V.static_prefix .. [[/dailycalendar.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/training_materials.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup($('#pluginContainer')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	if params.blob ~= nil then
	    ajax_blob(params, stor, res)
	else
	    ajax_data(sestb, params, stor, res)
	end
    elseif method == "DELETE" then
	ajax_remove(permtb, sestb, params, stor, res)
    elseif method == "POST" then
	assert(string.find(content_type, "multipart/form-data", 1, true), 
	    string.format("function %s(%s) >>> PANIC <<< unsupported content type (expected: %s, received: %s).", 
	    debug.getinfo(1,"n").name, method, "multipart/form-data", content_type))
	ajax_new(permtb, sestb, params, multipart.parse(content, content_type), stor, res)
    elseif method == "PUT" then
	assert(string.find(content_type, "multipart/form-data", 1, true), 
	    string.format("function %s(%s) >>> PANIC <<< unsupported content type (expected: %s, received: %s).", 
	    debug.getinfo(1,"n").name, method, "multipart/form-data", content_type))
	ajax_edit(permtb, sestb, params, multipart.parse(content, content_type), stor, res)
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
