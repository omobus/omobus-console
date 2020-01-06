-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'


local function data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs
	tb = {}
	qs =
[[
select
    j.doc_id,
    j.validated, j.hidden rejected,
    a.code a_code, j.account a_name, j.address, j.legal_address, j.number,
    j.addition_type_id, t.descr addition_type,
    j.chan_id, ch.descr chan,
    j.note,
    (select array_to_string(array_agg(descr::text),'|') from attributes where attr_id = any(j.attr_ids)) attrs,
    array_to_string(j.photos,'|') photos,
    j.guid,
    j.fix_dt,
    j.user_id, u.descr u_name, u.dev_login, u.area,
    j.validator_id v_code, v.descr v_name,
    u.executivehead_id head_id, ex.descr head_name
from j_additions j
    left join accounts a on a.account_id = j.guid
    left join addition_types t on t.addition_type_id = j.addition_type_id
    left join channels ch on j.chan_id = ch.chan_id
    left join users u on u.user_id = j.user_id
    left join users ex on ex.user_id = u.executivehead_id
    left join users v on v.user_id = j.validator_id
where $(0)
    (a.approved is null or a.approved = 0) and
    (
	(j.validated = 0 and j.hidden = 0 and %registered% = 1)
	or (j.validated = 1 and j.hidden = 0 and %validated% = 1)
	or (j.hidden = 1 and %rejected% = 1)
    )
order by j.inserted_ts desc, j.fix_dt desc
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "j.user_id in (select * from my_staff(%user_id%, 1::bool_t)) and "), 
		"//additions/get", { user_id = sestb.erpid,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0
		})
	elseif sestb.department ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "u.dep_ids && string_to_array(%dep_id%,',')::uids_t and "),
		"//additions/get", { dep_id = sestb.department,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0
		})
	elseif sestb.distributor ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "u.distr_ids && string_to_array(%distr_id%,',')::uids_t and "),
		"//additions/get", { distr_id = sestb.distributor,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0
		})
        elseif sestb.agency ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", "u.agency_id = any(string_to_array(%agency_id%,',')) and "),
		"//additions/get", { agency_id = sestb.agency,
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0
		})
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"//additions/get", {
		    registered = (permtb.data ~= nil and permtb.data.registered == true) and 1 or 0,
		    validated = (permtb.data ~= nil and permtb.data.validated == true) and 1 or 0,
		    rejected = (permtb.data ~= nil and permtb.data.rejected == true) and 1 or 0
		})
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//additions/users"
	    )
	end
	if err == nil or err == false then
	    tb.types, err = func_execute(tran,
[[
select addition_type_id, descr, hidden from addition_types
    order by descr
]]
		, "//additions/addition_types"
	    )
	end
	if (permtb.columns or {}).channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//additions/channels"
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
	, "//photos/photo", {blob_id = blob_id})
    end
    )
end

local function accept(stor, uid, doc_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_addition(%req_uid%, 'validate', %doc_id%)
]]
	, "//additions/validate", {req_uid = uid, doc_id = doc_id})
    end
    )
end

local function reject(stor, uid, doc_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_addition(%req_uid%, 'reject', %doc_id%)
]]
	, "//additions/reject", {req_uid = uid, doc_id = doc_id})
    end
    )
end

local function personalize(data)
    local p = {}
    local idx_users = {}
    local idx_channels = {}
    local idx_types = {}
    local idx_heads = {}

    for i, v in ipairs(data.rows) do
	v.row_no = i
        if v.attrs ~= nil then
	    v.attrs = core.split(v.attrs,'|')
        end
        if v.photos ~= nil then
	    v.photos = core.split(v.photos,'|')
        end

	idx_users[v.user_id] = 1
	if v.addition_type_id ~= nil then idx_types[v.addition_type_id] = 1; end
	if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
	if v.head_id ~= nil then idx_heads[v.head_id] = 1; end
    end

    p.rows = data.rows
    p.users = core.reduce(data.users, 'user_id', idx_users)
    p.heads = core.reduce(data.users, 'user_id', idx_heads)
    p.channels = core.reduce(data.channels, 'chan_id', idx_channels)
    p.types = core.reduce(data.types, 'addition_type_id', idx_types)

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.additiontypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/additions.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb));
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.blob ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.blob_id), "invalid [blob_id] parameter.")
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
	else
	    tb, err = data(permtb, stor, sestb)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or tb.rows == nil or #tb.rows == 0 then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, json.encode(personalize(tb)))
	    end
	end
    elseif method == "PUT" then
	-- validate input data
	assert(permtb.validate ~= nil and permtb.validate == true, "operation does not permitted.")
	assert(validate.isuid(params.doc_id), "invalid [doc_id] parameter.")
	-- execute query
	accept(stor, sestb.erpid or sestb.username, params.doc_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" then
	-- validate input data
	assert(permtb.reject ~= nil and permtb.reject == true, "operation does not permitted.")
	assert(validate.isuid(params.doc_id), "invalid [doc_id] parameter.")
	-- execute query
	reject(stor, sestb.erpid or sestb.username, params.doc_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
