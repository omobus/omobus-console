-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

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
    m.tm_id, 
    m.descr, 
    blob_length(m.blob) blob_size,
    m.content_type,
    array_to_string(m.brand_ids,'|') brand_ids, 
    (select string_agg(descr, '|') from brands where brand_id=any(m.brand_ids)) brands,
    array_to_string(m.training_type_ids,'|') training_type_ids, 
    (select string_agg(descr, '|') from training_types where training_type_id=any(m.training_type_ids)) training_types,
    m.country_id, 
    c.descr country, 
    array_to_string(m.dep_ids,'|') dep_ids, 
    (select string_agg(descr, '|') from departments where dep_id=any(m.dep_ids)) departments,
    m.author_id, case when u.user_id is null then m.author_id else u.descr end author,
    m.b_date,
    m.e_date,
    m.shared
from training_materials m
    left join countries c on c.country_id=m.country_id
    left join users u on u.user_id=m.author_id
where m.hidden=0 $(0)
order by case when current_timestamp - m.updated_ts < '1 day' then current_timestamp - m.updated_ts else null end, m.descr, m.tm_id
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
	    m.dep_ids is null
		or
	    (select case when dep_ids is null or m.dep_ids && dep_ids then 1 else 0 end from users where user_id = %user_id%) > 0
	)
    )
)
]]
		) , "/plugins/training_materials/get", {
		    user_id = sestb.erpid,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
	    if err == nil or err == false then
		tb.brands, err = func_execute(tran,
[[
select brand_id, descr from brands
    where hidden = 0 and manuf_id in (select manuf_id from manufacturers where competitor is null or competitor = 0) 
	and brand_id in (select distinct brand_id from products where dep_ids is null or 
		dep_ids && coalesce((select dep_ids from users where user_id=%user_id%),dep_ids)
	    )
order by row_no, descr
]]
		    , "/plugins/training_materials/brands", { 
			user_id = sestb.erpid
		    }
		)
	    end
	    if err == nil or err == false then
		tb.training_types, err = func_execute(tran,
[[
select training_type_id, descr from training_types
    where hidden = 0 and (dep_ids is null or dep_ids && coalesce((select dep_ids from users where user_id=%user_id%),dep_ids))
order by row_no, descr
]]
		    , "/plugins/training_materials/training_types", { 
			user_id = sestb.erpid
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
		    , "/plugins/training_materials/departments", { 
			user_id = sestb.erpid 
		    }
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
		    , "/plugins/training_materials/countries", {
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
	(
	    %country_id% is null
		or
	    m.country_id = any(string_to_array(%country_id%,',')::uids_t)
	) and (
	    %dep_id% is null 
		or
	    m.dep_ids is null
		or
	    m.dep_ids && string_to_array(%dep_id%,',')::uids_t
	)
    )
)
]]
		) ,"/plugins/training_materials/get", { 
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
	and brand_id in (select distinct brand_id from products where dep_ids is null or %dep_id% is null or
		dep_ids && string_to_array(%dep_id%,',')::uids_t
	    )
order by row_no, descr
]]
		    , "/plugins/training_materials/brands", { 
			dep_id = sestb.department == nil and stor.NULL or sestb.department
		    }
		)
	    end
	    if err == nil or err == false then
		tb.training_types, err = func_execute(tran,
[[
select training_type_id, descr from training_types
    where hidden = 0 and (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
order by row_no, descr
]]
		    , "/plugins/training_materials/training_types", {
			dep_id = sestb.department == nil and stor.NULL or sestb.department
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
		    , "/plugins/training_materials/departments", {
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
		    , "/plugins/training_materials/countries", {
			country_id = sestb.country == nil and stor.NULL or sestb.country
		    }
		)
	    end
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"/plugins/training_materials/get"
	    )
	    if err == nil or err == false then
		tb.brands, err = func_execute(tran,
[[
select brand_id, descr from brands
    where hidden = 0 and manuf_id in (select manuf_id from manufacturers where competitor is null or competitor = 0)
order by row_no, descr
]]
		    , "/plugins/training_materials/brands"
		)
	    end
	    if err == nil or err == false then
		tb.training_types, err = func_execute(tran,
[[
select training_type_id, descr from training_types
    where hidden = 0
order by row_no, descr
]]
		    , "/plugins/training_materials/training_types"
		)
	    end
	    if err == nil or err == false then
		tb.departments, err = func_execute(tran,
[[
select dep_id, descr from departments
    where hidden = 0
order by descr, dep_id
]]
		    , "/plugins/training_materials/departments"
		)
	    end
	    if err == nil or err == false then
		tb.countries, err = func_execute(tran,
[[
select country_id, descr from countries
    where hidden = 0
order by row_no, descr
]]
		    , "/plugins/training_materials/countries"
		)
	    end
	end

	--[[ get data for filters without any limitations ]]
	tb._f = {}
	if err == nil or err == false then
	    tb._f.brands, err = func_execute(tran,
[[
select brand_id, descr, hidden from brands
    order by descr, row_no
]]
		, "/plugins/training_materials/_f/brands"
	    )
	end
	if err == nil or err == false then
	    tb._f.training_types, err = func_execute(tran,
[[
select training_type_id, descr, hidden from training_types
    order by descr, row_no
]]
		, "/plugins/training_materials/_f/training_types"
	    )
	end
	if err == nil or err == false then
	    tb._f.departments, err = func_execute(tran,
[[
select dep_id, descr, hidden from departments
    order by descr, dep_id
]]
		, "/plugins/training_materials/_f/departments"
	    )
	end
	if err == nil or err == false then
	    tb._f.countries, err = func_execute(tran,
[[
select country_id, descr, hidden from countries
    order by row_no, descr
]]
		, "/plugins/training_materials/_f/countries"
	    )
	end

	return tb, err
    end
    )
end

local function blob(stor, tm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select tm_id, blob, content_type from training_materials where tm_id = %tm_id%
]]
	, "/plugins/training_materials/blob", {tm_id = tm_id})
    end
    )
