-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local uri = require 'url'
local validate = require 'validate'
local zlib = require 'zlib'


local function compress(content_blob)
    return zlib.deflate(9):finish(content_blob)
end

local function get_data(stor, erpid)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	tb.targets, err = func_execute(tran,
-- *** sql query: begin
[[
select 
    x.target_id, x.target_type_id, t.descr target_type, x.subject, x.body, x.b_date, x.e_date, x.dep_id, d.descr department,
    array_to_string(x.region_ids, ',') region_ids, (select string_agg(descr, '<br/>') from regions where region_id=any(x.region_ids)) regions,
    array_to_string(x.city_ids, ',') city_ids, (select string_agg(descr, '<br/>') from cities where city_id=any(x.city_ids)) cities,
    array_to_string(x.rc_ids, ',') rc_ids, (select string_agg(descr, '<br/>') from retail_chains where rc_id=any(x.rc_ids)) retail_chains,
    array_to_string(x.chan_ids, ',') chan_ids, (select string_agg(descr, '<br/>') from channels where chan_id=any(x.chan_ids)) channels,
    array_to_string(x.poten_ids, ',') poten_ids, (select string_agg(descr, '<br/>') from potentials where poten_id=any(x.poten_ids)) potentials,
    array_to_string(x.account_ids, ',') account_ids, 
    rows accounts,
    x.author_id, case when u.user_id is null then x.author_id else u.descr end author
from targets x
    left join departments d on x.dep_id=d.dep_id
    left join target_types t on x.target_type_id=t.target_type_id
    left join users u on u.user_id=x.author_id
where x.hidden=0 
    and (0=%flag% or x.author_id = any(select my_staff(%user_id%, 1::bool_t))) 
    and x.author_id is not null
    and x."immutable" = 0
order by x.b_date desc, x.e_date, x.subject
]]
-- *** sql query: end
	    , "//targets/targets/", 
	    {user_id = erpid == nil and stor.NULL or erpid, flag = erpid == nil and 0 or 1}
	)
	if err == nil or err == false then
	    tb.departments, err = func_execute(tran, 
		"select dep_id, descr from departments where hidden=0 order by descr", 
		"//targets/departments/")
	end
	if err == nil or err == false then
	    tb.types, err = func_execute(tran, 
		"select target_type_id, descr from target_types where hidden=0 order by descr", 
		"//targets/target_types/")
	end
	if err == nil or err == false then
	    tb.regions, err = func_execute(tran, 
		"select region_id, descr from regions where hidden=0 order by descr", 
		"//targets/regions/")
	end
	if err == nil or err == false then
	    tb.cities, err = func_execute(tran, 
		"select city_id, descr from cities where hidden=0 order by descr", 
		"//targets/cities/")
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran, 
		"select rc_id, descr, ka_code from retail_chains where hidden=0 order by descr", 
		"//targets/retail_chains/")
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran, 
		"select chan_id, descr from channels where hidden=0 order by descr", 
		"//targets/channels/")
	end
	if err == nil or err == false then
	    tb.potentials, err = func_execute(tran, 
		"select poten_id, descr from potentials where hidden=0 order by descr", 
		"//targets/potentials/")
	end
	if err == nil or err == false then
	    tb.accounts, err = func_execute(tran, 
		"select account_id, code, descr, address, rc_id, chan_id, poten_id, region_id, city_id from accounts where hidden=0 and ftype=0 order by descr", 
		"//targets/accounts/")
	end
	return tb, err
    end
    )
end

local function get_author(stor, target_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select author_id from targets where target_id=%target_id%
]]
-- *** sql query: end
    , "//targets/author/"
    , {target_id = target_id}
    )
    end
    )
end

local function post(stor, uid, params)
    local tb = params
    tb.req_uid = uid
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_target(%req_uid%, (%type_id%, %subject%, %body%, %b_date%, %e_date%, %dep_id%, string_to_array(%account_ids%,','), 
    string_to_array(%region_ids%,','), string_to_array(%city_ids%,','), string_to_array(%rc_ids%,','), string_to_array(%chan_ids%,','), string_to_array(%poten_ids%,','))::console.target_t)
]]
-- *** sql query: end
	, "//targets/new/"
	, tb
	)
    end
    )
end

local function put(stor, uid, target_id, params)
    local tb = params
    tb.req_uid = uid
    tb.target_id = target_id
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_target(%req_uid%, %target_id%, (%type_id%, %subject%, %body%, %b_date%, %e_date%, %dep_id%, string_to_array(%account_ids%,','), 
    string_to_array(%region_ids%,','), string_to_array(%city_ids%,','), string_to_array(%rc_ids%,','), string_to_array(%chan_ids%,','), string_to_array(%poten_ids%,','))::console.target_t)
]]
-- *** sql query: end
	, "//targets/edit/"
	, tb
	)
    end
    )
end

local function remove(stor, uid, target_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
-- *** sql query: begin
[[
select console.req_target(%req_uid%, %target_id%)
]]
-- *** sql query: end
	, "//targets/remove/"
	, {req_uid = uid, target_id = target_id})
    end
    )
end

