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
    m.infom_id, 
    m.descr, 
    blob_length(m.blob) blob_size,
    m.content_type,
    m.country_id, c.descr country, 
    m.dep_id, d.descr department, 
    m.rc_id, r.descr rc,
    array_to_string(m.chan_ids,'|') chan_ids, (select string_agg(descr, '|') from channels where chan_id=any(m.chan_ids)) channels,
    m.author_id, case when u.user_id is null then m.author_id else u.descr end author,
    m.b_date,
    m.e_date
from info_materials m
    left join departments d on d.dep_id=m.dep_id
    left join countries c on c.country_id=m.country_id
    left join retail_chains r on r.rc_id=m.rc_id
    left join users u on u.user_id=m.author_id
where m.hidden=0 $(0)
order by case when current_timestamp - m.updated_ts < '1 day' then current_timestamp - m.updated_ts else null end, m.descr, m.infom_id
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", 
[[
and (
    lower(m.author_id) = lower(%user_id%)
	or
    (
	(
	    m.country_id = any(string_to_array(%country_id%,',')::uids_t)
		or
	    m.country_id in (select country_id from users where user_id=%user_id%)
	) and (
	    m.dep_id is null
		or
	    (select case when dep_ids is null or m.dep_id=any(dep_ids) then 1 else 0 end from users where user_id=%user_id%) > 0
	)
    )
)
]]
		), "//info_materials/get", { 
		    user_id = sestb.erpid,
		    country_id = sestb.country == nil and stor.NULL or sestb.country 
		}
	    )
	    if err == nil or err == false then
		tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, country_id from retail_chains
    where hidden = 0 and (
	country_id = any(string_to_array(%country_id%,',')::uids_t)
	    or
	country_id in (select country_id from users where user_id=%user_id%)
	)
order by descr, ka_code, rc_id
]]
		    , "//info_materials/retail_chains", { 
			user_id = sestb.erpid,
			country_id = sestb.country == nil and stor.NULL or sestb.country 
		    }
		)
	    end
	    if err == nil or err == false then
		tb.departments, err = func_execute(tran,
[[
select dep_id, descr from departments
    where hidden = 0 and (select case when NIL(dep_id) is null or dep_id=any(dep_ids) then 1 else 0 end from users where user_id=%user_id%) > 0
order by descr, dep_id
]]
		    , "//info_materials/departments", { user_id = sestb.erpid}
		)
	    end
	    if err == nil or err == false then
		tb.countries, err = func_execute(tran,
[[
select country_id, descr from countries
    where hidden = 0 and (
	country_id = any(string_to_array(%country_id%,',')::uids_t)
	    or
	country_id in (select country_id from users where user_id=%user_id%)
	)
order by row_no, descr
]]
		    , "//info_materials/countries", { 
			user_id = sestb.erpid,
			country_id = sestb.country == nil and stor.NULL or sestb.country 
		    }
		)
	    end
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", 
[[
and (
    lower(m.author_id)=lower(%my%)
	or
    (
	(%country_id% is null or m.country_id = any(string_to_array(%country_id%,',')::uids_t))
	    and
	(%dep_id% is null or m.dep_id is null or m.dep_id = any(string_to_array(%dep_id%,',')::uids_t))
    )
)
]]
		) ,"//info_materials/get", { 
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country,
		    my = sestb.username
		}
	    )
	    if err == nil or err == false then
		tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, country_id from retail_chains
    where hidden = 0 and (%country_id% is null or country_id = any(string_to_array(%country_id%,',')::uids_t))
order by descr, ka_code, rc_id
]]
		    , "//info_materials/retail_chains", {
			country_id = sestb.country == nil and stor.NULL or sestb.country
		    }
		)
	    end
	    if err == nil or err == false then
		tb.departments, err = func_execute(tran,
[[
select dep_id, descr from departments
    where hidden = 0 and (%dep_id% is null or dep_id is null or dep_id=any(string_to_array(%dep_id%,',')::uids_t))
order by descr, dep_id
]]
		    , "//info_materials/departments", { 
			dep_id = sestb.department == nil and stor.NULL or sestb.department
		    }
		)
	    end
	    if err == nil or err == false then
		tb.countries, err = func_execute(tran,
[[
select country_id, descr from countries
    where hidden = 0 and (%country_id% is null or country_id = any(string_to_array(%country_id%,',')::uids_t))
order by row_no, descr
]]
		    , "//info_materials/countries", { 
			country_id = sestb.country == nil and stor.NULL or sestb.country 
		    }
		)
	    end
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"//info_materials/get"
	    )
	    if err == nil or err == false then
		tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, country_id from retail_chains
    where hidden = 0
order by descr, ka_code, rc_id
]]
		    , "//info_materials/retail_chains"
		)
	    end
	    if err == nil or err == false then
		tb.departments, err = func_execute(tran,
[[
select dep_id, descr from departments
    where hidden = 0
order by descr, dep_id
]]
		    , "//info_materials/departments"
		)
	    end
	    if err == nil or err == false then
		tb.countries, err = func_execute(tran,
[[
select country_id, descr from countries
    where hidden = 0
order by row_no, descr
]]
		    , "//info_materials/countries"
		)
	    end
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr from channels
    where hidden = 0
order by descr
]]
		, "//info_materials/channels"
	    )
	end

	return tb, err
    end
    )
end

local function blob(stor, infom_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select infom_id, blob, content_type from info_materials where infom_id = %infom_id%
]]
	, "//info_materials/blob/", {infom_id = infom_id})
    end
    )