end

local function author(stor, tm_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select author_id from training_materials where tm_id=%tm_id%
]]
	, "/plugins/training_materials/author"
	, {tm_id = tm_id})
    end
    )
end

local function unlink(stor, uid, reqdt, tm_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_training_material(%req_uid%, %req_dt%, 'unlink', %tm_id%, null::console.training_material_t) rv
]]
        , "/plugins/training_materials/unlink"
        , {req_uid = uid, req_dt = reqdt, tm_id = tm_id})
    end
    )
end

local function put(stor, uid, params)
    params.req_uid = uid
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_training_material(%req_uid%, %_datetime%, 'edit', %tm_id%, (
	%name%, 
	string_to_array(%brand_ids%,','), 
	string_to_array(%training_type_ids%,','), 
	%country_id%, 
	string_to_array(%dep_ids%,','),
	%b_date%,
	%e_date%,
	%shared%::bool_t
    )
) rv
]]
	, "/plugins/training_materials/edit"
	, params)
    end
    )
end

local function post(stor, uid, reqdt, blob, content_type)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_training_material(%req_uid%, %req_dt%/*, 'add'*/, %name%, %1:blob%, %content_type%) rv
]]
	, "/plugins/training_materials/add"
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
    local idx_brands = {}
    local idx_types = {}
    local idx_deps = {}
    local idx_couns = {}

    if data.rows ~= nil then
	for i, v in ipairs(data.rows) do
	    v.row_no = i
	    v._isowner = (v.author_id ~= nil and u_id:lower() == v.author_id:lower()) and true or false
	    v.brand_ids = split(v.brand_ids)
	    v.brands = split(v.brands)
	    v.training_type_ids = split(v.training_type_ids)
	    v.training_types = split(v.training_types)
	    v.dep_ids = split(v.dep_ids)
	    v.departments = split(v.departments)

	    if v.brand_ids ~= nil then for _, q in ipairs(v.brand_ids) do idx_brands[q] = 1; end; end
	    if v.training_type_ids ~= nil then for _, q in ipairs(v.training_type_ids) do idx_types[q] = 1; end; end
	    if v.dep_ids ~= nil then for _, q in ipairs(v.dep_ids) do idx_deps[q] = 1; end; end
	    if v.country_id ~= nil then idx_couns[v.country_id] = 1; end
	end
    end

    p.rows = data.rows
    p.mans = {}
    p.mans.brands = data.brands
    p.mans.training_types = data.training_types
    p.mans.countries = data.countries
    p.mans.departments = data.departments
    p._f = {}
    p._f.brands = core.reduce(data._f.brands, 'brand_id', idx_brands)
    p._f.training_types = core.reduce(data._f.training_types, 'training_type_id', idx_types)
    p._f.countries = core.reduce(data._f.countries, 'country_id', idx_couns)
    p._f.departments = core.reduce(data._f.departments, 'dep_id', idx_deps)

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.brands.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.countries.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.departments.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.trainingtypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/training_materials.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb));
end