local function ajax_data(sestb, params, stor, res)
    local tb, err, u_id
    tb, err = get_data(stor, sestb.erpid)
    if tb ~= nil and tb.targets ~= nil then
	u_id = iif(sestb.erpid ~= nil, sestb.erpid, sestb.username)
	for i, v in ipairs(tb.targets) do
	    v.row_no = i
	    v.owner = u_id:lower() == v.author_id:lower() and true or false
	end
    end
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    elseif tb == nil then
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	scgi.writeBody(res, "{}")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
	scgi.writeBody(res, compress(json.encode(tb)))
    end
end

local function ajax_new(permtb, sestb, params, content, stor, res)
    local p = nil
    if type(content) == "string" then p = uri.parseQuery(content) end
    -- validate input data
    assert(permtb.add ~= nil,
	string.format("function %s() >>> PANIC <<< operation does not permitted.", debug.getinfo(1,"n").name))
    assert(#p.subject, 
	string.format("function %s() >>> PANIC <<< invalid subject.", debug.getinfo(1,"n").name))
    assert(#p.body, 
	string.format("function %s() >>> PANIC <<< invalid body.", debug.getinfo(1,"n").name))
    assert(validate.isuid(p.type_id),
	string.format("function %s() >>> PANIC <<< invalid type_id.", debug.getinfo(1,"n").name))
    assert(validate.isdate(p.b_date),
	string.format("function %s() >>> PANIC <<< invalid b_date.", debug.getinfo(1,"n").name))
    assert(p.b_date <= p.e_date,
	string.format("function %s() >>> PANIC <<< invalid e_date.", debug.getinfo(1,"n").name))
    if p.dep_id == nil or #p.dep_id == 0 then p.dep_id = stor.NULL end
    if p.account_ids == nil then p.account_ids = stor.NULL end
    if p.region_ids == nil then p.region_ids = stor.NULL end
    if p.city_ids == nil then p.city_ids = stor.NULL end
    if p.rc_ids == nil then p.rc_ids = stor.NULL end
    if p.chan_ids == nil then p.chan_ids = stor.NULL end
    if p.poten_ids == nil then p.poten_ids = stor.NULL end
    -- execute query
    local err = post(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), p)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_edit(permtb, sestb, params, content, stor, res)
    local p, tb, err
    p = nil
    if type(content) == "string" then p = uri.parseQuery(content) end
    -- validate input data
    assert(validate.isuid(params.target_id),
	string.format("function %s() >>> PANIC <<< invalid target_id.", debug.getinfo(1,"n").name))
    assert(#p.subject, 
	string.format("function %s() >>> PANIC <<< invalid subject.", debug.getinfo(1,"n").name))
    assert(#p.body, 
	string.format("function %s() >>> PANIC <<< invalid body.", debug.getinfo(1,"n").name))
    assert(validate.isuid(p.type_id),
	string.format("function %s() >>> PANIC <<< invalid type_id.", debug.getinfo(1,"n").name))
    assert(validate.isdate(p.b_date),
	string.format("function %s() >>> PANIC <<< invalid b_date.", debug.getinfo(1,"n").name))
    assert(p.b_date <= p.e_date,
	string.format("function %s() >>> PANIC <<< invalid e_date.", debug.getinfo(1,"n").name))
    if p.dep_id == nil or #p.dep_id == 0 then p.dep_id = stor.NULL end
    if p.account_ids == nil then p.account_ids = stor.NULL end
    if p.region_ids == nil then p.region_ids = stor.NULL end
    if p.city_ids == nil then p.city_ids = stor.NULL end
    if p.rc_ids == nil then p.rc_ids = stor.NULL end
    if p.chan_ids == nil then p.chan_ids = stor.NULL end
    if p.poten_ids == nil then p.poten_ids = stor.NULL end
    -- check target owner
    if permtb.edit == nil or permtb.edit ~= true then
	tb, err = get_author(stor, params.target_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to edit target created by %s.", 
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- execute query
    err = put(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.target_id, p)
    if err then
	scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Internal server error")
    else
	scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	scgi.writeBody(res, "{\"status\":\"success\"}")
    end
end

local function ajax_remove(permtb, sestb, params, stor, res)
    local tb, err
    -- validate input data
    assert(validate.isuid(params.target_id),
	string.format("function %s() >>> PANIC <<< invalid target_id.", debug.getinfo(1,"n").name))
    -- check target owner
    if permtb.remove == nil or permtb.remove ~= true then
	tb, err = get_author(stor, params.target_id)
	assert(tb ~= nil and #tb == 1 and tb[1].author_id == iif(sestb.erpid ~= nil, sestb.erpid, sestb.username),
	    string.format("function %s() >>> PANIC <<< unable to remove target created by %s.", 
	    debug.getinfo(1,"n").name, iif(tb[1].author_id ~= nil, tb[1].author_id, '-')))
    end
    -- execute query
    err = remove(stor, iif(sestb.erpid ~= nil, sestb.erpid, sestb.username), params.target_id)
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
    <script src="]] .. V.static_prefix .. [[/dailycalendar.js"> </script>
    <script src="]] .. V.static_prefix .. [[/plugins/targets.js"> </script>
]]
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup($('#pluginContainer')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	ajax_data(sestb, params, stor, res)
    elseif method == "DELETE" then
	ajax_remove(permtb, sestb, params, stor, res)
    elseif method == "POST" then
	ajax_new(permtb, sestb, params, content, stor, res)
    elseif method == "PUT" then
	ajax_edit(permtb, sestb, params, content, stor, res)
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
