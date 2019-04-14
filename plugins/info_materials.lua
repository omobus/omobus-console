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
    m.infom_id, m.descr, m.country_id, c.descr country, m.rc_id, r.descr retail_chain, m.dep_id, d.descr department, m.b_date, m.e_date, 
    blob_length(m.blob) size, m.author_id, case when u.user_id is null then m.author_id else u.descr end author, m.updated_ts::datetime_t updated_dt
from info_materials m
    left join countries c on c.country_id=m.country_id
    left join departments d on d.dep_id=m.dep_id
    left join retail_chains r on r.rc_id=m.rc_id
    left join users u on u.user_id=m.author_id
where m.hidden=0
order by m.row_no, m.descr, m.infom_id
]]
-- *** sql query: end
	    , "//info_materials/rows/",
	    {}
	)
	if err == nil or err == false then
	    tb.departments, err = func_execute(tran,
		"select dep_id, descr from departments where hidden=0 order by descr",
	    "//info_materials/departments/")
	end
	if err == nil or err == false then
	    tb.countries, err = func_execute(tran,
		"select country_id, descr from countries where hidden=0 order by descr",
	    "//info_materials/countries/")
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
		"select rc_id, descr, ka_code from retail_chains where hidden=0 order by descr",
	    "//info_materials/retail_chains/")
	end
	return tb, err
    end
    )
end

local function get_blob(stor, infom_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select infom_id, blob, content_type from info_materials 
    where infom_id=%infom_id%
]]
-- *** sql query: end
        , "//info_materials/blob/"
        , {infom_id = infom_id})
    end
    )
end

local function get_author(stor, infom_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select author_id from info_materials 
    where infom_id=%infom_id%
]]
-- *** sql query: end
	, "//info_materials/author/"
	, {infom_id = infom_id})
    end
    )
end

local function remove(stor, uid, infom_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
update info_materials set hidden=1 
    where infom_id=%infom_id%
]]
-- *** sql query: end
        , "//info_materials/remove/"
        , {req_uid = uid, infom_id = infom_id})
    end
    )
end

