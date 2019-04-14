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
local core = require 'core'

local function calendar(stor)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select left(b_date, 4) y, substring(b_date, 6, 2) m, rows from content_stream where content_ts is not null and content_code='stat_shelfs'
    order by 1 desc, 2 desc
]]
	, "//shelfs/calendar/"
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
		, "//shelfs/F.users/"
		, {user_id = sestb.erpid}
	    )
	    if err == nil or err == false then
		tb._accounts, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
    union
select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id
    union
select account_id from (select expand_cities(city_id) city_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id
]]
		    , "//shelfs/F.accounts/"
		    , {user_id = sestb.erpid}
		)
	    end
	elseif sestb.distributor ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
]]
		, "//shelfs/F.users/"
		, {distr_id = sestb.distributor}
	    )
        elseif sestb.agency ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
]]
		, "//shelfs/F.users/"
		, {agency_id = sestb.agency})
        else
	    tb._users, err = func_execute(tran,
[[
select user_id from users
]]
		, "//shelfs/F.users/"
	    )
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//shelfs/users/"
	    )
	end
	if permtb.channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//shelfs/channels/"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, hidden from retail_chains
    order by descr
]]
		, "//shelfs/retail_chains/"
	    )
	end
	if err == nil or err == false then
	    tb.categories, err = func_execute(tran,
[[
select categ_id, descr, hidden from categories
    order by row_no, descr
]]
		, "//shelfs/categories/"
	    )
	end
	if err == nil or err == false then
	    tb.content, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('stat_shelfs', '', 
    "monthDate_First"('%y%-%m%-01')::date_t, "monthDate_Last"('%y%-%m%-01')::date_t)
]]
		, "//shelfs/content/"
		, {y = year, m = month}
	    )
	end
	return tb, err
    end
    )
end

local function photo(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select photo_get(%blob_id%::blob_t) photo
]]
	, "//shelfs/photo/"
	, {blob_id = blob_id})
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
    if sestb.erpid ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
	local idx0, idx1, tb = {}, {}, {}
	if data._users ~= nil then
	    for i, v in ipairs(data._users) do
		idx0[v.user_id] = 1
	    end
	end
	if data._accounts ~= nil then
	    for i, v in ipairs(data._accounts) do
		idx1[v.account_id] = 1
	    end
	end
	for i, v in ipairs(p.rows) do
	    if idx0[v.user_id] ~= nil or idx1[v.account_id] ~= nil then
		table.insert(tb, v); 
		v.row_no = #tb
	    end
	end
	p.rows = tb
    end
    -- build filters:
    local x = {u = {}, chan = {}, rc = {}, categ = {}, e = {}}
    for i, v in ipairs(p.rows) do
	x.u[v.user_id] = 1
	if v.chan_id ~= nil then x.chan[v.chan_id] = 1; end
	if v.rc_id ~= nil then x.rc[v.rc_id] = 1; end
	if v.categ_id ~= nil then x.categ[v.categ_id] = 1; end
	if v.head_id ~= nil then x.e[v.head_id] = 1; end
    end
    p.users = core.reduce(data.users, 'user_id', x.u)
    p.heads = core.reduce(data.users, 'user_id', x.e)
    p.channels = core.reduce(data.channels, 'chan_id', x.chan)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', x.rc)
    p.categories = core.reduce(data.categories, 'categ_id', x.categ)

    return json.encode(p)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/jszip-2.5.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/filesaver-0.1.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.monthcal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.categories.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/shelfs.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return 
	((params.year~=nil and params.month~=nil) and "" or "var d = new Date();") ..
	"startup(_('pluginCore')," ..
	((params.year~=nil and params.month~=nil) and (params.year..","..params.month..",") or "d.getYear()+1900,d.getMonth()+1,") ..
	json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.blob ~= nil then 
	    -- validate input data
	    assert(validate.isuid(params.blob_id), string.format("function %s() invalid blob_id.", debug.getinfo(1,"n").name))
	    -- execute query
	    tb, err = photo(stor, params.blob_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 or tb[1].photo == nil then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].photo)
	    end
	elseif params.calendar ~= nil then 
	    tb, err = calendar(stor)
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
	else
	    -- validate input data
	    assert(params.year ~= nil, string.format("function %s() year is undefined.", debug.getinfo(1,"n").name))
	    assert(params.month ~= nil, string.format("function %s() month is undefined.", debug.getinfo(1,"n").name))
	    params.year = tonumber(params.year)
	    params.month = tonumber(params.month)
	    assert(params.month >= 1 and params.month <= 12, string.format("function %s() month should be between 1 and 12.", debug.getinfo(1,"n").name))
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
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
