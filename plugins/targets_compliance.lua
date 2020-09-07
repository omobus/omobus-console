-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

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

local function data(stor, permtb, sestb)
    return stor.get(function(tran, func_execute)
	local tb, tmp, err
	tb = {}
	if sestb.erpid ~= nil then
	    tmp, err = func_execute(tran,
[[
select array_to_string(dep_ids,',') dep_ids from users where user_id = %user_id%
]]
		, "//targets_compliance/u_params"
		, {user_id = sestb.erpid}
	    )
	    if tmp ~= nil and #tmp == 1 and tmp[1].dep_ids ~= nil then
		tb.dep_ids = core.split(tmp[1].dep_ids,',')
	    end
	    if err == nil or err == false then
		tb._users, err = func_execute(tran,
[[
select my_staff user_id from my_staff(%user_id%, 1::bool_t)
]]
		    , "//targets_compliance/F.users"
		    , {user_id = sestb.erpid}
		)
	    end
	    if err == nil or err == false then
		tb._accounts, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
    union
select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
    union
select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
]]
		    , "//targets_compliance/F.accounts"
		    , {user_id = sestb.erpid}
		)
	    end
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where (%dep_id% is null or (dep_ids is not null and cardinality(dep_ids) > 0 and dep_ids[1]=any(string_to_array(%dep_id%,',')::uids_t)))
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
]]
		, "//targets_compliance/F.users"
		, {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
	    --[[if sestb.department ~= nil then
		tb.dep_ids = core.split(sestb.department,',')
	    end]]
	elseif sestb.distributor ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
]]
		, "//targets_compliance/F.users"
		, {distr_id = sestb.distributor}
	    )
        elseif sestb.agency ~= nil then
	    tb._users, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
]]
		, "//targets_compliance/F.users"
		, {agency_id = sestb.agency})
	end
	if (err == nil or err == false) then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//targets_compliance/users"
	    )
	end
	if permtb.columns ~= nil and permtb.columns.channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//targets_compliance/channels"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, hidden from retail_chains
    order by descr
]]
		, "//targets_compliance/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tb.target_types, err = func_execute(tran,
[[
select target_type_id, descr, hidden from target_types
    order by row_no, descr
]]
		, "//targets_compliance/target_types"
	    )
	end
	if err == nil or err == false then
	    tb.confirmation_types, err = func_execute(tran,
[[
select confirmation_type_id, descr, hidden from confirmation_types
    order by descr
]]
		, "//targets_compliance/confirmation_types"
	    )
	end
	if err == nil or err == false then
	    tb.content, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('targets_compliance', '', '', '')
]]
		, "//targets_compliance/content"
	    )
	end
	if permtb.remark == true and (err == nil or err == false) then
	    tb.remarks, err = func_execute(tran,
[[
select
    doc_id, status, t.descr "type", note
from j_remarks j
    left join remark_types t on t.remark_type_id = j.remark_type_id
]]
		, "//targets_compliance/remarks"
		, {y = year, m = month}
	    )
	    if err == nil or err == false then
		tb.remark_types, err = func_execute(tran,
[[
select remark_type_id, descr from remark_types
    where hidden = 0
order by row_no, descr
]]
		    , "//confirmations/remark_types"
		)
	    end
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
	, "//targets_compliance/photo"
	, {blob_id = blob_id})
    end
    )
end

local function thumb(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select thumb_get(%blob_id%::blob_t) photo
]]
	, "//targets_compliance/thumb"
	, {blob_id = blob_id})
    end
    )
end

