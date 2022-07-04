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
local log = require 'log'


local function data(stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs1, stint1, stint
	tb = {}
	qs1 =
[[
select 
    x.contact_id,
    x.account_id, 
    x.name,
    x.surname,
    x.patronymic,
    x.job_title_id, 
    x.mobile,
    x.email,
    x.spec_id,
    x.cohort_id, 
    x.locked,
    x.extra_info,
    x.consent_status,
    x.consent_dt,
    x.author_id,
    x.updated_ts,
    x."_isAlienData"
from contacts x 
where x.hidden = 0 $(0)
order by x.updated_ts desc, x."name", x.surname, x.patronymic, x.account_id, x.contact_id
]]
	if sestb.erpid ~= nil then
	    stint1 = { user_id = sestb.erpid }
	    stint2 =  [[
and x.account_id in (
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
and x.account_id in (
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
	    tb.rows, err = func_execute(tran, qs1:replace("$(0)", stint2), "/plugins/contacts/data/", stint1)
	end
	if err == nil or err == false then
	    tb.accounts, err = func_execute(tran,
[[
select account_id, code, descr, address, rc_id, chan_id, city_id, region_id, phone, hidden, locked from accounts
    order by descr, address, code
]]
		, "/plugins/contacts/accounts"
	    )
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "/plugins/contacts/channels"
	    )
	end
	if err == nil or err == false then
	    tb.cities, err = func_execute(tran,
[[
select city_id, descr, long_city_name(pid,1::bool_t) territory, hidden from cities
    order by descr
]]
		, "/plugins/contacts/cities"
        )
	end
	if err == nil or err == false then
	    tb.job_titles, err = func_execute(tran,
[[
select job_title_id, descr, hidden from job_titles
    order by descr
]]
		, "/plugins/contacts/job_titles"
	    )
	end
	if err == nil or err == false then
	    tb.cohorts, err = func_execute(tran,
[[
select cohort_id, descr, hidden from cohorts
    order by descr, row_no
]]
		, "/plugins/contacts/cohorts"
	    )
	end
	if err == nil or err == false then
	    tb.regions, err = func_execute(tran,
[[
select region_id, descr, hidden from regions
    order by descr
]]
		, "/plugins/contacts/regions"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_type, hidden from retail_chains
    order by descr
]]
		, "/plugins/contacts/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tb.specializations, err = func_execute(tran,
[[
select spec_id, descr, hidden from specializations
    order by descr
]]
		, "/plugins/contacts/specializations"
	    )
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "/plugins/contacts/users"
	    )
	end
	if err == nil or err == false then
	    tmp, err = func_execute(tran,
[[
select current_timestamp data_ts
]]
		, "/plugins/contactss/data_ts"
	    )
	    if tmp ~= nil and #tmp == 1 then
		tb.data_ts = tmp[1].data_ts
	    end
	end

	return tb, err
    end
    )
end

local function blob(stor, contact_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select contact_id, consent_data, consent_type from contacts where contact_id = %contact_id%
]]
	    , "/plugins/contacts/consent_data/", {contact_id = contact_id}
	)
    end
    )
end

local function compress(arg)
    return zlib.deflate(6):finish(arg)
end

local function personalize(datatb)
    local p = {}
    local i_accounts = {}
    local i_channels = {}
    local i_cities = {}
    local i_jobs = {}
    local i_loyalties = {}
    local i_regions = {}
    local i_retail_chains = {}
    local i_specs = {}
    local i_users = {}

    for i, v in ipairs(datatb.rows or {}) do
	i_accounts[v.account_id] = 1
	if v.job_title_id ~= nil then i_jobs[v.job_title_id] = 1; end
	if v.spec_id ~= nil then i_specs[v.spec_id] = 1; end
	if v.cohort_id ~= nil then i_loyalties[v.cohort_id] = 1; end
	if v.author_id ~= nil then i_users[v.author_id] = 1; end
	v.row_no = i
    end

    p.accounts = core.reduce(datatb.accounts, 'account_id', i_accounts)
    p.authors = core.reduce(datatb.users, 'user_id', i_users)
    p.job_titles = core.reduce(datatb.job_titles, 'job_title_id', i_jobs)
    p.cohorts = core.reduce(datatb.cohorts, 'cohort_id', i_loyalties)
    p.specializations = core.reduce(datatb.specializations, 'spec_id', i_specs)

    for i, v in ipairs(datatb.accounts or {}) do
        if v.chan_id ~= nil then i_channels[v.chan_id] = 1; end
        if v.city_id ~= nil then i_cities[v.city_id] = 1; end
        if v.region_id ~= nil then i_regions[v.region_id] = 1; end
        if v.rc_id ~= nil then i_retail_chains[v.rc_id] = 1; end
    end

    p.channels = core.reduce(datatb.channels, 'chan_id', i_channels)
    p.cities = core.reduce(datatb.cities, 'city_id', i_cities)
    p.regions = core.reduce(datatb.regions, 'region_id', i_regions)
    p.retail_chains = core.reduce(datatb.retail_chains, 'rc_id', i_retail_chains)

    p.rows = datatb.rows;
    p.data_ts = datatb.data_ts

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/xlsx-1.21.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.jobtitles.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.cohorts.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.specializations.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/contacts.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb))
end

function M.data(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.blob ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.contact_id), "invalid [contact_id] parameter.")
	    -- execute query
	    tb, err = blob(stor, params.contact_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb[1].consent_type == mime.pdf then
		scgi.writeHeader(res, 200, {
		    ["Content-Type"] = mime.pdf,
		    ["Content-Disposition"] = "inline; filename=\"" .. params.contact_id .. ".pdf\""
		})
		scgi.writeBody(res, tb[1].consent_data)
	    elseif tb[1].content_type == mime.jpeg then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].consent_data)
	    else
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid BLOB type")
	    end
	else
	    tb, err = data(stor, sestb)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or tb.rows == nil then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(personalize(tb))))
	    end
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