local function post(stor, uid, params, blob)
    params.req_uid = uid
    params.blob = nil
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
insert into info_materials(descr, blob, content_type, b_date, e_date, country_id, dep_id, rc_id, author_id)
    values(%name%, %1:blob%, %content_type%, %b_date%, %e_date%, %country_id%, %dep_id%, %rc_id%, %req_uid%)
]]
-- *** sql query: end
        , "//info_materials/new/"
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
update info_materials set descr=%name%, b_date=%b_date%, e_date=%e_date%, country_id=%country_id%, dep_id=%dep_id%, rc_id=%rc_id%
    where infom_id=%infom_id%
]]
-- *** sql query: end
        , "//info_materials/edit/"
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
    assert(validate.isuid(params.infom_id), 
	string.format("function %s() >>> PANIC <<< invalid infom_id.", debug.getinfo(1,"n").name))
    -- check owner
    if permtb.remove == nil or permtb.remove ~= true then
	local tb, err = get_author(stor, params.infom_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to remove information material created by %s.",
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- execute query
    if remove(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.infom_id) then
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
	string.format("function %s() >>> PANIC <<< invalid blob.", debug.getinfo(1,"n").name))
    assert(tb.blob.size > 0, 
	string.format("function %s() >>> PANIC <<< blob is empty.", debug.getinfo(1,"n").name))
    assert(tb.blob.size <= permtb.add.max_file_size_mb*1024*1024, 
	string.format("function %s() >>> PANIC <<< blob should be less then %d MB.", debug.getinfo(1,"n").name,
	permtb.add.max_file_size_mb*1024*1024))
    assert(#tb.name,
	string.format("function %s() >>> PANIC <<< invalid name.", debug.getinfo(1,"n").name))
    assert(tb.content_type == 'application/pdf' or tb.content_type ==  'video/mp4',
	string.format("function %s() >>> PANIC <<< invalid content type.", debug.getinfo(1,"n").name))
    assert(validate.isdate(tb.b_date),
	string.format("function %s() >>> PANIC <<< invalid b_date.", debug.getinfo(1,"n").name))
    assert(tb.b_date <= tb.e_date,
	string.format("function %s() >>> PANIC <<< invalid e_date.", debug.getinfo(1,"n").name))
    assert(tb.country_id == nil or validate.isuid(tb.country_id), 
	string.format("function %s() >>> PANIC <<< invalid country_id.", debug.getinfo(1,"n").name))
    assert(tb.dep_id == nil or validate.isuid(tb.dep_id), 
	string.format("function %s() >>> PANIC <<< invalid dep_id.", debug.getinfo(1,"n").name))
    assert(tb.rc_id == nil or validate.isuid(tb.rc_id), 
	string.format("function %s() >>> PANIC <<< invalid rc_id.", debug.getinfo(1,"n").name))
    -- set unknown values
    if tb.country_id == nil or #tb.country_id == 0 then tb.country_id = stor.NULL end
    if tb.dep_id == nil or #tb.dep_id == 0 then tb.dep_id = stor.NULL end
    if tb.rc_id == nil or #tb.rc_id == 0 then tb.rc_id = stor.NULL end
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
    assert(validate.isuid(params.infom_id), 
	string.format("function %s() >>> PANIC <<< invalid infom_id.", debug.getinfo(1,"n").name))
    assert(tb, 
	string.format("function %s() >>> PANIC <<< unable to parse multipart data.", debug.getinfo(1,"n").name))
    assert(tb.infom_id == params.infom_id, 
	string.format("function %s() >>> PANIC <<< invalid input parameters.", debug.getinfo(1,"n").name))
    assert(#tb.name,
	string.format("function %s() >>> PANIC <<< invalid name.", debug.getinfo(1,"n").name))
    assert(validate.isuid(tb.b_date), 
	string.format("function %s() >>> PANIC <<< invalid b_date.", debug.getinfo(1,"n").name))
    assert(validate.isuid(tb.e_date), 
	string.format("function %s() >>> PANIC <<< invalid e_date.", debug.getinfo(1,"n").name))
    assert(tb.country_id == nil or validate.isuid(tb.country_id), 
	string.format("function %s() >>> PANIC <<< invalid country_id.", debug.getinfo(1,"n").name))
    assert(tb.dep_id == nil or validate.isuid(tb.dep_id), 
	string.format("function %s() >>> PANIC <<< invalid dep_id.", debug.getinfo(1,"n").name))
    assert(tb.rc_id == nil or validate.isuid(tb.rc_id), 
	string.format("function %s() >>> PANIC <<< invalid rc_id.", debug.getinfo(1,"n").name))
    -- check owner
    if permtb.edit == nil or permtb.edit ~= true then
	local tb, err = get_author(stor, params.infom_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to edit information material created by %s.",
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- set unknown values
    if tb.country_id == nil or #tb.country_id == 0 then tb.country_id = stor.NULL end
    if tb.dep_id == nil or #tb.dep_id == 0 then tb.dep_id = stor.NULL end
    if tb.rc_id == nil or #tb.rc_id == 0 then tb.rc_id = stor.NULL end
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
    assert(validate.isuid(params.infom_id), 
	string.format("function %s() >>> PANIC <<< invalid infom_id.", debug.getinfo(1,"n").name))
    -- execute query
    local tb, err = get_blob(stor, params.infom_id)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil or #tb ~= 1 then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Invalid input parameters")
    elseif tb[1].content_type == 'application/pdf' then
	scgi.writeHeader(res, 200, {
	    ["Content-Type"] = tb[1].content_type,
	    ["Content-Disposition"] = "inline; filename=\"" .. params.infom_id .. ".pdf\""
	    })
	scgi.writeBody(res, tb[1].blob)
    elseif tb[1].content_type ==  'video/mp4' then
	scgi.writeHeader(res, 200, {
	    ["Content-Type"] = tb[1].content_type,
	    ["Content-Disposition"] = "inline; filename=\"" .. params.infom_id .. ".mp4\""
	    })
	scgi.writeBody(res, tb[1].blob)
    else
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Invalid BLOB type")
    end
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    return [[
    <script src="]] .. V.static_prefix .. [[/libs/jquery-2.1.1.js"> </script>
    <script src="]] .. V.static_prefix .. [[/dailycalendar.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/info_materials.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup($('#pluginCore')," .. json.encode(permtb) .. ");"
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