local function remark(stor, uid, reqdt, cmd, doc_id, remark_type_id, note)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select console.req_remark(%req_uid%, %req_dt%, %cmd%, %doc_id%, %remark_type_id%, %msg%) "rows"
]]
	, "//targets_compliance/remark"
	, {req_uid = uid, req_dt = reqdt, cmd = cmd, doc_id = doc_id, remark_type_id = remark_type_id or stor.NULL, msg = note or stor.NULL})
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
    local idx_types = {}
    local idx_confirms = {}
    local idx_performers ={}
    local idx_heads = {}
    local idx_remark = {}

    if data.remarks ~= nil then
	for i, v in ipairs(data.remarks) do
	    idx_remark[v.doc_id] = {status = v.status, ["type"] = v.type, note = v.note}
	end
    end

    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.country ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
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
	    local f = (v.author_id ~= nil and idx0[v.author_id] ~= nil)
		or (sestb.erpid == nil and v.author_id ~= nil and string.lower(v.author_id) == string.lower(sestb.username))
		or (idx1[v.account_id] ~= nil and (data.dep_ids == nil or v.dep_id == nil or core.contains(data.dep_ids,v.dep_id)))

	    if f == false and v.confirmations ~= nil then
		for j, w in ipairs(v.confirmations) do
		    if w.performer_id ~= nil and idx0[w.performer_id] ~= nil then 
			f = true
			break
		    end
		end
	    end

	    if f then
		if v.author_id ~= nil then idx_users[v.author_id] = 1; end
		if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
		if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
		if v.target_type_id ~= nil then idx_types[v.target_type_id] = 1; end
		if v.confirmations ~= nil then
		    for j, w in ipairs(v.confirmations) do
			local u = idx_remark[w.doc_id]
			if u ~= nil then w.remark = u; end
		    end
		    for j, w in ipairs(v.confirmations) do
			if w.performer_id ~= nil then idx_performers[w.performer_id] = 1; end
			if w.confirmation_type_id ~= nil then idx_confirms[w.confirmation_type_id] = 1; end
			if w.head_id ~= nil then idx_heads[w.head_id] = 1; end
			break -- (the earliest confirmation only)
		    end
		end
		table.insert(tb, v); 
		v.row_no = #tb
	    end
	end
	p.rows = tb
    else
	for i, v in ipairs(p.rows) do
	    if v.author_id ~= nil then idx_users[v.author_id] = 1; end
	    if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
	    if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
	    if v.target_type_id ~= nil then idx_types[v.target_type_id] = 1; end
	    if v.confirmations ~= nil then
		for j, w in ipairs(v.confirmations) do
		    local u = idx_remark[w.doc_id]
		    if u ~= nil then w.remark = u; end
		end
		for j, w in ipairs(v.confirmations) do
		    if w.performer_id ~= nil then idx_performers[w.performer_id] = 1; end
		    if w.confirmation_type_id ~= nil then idx_confirms[w.confirmation_type_id] = 1; end
		    if w.head_id ~= nil then idx_heads[w.head_id] = 1; end
		    break -- (the earliest confirmation only)
		end
	    end
	end
    end

    p.dep_ids = data.dep_ids
    p.authors = core.reduce(data.users, 'user_id', idx_users)
    p.performers = core.reduce(data.users, 'user_id', idx_performers)
    p.heads = core.reduce(data.users, 'user_id', idx_heads)
    p.channels = core.reduce(data.channels, 'chan_id', idx_channels)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', idx_rcs)
    p.target_types = core.reduce(data.target_types, 'target_type_id', idx_types)
    p.confirmation_types = core.reduce(data.confirmation_types, 'confirmation_type_id', idx_confirms)
    p.remark_types = data.remark_types

    return json.encode(p)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/jszip-3.2.2.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/lazyload-12.4.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/xlsx-1.21.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.confirmationtypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.targettypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/targets_compliance.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return "startup(" .. json.encode(permtb) .. ");"
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
	else
	    tb, err = data(stor, permtb, sestb)
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
    elseif method == "PUT" then
	if permtb.remark == true then
	    local p, tb, err
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    assert(validate.isdatetime(p._datetime), "invalid [_datetime] parameter.")
	    assert(validate.isuid(p.doc_id), "invalid [doc_id] parameter.")
	    assert(p.remark_type_id == nil or validate.isuid(p.remark_type_id), "invalid [remark_type_id] parameter.")
	    tb, err = remark(stor, sestb.erpid or sestb.username, p._datetime, 'accept', p.doc_id, p.remark_type_id, p.note)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].rows == nil or tb[1].rows == 0 then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Invalid input parameters\"}")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"success\"}")
	    end
	else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Operation does not permitted.")
	end
    elseif method == "DELETE" then
	if permtb.remark == true then
	    local p, tb, err
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    assert(validate.isdatetime(p._datetime), "invalid [_datetime] parameter.")
	    assert(validate.isuid(p.doc_id), "invalid [doc_id] parameter.")
	    assert(p.remark_type_id == nil or validate.isuid(p.remark_type_id), "invalid [remark_type_id] parameter.")
	    assert(p.note ~= nil and #p.note, "invalid [note] parameter.")
	    tb, err = remark(stor, sestb.erpid or sestb.username, p._datetime, 'reject', p.doc_id, p.remark_type_id, p.note)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].rows == nil or tb[1].rows == 0 then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Invalid input parameters\"}")
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
