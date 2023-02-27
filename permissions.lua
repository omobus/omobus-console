-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface
local NULL = (require 'stor').NULL

function M.L2(sestb)
    local arg1, arg2

    if sestb.erpid ~= nil then
	arg2 = { user_id = sestb.erpid }
	arg1 =  
[[
select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_habitats where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
    union
select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
    union
select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
]]
    elseif sestb.department ~= nil or sestb.country ~= nil then
	arg2 = {
	    dep_id = sestb.department == nil and NULL or sestb.department,
	    country_id = sestb.country == nil and NULL or sestb.country
	}
	arg1 = 
[[
select account_id from my_accounts where user_id in (
    select user_id from users
	where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	    and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
)
]]
    elseif sestb.distributor ~= nil then
	arg2 = { distr_id = sestb.distributor }
	arg1 = 
[[
select account_id from my_accounts where user_id in (
    select user_id from users
	where distr_ids && string_to_array(%distr_id%,',')::uids_t
)
]]
    elseif sestb.agency ~= nil then
	arg2 = { agency_id = sestb.agency }
	arg1 = 
[[
select account_id from my_accounts where user_id in (
    select user_id from users
	where agency_id=any(string_to_array(%agency_id%,','))
)
]]
    else
	arg2 = { }
	arg1 = 
[[
select account_id from accounts
]]
    end

    return arg1, arg2
end

return M