end

local function author(stor, infom_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select author_id from info_materials where infom_id=%infom_id%
]]
	, "//info_materials/author/"
	, {infom_id = infom_id})
    end
    )
end

local function unlink(stor, uid, reqdt, infom_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_info_material(%req_uid%, %req_dt%, 'unlink', %infom_id%, null::console.info_material_t) rv
]]
        , "//info_materials/unlink/"
        , {req_uid = uid, req_dt = reqdt, infom_id = infom_id})
    end
    )
end

local function put(stor, uid, params)
    params.req_uid = uid
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_info_material(%req_uid%, %_datetime%, 'edit', %infom_id%, (
	%name%, 
	%country_id%, 
	%dep_id%, 
	%rc_id%, 
	string_to_array(%chan_ids%,','),
	%b_date%,
	%e_date%
    )
) rv
]]
	, "//info_materials/edit/"
	, params)
    end
    )
end

local function post(stor, uid, reqdt, blob, content_type)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_info_material(%req_uid%, %req_dt%/*, 'add'*/, %name%, %1:blob%, %content_type%) rv
]]
	, "//info_materials/add/"
	, {req_uid = uid, req_dt = reqdt, name = blob.name, content_type = content_type}
	, blob.contents)
    end
    )
end

local function split(arg)
    return arg ~= nil and core.split(arg,'|') or nil
end

local function personalize(data, u_id)
    local p = {}

    if data.rows ~= nil then
	for i, v in ipairs(data.rows) do
	    v.row_no = i
	    v._isowner = (v.author_id ~= nil and u_id:lower() == v.author_id:lower()) and true or false
	    v.chan_ids = split(v.chan_ids)
	    v.channels = split(v.channels)
	end
    end

    p.rows = data.rows
    p.mans = {}
    p.mans.countries = data.countries
    p.mans.departments = data.departments
    p.mans.retail_chains = data.retail_chains
    p.mans.channels = data.channels

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.countries.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.departments.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/info_materials.js"> </script>')
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
	    assert(validate.isuid(params.infom_id), "invalid [infom_id] parameter.")
	    -- execute query
	    tb, err = blob(stor, params.infom_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb[1].content_type == mime.pdf then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = tb[1].content_type,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.infom_id .. ".pdf\""
		})
		scgi.writeBody(res, tb[1].blob)
	    elseif tb[1].content_type == mime.mp4 then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = tb[1].content_type,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.infom_id .. ".mp4\""
		})
		scgi.writeBody(res, tb[1].blob)
	    elseif tb[1].content_type == mime.jpeg then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].blob)
	    else
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid BLOB type")
	    end
	else
	    tb, err = data(permtb, stor, sestb)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
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
	assert(permtb.add, "adding new info material is not permitted.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(mp.blob and mp.blob.size > 0, "invalid [blob] parameter.")
	assert(mp.blob.size <= permtb.add.max_file_size_mb*1024*1024, string.format("[blob] size should be less then %d MB.", 
	    permtb.add.max_file_size_mb))
	assert(core.contains({mime.pdf, mime.mp4, mime.jpeg},mp.content_type), "blob [content_type] is not supported.")
	-- execute query
	if post(stor, sestb.erpid or sestb.username, mp._datetime, mp.blob, mp.content_type) then
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
	assert(validate.isuid(params.infom_id), "invalid [infom_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(#mp.name, "invalid [name] parameter.")
	assert(validate.isuid(mp.country_id), "invalid [country_id] parameter.")
	assert(mp.dep_id == nil or validate.isuid(mp.dep_id), "invalid [dep_id] parameter.")
	assert(mp.rc_id == nil or validate.isuid(mp.rc_id), "invalid [rc_id] parameter.")
	assert(mp.chan_ids == nil or validate.isuids(mp.chan_ids), "invalid [chan_ids] parameter.")
	assert(mp.b_date == nil or validate.isdate(mp.b_date), "invalid [b_date] parameter.")
	assert(mp.e_date == nil or validate.isdate(mp.e_date), "invalid [e_date] parameter.")
	-- set unknown values
	if mp.dep_id == nil then mp.dep_id = stor.NULL end
	if mp.rc_id == nil then mp.rc_id = stor.NULL end
	if mp.chan_ids == nil then mp.chan_ids = stor.NULL end
	if mp.b_date == nil then mp.b_date = stor.NULL end
	if mp.e_date == nil then mp.e_date = stor.NULL end
	-- set default values
	mp.infom_id = params.infom_id
	-- check owner
	if permtb.edit == nil or permtb.edit ~= true then
	    local tb, err = author(stor, params.infom_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id:lower() == (sestb.erpid or sestb.username):lower(), 
		string.format("info material is not owned by [%s], unable to edit it [infom_id=%s].", 
		    sestb.erpid or sestb.username, params.infom_id))
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
	assert(validate.isuid(params.infom_id), "invalid [infom_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	-- check owner
	if permtb.remove == nil or permtb.remove ~= true then
	    local tb, err = author(stor, params.infom_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id:lower() == (sestb.erpid or sestb.username):lower(), 
		string.format("info material is not owned by [%s], unable to unlink it [infom_id=%s].", 
		    sestb.erpid or sestb.username, params.infom_id))
	end
	-- execute query
	if unlink(stor, sestb.erpid or sestb.username, mp._datetime, params.infom_id) then
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