function M.data(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.blob ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.tm_id), "invalid [tm_id] parameter.")
	    -- execute query
	    tb, err = blob(stor, params.tm_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 or tb[1].blob == nil then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    elseif tb[1].content_type == mime.pdf then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = tb[1].content_type,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.tm_id .. ".pdf\""
		})
		scgi.writeBody(res, tb[1].blob)
	    elseif tb[1].content_type == mime.mp4 then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = tb[1].content_type,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.tm_id .. ".mp4\""
		})
		scgi.writeBody(res, tb[1].blob)
	    elseif tb[1].content_type == mime.jpeg then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].blob)
	    elseif tb[1].content_type == mime.zip then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = tb[1].content_type,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.tm_id .. ".zip\""
		})
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
	assert(permtb.add, "adding new training material is not permitted.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(mp.blob and mp.blob.size > 0, "invalid [blob] parameter.")
	assert(mp.blob.size <= permtb.add.max_file_size_mb*1024*1024, string.format("[blob] size should be less then %d MB.", 
	    permtb.add.max_file_size_mb))
	assert(core.contains({mime.pdf, mime.mp4, mime.jpeg, mime.zip},mp.content_type), "blob [content_type] is not supported.")
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
	assert(validate.isuid(params.tm_id), "invalid [tm_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(#mp.name, "invalid [name] parameter.")
	assert(mp.brand_ids == nil or validate.isuids(mp.brand_ids), "invalid [brand_ids] parameter.")
	assert(mp.training_type_ids == nil or validate.isuids(mp.training_type_ids), "invalid [training_type_ids] parameter.")
	assert(validate.isuid(mp.country_id), "invalid [country_id] parameter.")
	assert(mp.dep_ids == nil or validate.isuids(mp.dep_ids), "invalid [dep_ids] parameter.")
	assert(mp.b_date == nil or validate.isdate(mp.b_date), "invalid [b_date] parameter.")
	assert(mp.e_date == nil or validate.isdate(mp.e_date), "invalid [e_date] parameter.")
	-- set unknown values
	if mp.brand_ids == nil then mp.brand_ids = stor.NULL end
	if mp.training_type_ids == nil then mp.training_type_ids = stor.NULL end
	if mp.dep_ids == nil then mp.dep_ids = stor.NULL end
	if mp.b_date == nil then mp.b_date = stor.NULL end
	if mp.e_date == nil then mp.e_date = stor.NULL end
	mp.shared = mp.shared == 'true' and 1 or 0
	-- set default values
	mp.tm_id = params.tm_id
	-- check owner
	if permtb.edit == nil or permtb.edit ~= true then
	    local tb, err = author(stor, params.tm_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id:lower() == (sestb.erpid or sestb.username):lower(), 
		string.format("training material is not owned by [%s], unable to edit it [tm_id=%s].", 
		    sestb.erpid or sestb.username, params.tm_id))
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
	assert(validate.isuid(params.tm_id), "invalid [tm_id] parameter.")
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	-- check owner
	if permtb.remove == nil or permtb.remove ~= true then
	    local tb, err = author(stor, params.tm_id)
	    assert(tb ~= nil and #tb == 1 and tb[1].author_id:lower() == (sestb.erpid or sestb.username):lower(), 
		string.format("training material is not owned by [%s], unable to unlink it [tm_id=%s].", 
		    sestb.erpid or sestb.username, params.tm_id))
	end
	-- execute query
	if unlink(stor, sestb.erpid or sestb.username, mp._datetime, params.tm_id) then
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
