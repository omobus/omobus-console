-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local multipart = require 'multipart'
local validate = require 'validate'
local core = require 'core'


local function data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, tmp, qs
	tb = {}
	qs =
[[
select
    m.posm_id, 
    m.descr, 
    blob_length(m.image) blob_size,
    m.country_id, c.descr country, 
    array_to_string(m.brand_ids,'|') brand_ids, (select string_agg(descr, '|') from brands where brand_id=any(m.brand_ids)) brands,
    array_to_string(m.placement_ids,'|') placement_ids, (select string_agg(descr, '|') from placements where placement_id=any(m.placement_ids)) placements,
    array_to_string(m.chan_ids,'|') chan_ids, (select string_agg(descr, '|') from channels where chan_id=any(m.chan_ids)) channels,
    m.author_id, case when u.user_id is null then m.author_id else u.descr end author,
    m.b_date,
    m.e_date,
    m."_isAlienData"
from pos_materials m
    left join countries c on c.country_id=m.country_id
    left join users u on u.user_id=m.author_id
where m.hidden=0 $(0)
order by case when current_timestamp - m.updated_ts < '1 day' then current_timestamp - m.updated_ts else null end, m.descr, m.posm_id
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", 
[[
and (
    (select dep_ids from users where user_id=%user_id%) is null
	or
    (select count(brand_id) from brands where (dep_id in (select unnest(dep_ids) from users where user_id=%user_id% and dep_ids is not null) or dep_id is null) and brand_id=any(m.brand_ids)) > 0
)
]]
		) , "//pos_materials/get", { user_id = sestb.erpid}
	    )
	    if err == nil or err == false then
		tb.brands, err = func_execute(tran,
[[
select brand_id, descr from brands
    where hidden = 0 and manuf_id in (select manuf_id from manufacturers where competitor is null or competitor = 0) and (
	dep_id is null 
	    or 
	(select dep_ids from users where user_id=%user_id%) is null
	    or
	dep_id in (select unnest(dep_ids) from users where user_id=%user_id% and dep_ids is not null)
    )
order by row_no, descr
]]
		    , "//pos_materials/brands", { user_id = sestb.erpid}
		)
	    end
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", 
[[
and (
    lower(m.author_id)=lower(%my%)
	or
    (
	(select count(brand_id) from brands where (%dep_id% is null or dep_id is null or dep_id=any(string_to_array(%dep_id%,',')::uids_t)) and brand_id=any(m.brand_ids)) > 0
	    and
	(%country_id% is null or (m.country_id=any(string_to_array(%country_id%,',')::uids_t)))
    )
)
]]
		) ,"//pos_materials/get", { 
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country,
		    my = sestb.username
		}
	    )
	    if err == nil or err == false then
		tb.brands, err = func_execute(tran,
[[
select brand_id, descr from brands
    where hidden = 0 and manuf_id in (select manuf_id from manufacturers where competitor is null or competitor = 0) 
	and (%dep_id% is null or dep_id is null or dep_id=any(string_to_array(%dep_id%,',')::uids_t))
order by row_no, descr
]]
		    , "//pos_materials/brands", { 
			dep_id = sestb.department == nil and stor.NULL or sestb.department
		    }
		)
	    end
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"//pos_materials/get"
	    )
	    if err == nil or err == false then
		tb.brands, err = func_execute(tran,
[[
select brand_id, descr from brands
    where hidden = 0 and manuf_id in (select manuf_id from manufacturers where competitor is null or competitor = 0)
order by row_no, descr
]]
		    , "//pos_materials/brands"
		)
	    end
	end
	if err == nil or err == false then
	    tb.placements, err = func_execute(tran,
[[
select placement_id, descr from placements
    where hidden = 0
order by row_no, descr
]]
		, "//pos_materials/placements"
	    )
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr from channels
    where hidden = 0
order by descr
]]
		, "//pos_materials/channels"
	    )
	end
	if err == nil or err == false then
	    tb.countries, err = func_execute(tran,
[[
select country_id, descr from countries
    where hidden = 0 and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
order by row_no, descr
]]
		, "//pos_materials/countries"
		, { country_id = sestb.country == nil and stor.NULL or sestb.country }
	    )
	end

	return tb, err
    end
    )
end

local function image(stor, posm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select image from pos_materials where posm_id = %posm_id%
]]
	, "//pos_materials/image", {posm_id = posm_id})
    end
    )
end

local function author(stor, posm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select author_id from pos_materials where posm_id=%posm_id%
]]
	, "//pos_materials/author/"
	, {posm_id = posm_id})
    end
    )
end

