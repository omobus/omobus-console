-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local ark = require 'archive'
local json = require 'json'
local validate = require 'validate'
local zlib = require 'zlib'
local core = require 'core'
local log = require 'log'

local function data(stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err
	if sestb.erpid ~= nil then
	    tb, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
    union
select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
    union
select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
]]
		, "//photos_archive/F.accounts", {user_id = sestb.erpid})
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (
    select user_id from users 
	where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	    and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
    )
]]
		, "//photos_archive/F.accounts", {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		})
	elseif sestb.distributor ~= nil then
	    tb, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select user_id from users where distr_ids && string_to_array(%distr_id%,',')::uids_t)
]]
		, "//photos_archive/F.accounts", {distr_id = sestb.distributor})
        elseif sestb.agency ~= nil then
	    tb, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select user_id from users where agency_id=any(string_to_array(%agency_id%,',')))
]]
		, "//photos_archive/F.accounts", {agency_id = sestb.agency})
	end
	return tb, err
    end
    )
end

local function compress(content_blob)
    return zlib.deflate(9):finish(content_blob)
end

local function personalize(data, f, permtb)
    local idx_accounts = {}
    local idx_cities = {}
    local idx_regions = {}
    local idx_rcs = {}
    local idx_channels = {}
    local idx_potentials = {}
    local tmp = {}

    log.i(string.format("original //photos_archive size is %d rows.", #data.rows))
    for _, v in ipairs(f) do
	idx_accounts[v.account_id] = 1
    end

    for _, v in ipairs(data.rows) do
	if idx_accounts[v.account_id] == 1 then
	    if v.region_id ~= nil then idx_regions[v.region_id] = 1; end
	    if v.city_id ~= nil then idx_cities[v.city_id] = 1; end
	    if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
	    if v.chan_id ~= nil then idx_channels[v.chan_id] = 1; end
	    if v.poten_id ~= nil then idx_potentials[v.poten_id] = 1; end
	    table.insert(tmp, v);
	    v.row_no = #tmp
	end
    end

    data.rows = tmp
    data.objects.regions = permtb.region and core.reduce(data.objects.regions, 'region_id', idx_regions) or nil
    data.objects.cities = core.reduce(data.objects.cities, 'city_id', idx_cities)
    data.objects.retail_chains = core.reduce(data.objects.retail_chains, 'rc_id', idx_rcs)
    data.objects.channels = permtb.channel and core.reduce(data.objects.channels, 'chan_id', idx_channels) or nil
    data.objects.potentials = permtb.potential and core.reduce(data.objects.potentials, 'poten_id', idx_potentials) or nil
    if not permtb.asp_type then data.objects.asp_types = nil; end
    if not permtb.brand then data.objects.brands = nil; end
    if not permtb.photo_type then data.objects.photo_types = nil; end
    data.objects.cities = nil
    log.i(string.format("reduced //photos_archive size is %d rows.", #data.rows))

    return data
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.asptypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.brands.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.phototypes.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.placements.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.potentials.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.regions.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/progress.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/photos_archive.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    local tb, err = ark.getJSON('photos')
    if params.year ~= nil and type(params.year) ~= 'number' then
	params.year = tonumber(params.year)
    end
    return string.format("startup(%s,%s,%s);", 
	params.year == nil and "new Date().getFullYear()" or params.year, 
	(err or tb == nil) and "null" or json.encode(tb), 
	json.encode(permtb)
    );
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" then
	if params.year ~= nil and type(params.year) ~= 'number' then
	    params.year = tonumber(params.year)
	end
	if params.blob_id ~= nil then 
	    assert(validate.isuid(params.blob_id), "invalid [blob_id] parameter.")
	    tb, err = ark.getJPEG(params.thumb and 'thumb' or 'photo', {ref = params.blob_id})
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
		scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb)
	    end
	elseif params.account_id ~= nil then
	    local tb, err, v, f

	    assert(validate.isuid(params.account_id), "invalid [account_id] parameter.")
	    assert(params.placement_id == nil or validate.isuid(params.placement_id), "invalid [placement_id] parameter.")
	    assert(params.asp_type_id == nil or validate.isuid(params.asp_type_id), "invalid [asp_type_id] parameter.")
	    assert(params.brand_id == nil or validate.isuid(params.brand_id), "function %s() invalid [brand_id] parameter.")
	    assert(params.photo_type_id == nil or validate.isuid(params.photo_type_id), "invalid [photo_type_id] parameter.")

	    if sestb.erpid ~= nil or sestb.department ~= nil or sestb.country ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
		tb, err = data(stor, sestb)
		if err then
		    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Internal server error")
		elseif tb == nil or #tb == 0 then
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Not permitted")
		else
		    for _, v in ipairs(tb) do
			if v.account_id == params.account_id then
			    f = true
			    break
			end
		    end
		end
	    else
		f = true
	    end
	    if not f then
		scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Not permitted")
	    else
		tb, err = ark.getJSON('photos', {
			year = params.year, 
			account_id = params.account_id, 
			placement_id = params.placement_id, 
			asp_type_id = params.asp_type_id,
			brand_id = params.brand_id, 
			photo_type_id = params.photo_type_id
		    })
		if err then
		    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Internal server error")
		elseif tb == nil or tb.photos == nil or #tb.photos == 0 then
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		    scgi.writeBody(res, "{}")
		else
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		    scgi.writeBody(res, compress(json.encode(tb)))
		end
	    end
	elseif params.year ~= nil then
	    local tb0, tb1, err

	    assert(params.placement_id == nil or validate.isuid(params.placement_id), "invalid [placement_id] parameter.")
	    assert(params.asp_type_id == nil or validate.isuid(params.asp_type_id), "invalid [asp_type_id] parameter.")
	    assert(params.brand_id == nil or validate.isuid(params.brand_id), "function %s() invalid [brand_id] parameter.")
	    assert(params.photo_type_id == nil or validate.isuid(params.photo_type_id), "invalid [photo_type_id] parameter.")

	    tb0, err = ark.getJSON('photos', {
		    year = params.year, 
		    placement_id = params.placement_id, 
		    asp_type_id = params.asp_type_id,
		    brand_id = params.brand_id,
		    photo_type_id = params.photo_type_id
		})
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb0 == nil or tb0.rows == nil or #tb0.rows == 0 then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    elseif sestb.erpid ~= nil or sestb.department ~= nil or sestb.country ~= nil or sestb.distributor ~= nil or sestb.agency ~= nil then
		tb1, err = data(stor, sestb)
		if err then
		    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Internal server error")
		elseif tb1 == nil or #tb1 == 0 then
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		    scgi.writeBody(res, "{}")
		else
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		    scgi.writeBody(res, compress(json.encode(personalize(tb0, tb1, permtb.columns or {}))))
		end
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(tb0)))
	    end
	else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Invalid input parameters.")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
