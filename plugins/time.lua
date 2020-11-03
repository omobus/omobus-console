-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'
local zlib = require 'zlib'
local bzlib = require 'bzlib'

local function calendar(stor)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select left(b_date, 4) y, substring(b_date, 6, 2) m, rows from content_stream
    where content_ts is not null and content_code='time'
order by 1 desc, 2 desc
]]
	, "//time/calendar"
    )
    end
    )
end

local function data(stor, permtb, sestb, year, month)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	if sestb.erpid ~= nil then
	    tb._users, err = func_execute(tran,
[[
select my_staff user_id from my_staff(%user_id%, 1::bool_t)
]]
		, "//time/F.users"
		, {user_id = sestb.erpid}
	    )
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
]]
		, "//time/F.users"
		, {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
	elseif sestb.distributor ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
]]
		, "//time/F.users"
		, {distr_id = sestb.distributor}
	    )
	elseif sestb.agency ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
]]
		, "//time/F.users"
		, {agency_id = sestb.agency})
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//time/users"
	    )
	end
	if err == nil or err == false then
	    tb.content, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('time', '',
    "monthDate_First"('%y%-%m%-01'), "monthDate_Last"('%y%-%m%-01'))
]]
		, "//time/content"
		, {y = year, m = month}
	    )
	end
	return tb, err
    end
    )
end

local function decompress(content_blob, content_compress)
    if content_compress ~= nil and #content_compress > 0 then
	local sz_in, sz_out;
	if content_compress == "gz" then
	    content_blob, _, sz_in, sz_out = zlib.inflate():finish(content_blob)
	    --print("IN="..sz_in..", OUT="..sz_out)
	elseif content_compress == "bz2" then
	    content_blob, _, sz_in, sz_out = bzlib.decompress():finish(content_blob)
	else
	    assert(false, "content_compress="..xontent_compress.." does not supported.")
	end
    end
    return content_blob
end

local function compress(content_blob)
    return zlib.deflate(9):finish(content_blob)
end

local function personalize(sestb, data)
    local p = json.decode(decompress(data.content[1].content_blob, data.content[1].content_compress))
    local idx_heads = {}

    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.country ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
	local idx, tb = {}, {}
	if data._users ~= nil then
	    for i, v in ipairs(data._users) do
		idx[v.user_id] = 1
	    end
	end
	for i, v in ipairs(p.rows) do
	    if idx[v.user_id] ~= nil then
		if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
		table.insert(tb, v);
		v.row_no = #tb
	    end
	end
	p.rows = tb
    else
	for i, v in ipairs(p.rows) do
	    if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
	end
    end

    p.heads = core.reduce(data.users, 'user_id', idx_heads)

    return json.encode(p)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup_L.monthcal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/time.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    if params.year ~= nil and type(params.year) ~= 'number' then
	params.year = tonumber(params.year)
    end
    if params.month ~= nil and type(params.month) ~= 'number' then
	params.month = tonumber(params.month)
    end
    if params.user_id ~= nil and validate.isuid(params.user_id) ~= true then
	params.user_id = nil
    end
    if params.year ~= nil and params.month ~= nil and params.user_id ~= nil then
	return string.format("startup({y:%s,m:%s,u:'%s'},%s);", params.year, params.month, params.user_id, json.encode(permtb))
    elseif params.year ~= nil and params.month ~= nil then
	return string.format("startup({y:%s,m:%s},%s);", params.year, params.month, json.encode(permtb))
    else
	return string.format("startup(null,%s);", json.encode(permtb))
    end
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    assert(method == "GET", "%s request is not supported.", method)
    if params.calendar ~= nil then 
	tb, err = calendar(stor)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.country ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
		for _, v in ipairs(tb) do
		v.rows = nil
		end
	    end
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(tb))
        end
    else
	-- validate input data
	assert(params.year ~= nil, "undefined [year] parameter.")
	assert(params.month ~= nil, "undefined [month] parameter.")
	params.year = tonumber(params.year)
	params.month = tonumber(params.month)
	assert(params.month >= 1 and params.month <= 12, "[month] parameter should be between 1 and 12.")
	-- execute query
	tb, err = data(stor, permtb.columns or {}, sestb, params.year, params.month)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil or tb.content == nil or #tb.content ~= 1 then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = tb.content[1].content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
	    scgi.writeBody(res, compress(personalize(sestb, tb)))
	end
    end
end
-- *** plugin interface: end

return M