local function unlink(stor, uid, reqdt, posm_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_pos_material(%req_uid%, %req_dt%, 'unlink', %posm_id%, null) rv
]]
        , "//pos_materials/unlink/"
        , {req_uid = uid, req_dt = reqdt, posm_id = posm_id})
    end
    )
end

local function put(stor, uid, params)
    params.req_uid = uid
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_pos_material(%req_uid%, %_datetime%, 'edit', %posm_id%, (
	%name%, 
	%country_id%, 
	string_to_array(%brand_ids%,','), 
	string_to_array(%placement_ids%,','),
	string_to_array(%chan_ids%,','),
	%b_date%,
	%e_date%
    )
) rv
]]
	, "//pos_materials/edit/"
	, params)
    end
    )
end

local function post(stor, uid, reqdt, blob)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_pos_material(%req_uid%, %req_dt%/*, 'add'*/, %name%, %1:blob%) rv
]]
	, "//pos_materials/add/"
	, {req_uid = uid, req_dt = reqdt, name = blob.name}
	, blob.contents)
    end
    )
end

local function split(arg)
    return arg ~= nil and core.split(arg,'|') or nil
end

local function personalize(data, u_id)
    local p = {}

    for i, v in ipairs(data.rows) do
	v.row_no = i
	v._isowner = (v.author_id ~= nil and u_id:lower() == v.author_id:lower()) and true or false
	v.brand_ids = split(v.brand_ids)
	v.brands = split(v.brands)
	v.placement_ids = split(v.placement_ids)
	v.placements = split(v.placements)
	v.chan_ids = split(v.chan_ids)
	v.channels = split(v.channels)
    end

    p.rows = data.rows
    p.mans = {}
    p.mans.countries = data.countries
    p.mans.brands = data.brands
    p.mans.placements = data.placements
    p.mans.channels = data.channels

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/pos_materials.js"> </script>')
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
	    assert(validate.isuid(params.posm_id), "invalid [posm_id] parameter.")
	    -- execute query
	    tb, err = image(stor, params.posm_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 or tb[1].image == nil then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].image)
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
		scgi.writeBody(res, json.encode(personalize(tb, sestb.erpid or sestb.username)))
	    end
	end
    elseif method == "POST" then
	local mp
	-- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	assert(permtb.add, "adding new PoS/PoP material is not permitted.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(mp.blob and mp.blob.size > 0, "invalid [blob] parameter.")
	assert(mp.blob.size <= permtb.add.max_file_size_mb*1024*1024, string.format("[blob] size should be less then %d MB.", 
	    permtb.add.max_file_size_mb))
	-- execute query
	if post(stor, sestb.erpid or sestb.username, mp._datetime, mp.blob) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "PUT" then
	local mp
	-- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	assert(validate.isuid(params.posm_id), "invalid [posm_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(#mp.name, "invalid [name] parameter.")
	assert(validate.isuid(mp.country_id), "invalid [country_id] parameter.")
	assert(validate.isuids(mp.brand_ids), "invalid [brand_ids] parameter.")
	assert(mp.placement_ids == nil or validate.isuids(mp.placement_ids), "invalid [placement_ids] parameter.")
	assert(mp.chan_ids == nil or validate.isuids(mp.chan_ids), "invalid [chan_ids] parameter.")
	assert(mp.b_date == nil or validate.isdate(mp.b_date), "invalid [b_date] parameter.")
	assert(mp.e_date == nil or validate.isdate(mp.e_date), "invalid [e_date] parameter.")
	-- set unknown values
	if mp.placement_ids == nil then mp.placement_ids = stor.NULL end
	if mp.chan_ids == nil then mp.chan_ids = stor.NULL end
	if mp.b_date == nil then mp.b_date = stor.NULL end
	if mp.e_date == nil then mp.e_date = stor.NULL end
	-- set default values
	mp.posm_id = params.posm_id
	-- check owner
	if permtb.edit == nil or permtb.edit ~= true then
	    local tb, err = author(stor, params.posm_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id == (sestb.erpid or sestb.username), 
		string.format("PoS/PoP material is not owned by [%s], unable to edit it [posm_id=%s].", 
		    sestb.erpid or sestb.username, params.posm_id))
	end
	-- execute query
	if put(stor, sestb.erpid or sestb.username, mp) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" then
	-- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	assert(validate.isuid(params.posm_id), "invalid [posm_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	-- check owner
	if permtb.remove == nil or permtb.remove ~= true then
	    local tb, err = author(stor, params.posm_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id == (sestb.erpid or sestb.username), 
		string.format("PoS/PoP material is not owned by [%s], unable to unlink it [posm_id=%s].", 
		    sestb.erpid or sestb.username, params.posm_id))
	end
	-- execute query
	if unlink(stor, sestb.erpid or sestb.username, mp._datetime, params.posm_id) then
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
