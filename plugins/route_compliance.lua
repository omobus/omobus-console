-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local zlib = require 'zlib'
local bzlib = require 'bzlib'

local function calendar(stor)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select distinct b_date as fix_date from content_stream 
    where content_ts is not null and content_code='route_compliance'
order by b_date
]]
	, "//route_compliance/calendar"
	)
    end
    )
end

local function data(stor, sestb, date)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	if sestb.erpid ~= nil then
	    tb._users, err = func_execute(tran,
[[
select my_staff user_id from my_staff(%user_id%, 1::bool_t)
]]
		, "//route_compliance/F.users"
		, {user_id = sestb.erpid}
	    )
	elseif sestb.department ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where dep_ids && string_to_array(%dep_id%,',')::uids_t
]]
		, "//route_compliance/F.users"
		, {dep_id = sestb.department}
	    )
	elseif sestb.distributor ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
]]
		, "//route_compliance/F.users"
		, {distr_id = sestb.distributor}
	    )
	elseif sestb.agency ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
]]
		, "//route_compliance/F.users"
		, {agency_id = sestb.agency})
	end
	if err == nil or err == false then
	    tb.content, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('route_compliance', '', %b_date%, %e_date%)
]]
		, "//route_compliance/content"
		, {b_date = date, e_date = date }
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
    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
	local idx, tb = {}, {}
	if data._users ~= nil then
	    for i, v in ipairs(data._users) do
		idx[v.user_id] = 1
	    end
	end
	for i, v in ipairs(p.rows) do
	    if idx[v.user_id] ~= nil then
		table.insert(tb, v);
		v.row_no = #tb
	    end
	end
	p.rows = tb
    end

    return json.encode(p)
end

local function recompile_calendar(tb)
    local ar = {}
    for i, v in ipairs(tb) do
	table.insert(ar, v.fix_date)
    end
    return ar
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/filesaver-0.1.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup_L.dailycal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/route_compliance.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup(" .. 
	((params.date~=nil and validate.isdate(params.date)) and ("'"..params.date.."',") or "new Date(),") .. 
	json.encode(permtb) .. ");"
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
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(recompile_calendar(tb)))
	end
    else
	-- validate input data
	assert(validate.isdate(params.date), "invalid [date] parameter.")
	-- execute query
	tb, err = data(stor, sestb, params.date)
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
