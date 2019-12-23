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
local bzlib = require 'bzlib'
local core = require 'core'

local function calendar(stor)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select left(b_date, 4) y, substring(b_date, 6, 2) m, rows from content_stream 
    where content_ts is not null and content_code='stat_posms'
order by 1 desc, 2 desc
]]
	, "//posms/calendar"
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
		, "//posms/F.users"
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
		    , "//posms/F.accounts"
		    , {user_id = sestb.erpid}
		)
	    end
	elseif sestb.department ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where dep_ids && string_to_array(%dep_id%,',')::uids_t
]]
		, "//posms/F.users"
		, {dep_id = sestb.department}
	    )
	elseif sestb.distributor ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
]]
		, "//posms/F.users"
		, {distr_id = sestb.distributor}
	    )
        elseif sestb.agency ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
]]
		, "//posms/F.users"
		, {agency_id = sestb.agency})
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//posms/users"
	    )
	end
	if permtb.channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//posms/channels"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, hidden from retail_chains
    order by descr
]]
		, "//posms/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tb.placements, err = func_execute(tran,
[[
select placement_id, descr, hidden from placements
    order by row_no, descr
]]
		, "//posms/placements"
	    )
	end
	if err == nil or err == false then
	    tb.posms, err = func_execute(tran,
[[
select posm_id, descr, hidden from pos_materials
    order by descr
]]
		, "//posms/pos_materials"
	    )
	end
	if err == nil or err == false then
	    tb.brands, err = func_execute(tran,
[[
select
    b.brand_id, b.descr, m.descr manuf, m.competitor, b.hidden, b.row_no
from brands b
    left join manufacturers m on m.manuf_id = b.manuf_id
    union
select
    array_to_string(m.brand_ids,',') brand_id,
    (select array_to_string(array_agg(descr::text),', ') from brands where brand_id=any(m.brand_ids)) descr,
    null manuf, null competitor, 0 hidden, null row_no
from pos_materials m
where cardinality(m.brand_ids) > 1
    order by 4 nulls first, 6, 2
]]
		, "//posms/brands"
	    )
	end
	if err == nil or err == false then
	    tb.content, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('stat_posms', '', 
    "monthDate_First"('%y%-%m%-01')::date_t, "monthDate_Last"('%y%-%m%-01')::date_t)
]]
		, "//posms/content"
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
	, "//posms/photo"
	, {blob_id = blob_id})
    end
    )
end

local function thumb(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select thumb_get(%blob_id%::blob_t) photo
]]
	, "//posms/thumb"
	, {blob_id = blob_id})
    end
    )
end

local function post(stor, uid, params)
    params.req_uid = uid
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select console.req_target(%req_uid%, (%doc_id%, %sub%, %msg%, %strict%::bool_t)::console.target_at_t) target_id
]]
	, "//posms/new_target"
	, params)
    end, false
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
    local idx_users = {}
    local idx_channels = {}
    local idx_rcs = {}
    local idx_placements = {}
    local idx_posms = {}
    local idx_brands = {}
    local idx_heads = {}

    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
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
		idx_users[v.user_id] = 1
		if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
		if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
		if v.placement_id ~= nil then idx_placements[v.placement_id] = 1; end
		if v.posm_id ~= nil then idx_posms[v.posm_id] = 1; end
		if v.brand_id ~= nil then idx_brands[v.brand_id] = 1; end
		if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
		table.insert(tb, v); 
		v.row_no = #tb
	    end
	end
	p.rows = tb
    else
	for i, v in ipairs(p.rows) do
	    idx_users[v.user_id] = 1
	    if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
	    if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
	    if v.placement_id ~= nil then idx_placements[v.placement_id] = 1; end
	    if v.posm_id ~= nil then idx_posms[v.posm_id] = 1; end
	    if v.brand_id ~= nil then idx_brands[v.brand_id] = 1; end
	    if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
	end
    end

    p.users = core.reduce(data.users, 'user_id', idx_users)
    p.heads = core.reduce(data.users, 'user_id', idx_heads)
    p.channels = core.reduce(data.channels, 'chan_id', idx_channels)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', idx_rcs)
    p.placements = core.reduce(data.placements, 'placement_id', idx_placements)
    p.posms = core.reduce(data.posms, 'posm_id', idx_posms)
    p.brands = core.reduce(data.brands, 'brand_id', idx_brands)

    return json.encode(p)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/lazyload-4.0.4.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/jszip-2.5.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/filesaver-0.1.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup_L.monthcal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.brands.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.placements.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.posms.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/posms.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    if params.year ~= nil and type(params.year) ~= 'number' then
	params.year = tonumber(params.year)
    end
    if params.month ~= nil and type(params.month) ~= 'number' then
	params.month = tonumber(params.month)
    end
    if params.year ~= nil and params.month ~= nil then
	return string.format("startup({y:%s,m:%s},%s);", params.year, params.month, json.encode(permtb))
    else
	return string.format("startup(null,%s);", json.encode(permtb))
    end
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local p, tb, err
    if method == "GET" then
	if params.blob ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.blob_id), "invalid [blob_id] parameter.")
	    -- execute query
	    tb, err = params.thumb == nil and photo(stor, params.blob_id) or thumb(stor, params.blob_id)
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
		if sestb.erpid ~= nil or sestb.department ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
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
    elseif method == "POST" then
	if permtb.target == true then
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    -- validate input data
	    assert(p.sub ~= nil and #p.sub, "invalid [subject] parameter.")
	    assert(p.msg ~= nil and #p.msg, "invalid [body] parameter.")
	    assert(validate.isuid(p.doc_id), "invalid [doc_id] parameter.")
	    p.strict = p.strict == 'true' and 1 or 0
	    -- execute query
	    tb, err = post(stor, sestb.erpid or sestb.username, p)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].target_id == nil then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"success\"}")
	    end
	else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Operation does not permitted.")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
