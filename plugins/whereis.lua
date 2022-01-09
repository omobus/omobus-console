-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'
local zlib = require 'zlib'


local function data(stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs1, stint1, stint2, tmp
	tb = {}
	qs1 =
[[
select account_id, prod_id, max(fix_date) fix_date from (
    select distinct account_id, prod_id, fix_date from dyn_checkups where "_isRecentData" = 1 and exist > 0 and fix_date >= (current_date-"paramInteger"('whereis:depth'))::date_t
	union
    select distinct account_id, prod_id, fix_date from dyn_presences where "_isRecentData" = 1 and stock > 0 and fix_date >= (current_date-"paramInteger"('whereis:depth'))::date_t
	union 
    select distinct account_id, prod_id, fix_date from dyn_stocks where "_isRecentData" = 1 and stock > 0 and fix_date >= (current_date-"paramInteger"('whereis:depth'))::date_t
) q1 
where 1=1 $(0)
group by account_id, prod_id
order by max(fix_date) desc, account_id, prod_id
]]

	if sestb.erpid ~= nil then
	    stint1 = { user_id = sestb.erpid }
	    stint2 =  [[
and account_id in (
    select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
	union
    select account_id from my_habitats where user_id in (select my_staff(%user_id%, 1::bool_t))
	union
    select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
	union
    select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
	union
    select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
)
]]
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    stint1 = {
		dep_id = sestb.department == nil and stor.NULL or sestb.department,
		country_id = sestb.country == nil and stor.NULL or sestb.country
	    }
	    stint2 = [[
and account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users
	    where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
		and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
    )
)
]]
	elseif sestb.distributor ~= nil then
	    stint1 = { distr_id = sestb.distributor }
	    stint2 = [[
and x.account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users
	    where distr_ids && string_to_array(%distr_id%,',')::uids_t
    )
)
]]
	elseif sestb.agency ~= nil then
	    stint1 = { agency_id = sestb.agency }
	    stint2 = [[
and x.account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users
	    where agency_id=any(string_to_array(%agency_id%,','))
    )
)
]]
	else
	    stint1 = {}
	    stint2 = ""
	end
	
	if err == nil or err == false then
	    tb.whereis, err = func_execute(tran, qs1:replace("$(0)", stint2), "/plugins/whereis/data/", stint1)
	end
	if err == nil or err == false then
	    tb.accounts, err = func_execute(tran,
[[
select account_id, code, descr, address, rc_id, chan_id, city_id, region_id, phone, hidden, locked from accounts
    order by descr, address, code
]]
		, "/plugins/whereis/accounts"
	    )
	end
	if err == nil or err == false then
	    tb.brands, err = func_execute(tran,
[[
select
    b.brand_id, b.descr, m.descr manuf, m.competitor, b.hidden
from brands b
    left join manufacturers m on m.manuf_id = b.manuf_id
order by m.competitor nulls first, b.row_no, b.descr
]]
		, "/plugins/whereis/brands"
	    )
	end
	if err == nil or err == false then
	    tb.categories, err = func_execute(tran,
[[
select categ_id, descr, hidden from categories
    order by descr
]]
		, "/plugins/whereis/categories"
	    )
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "/plugins/whereis/channels"
	    )
	end
	if err == nil or err == false then
	    tb.cities, err = func_execute(tran,
[[
select city_id, descr, long_city_name(pid,1::bool_t) territory, hidden from cities
    order by descr
]]
		, "/plugins/whereis/cities"
	    )
	end
	if err == nil or err == false then
	    tb.products, err = func_execute(tran,
[[
select prod_id, code, descr, categ_id, brand_id, hidden from products
    order by descr
]]
		, "/plugins/whereis/products"
	    )
	end
	if err == nil or err == false then
	    tb.regions, err = func_execute(tran,
[[
select region_id, descr, hidden from regions
    order by descr
]]
		, "/plugins/whereis/regions"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_type, hidden from retail_chains
    order by descr
]]
		, "/plugins/whereis/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tmp, err = func_execute(tran,
[[
select current_timestamp data_ts
]]
		, "/plugins/whereis/data_ts"
	    )
	    if tmp ~= nil and #tmp == 1 then
		tb.data_ts = tmp[1].data_ts
	    end
	end

	return tb, err
    end
    )
end

local function compress(arg)
    return zlib.deflate(6):finish(arg)
end

local function personalize(data)
    local p = {}
    local i_accounts = {}
    local i_brands = {}
    local i_categories = {}
    local i_channels = {}
    local i_cities = {}
    local i_products = {}
    local i_regions = {}
    local i_retail_chains = {}

    p.whereis = data.whereis

    for i, v in ipairs(p.whereis or {}) do
	i_accounts[v.account_id] = 1
	i_products[v.prod_id] = 1
    end

    p.accounts = core.reduce(data.accounts, 'account_id', i_accounts)
    p.products = core.reduce(data.products, 'prod_id', i_products)

    for i, v in ipairs(p.accounts or {}) do
        if v.chan_id ~= nil then i_channels[v.chan_id] = 1; end
        if v.city_id ~= nil then i_cities[v.city_id] = 1; end
        if v.region_id ~= nil then i_regions[v.region_id] = 1; end
        if v.rc_id ~= nil then i_retail_chains[v.rc_id] = 1; end
    end
    for i, v in ipairs(p.products or {}) do
        if v.brand_id ~= nil then i_brands[v.brand_id] = 1; end
        if v.categ_id ~= nil then i_categories[v.categ_id] = 1; end
    end

    p.brands = core.reduce(data.brands, 'brand_id', i_brands)
    p.categories = core.reduce(data.categories, 'categ_id', i_categories)
    p.channels = core.reduce(data.channels, 'chan_id', i_channels)
    p.cities = core.reduce(data.cities, 'city_id', i_cities)
    p.regions = core.reduce(data.regions, 'region_id', i_regions)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', i_retail_chains)
    p.data_ts = data.data_ts

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/xlsx-1.21.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/murmurhash3_gc.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.brands.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.categories.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.cities.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.products.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.regions.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/whereis.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb))
end

function M.data(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	tb, err = data(stor, sestb)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil or tb.whereis == nil or #tb.whereis == 0 then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
	    scgi.writeBody(res, compress(json.encode(personalize(tb))))
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
