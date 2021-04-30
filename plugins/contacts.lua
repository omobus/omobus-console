-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'
local zlib = require 'zlib'
local log = require 'log'


local function data(stor, permtb, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, qs
	tb = {}
	qs =
[[
select 
    x.contact_id,
    x.account_id, a.code a_code, a.descr a_name, a.address, a.hidden a_hidden, a.locked a_locked,
    /*re.descr region,*/
    /*c.descr city,*/
    a.rc_id, r.descr rc, r.ka_type,
    /*p.descr poten,*/
    a.chan_id, ch.descr chan,
    x.name "name",
    x.surname,
    x.patronymic,
    x.job_title_id, j.descr job_title,
    x.phone,
    x.mobile,
    x.email,
    x.loyalty_level_id, l.descr loyalty_level,
    x.locked "locked",
    x.extra_info,
    x.author_id, coalesce(au.descr, x.author_id) author,
    x.updated_ts,
    x."_isAlienData",
    case when x.consent is not null then 1 else null end "_isConsentExist"
from contacts x 
    left join job_titles j on j.job_title_id = x.job_title_id
    left join loyalty_levels l on l.loyalty_level_id = x.loyalty_level_id
    left join accounts a on a.account_id = x.account_id
    /*left join potentials p on a.poten_id = p.poten_id*/
    left join channels ch on a.chan_id = ch.chan_id
    left join retail_chains r on a.rc_id = r.rc_id
    /*left join regions re on a.region_id = re.region_id*/
    /*left join cities c on a.city_id = c.city_id*/
    left join users au on au.user_id = x.author_id
where x.hidden = 0 $(0)
order by a.descr, a.address, a.code, x."name", x.surname, x.patronymic, x.contact_id
]]
	if sestb.erpid ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)",
[[
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
		) , "//contacts/get", { user_id = sestb.erpid }
	    )
	elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)",
[[
and x.account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users 
	    where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
		and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
    )
)
]]
		) ,"//contacts/get", {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
	elseif sestb.distributor ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)",
[[
and x.account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users
	    where distr_ids && string_to_array(%distr_id%,',')::uids_t
    )
)
]]
		) ,"//contacts/get", { distr_id = sestb.distributor }
	    )
	elseif sestb.agency ~= nil then
	    tb.rows, err = func_execute(tran, qs:replace("$(0)",
[[
and x.account_id in (
    select account_id from my_accounts where user_id in (
	select user_id from users
	    where agency_id=any(string_to_array(%agency_id%,','))
    )
)
]]
		) ,"//contacts/get", { agency_id = sestb.agency }
	    )
	else
	    tb.rows, err = func_execute(tran, qs:replace("$(0)", ""),
		"//contacts/get"
	    )
        end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//contacts/users"
	    )
	end
	if permtb.channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//contacts/channels"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_type, hidden from retail_chains
    order by descr
]]
		, "//contacts/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tb.job_titles, err = func_execute(tran,
[[
select job_title_id, descr, hidden from job_titles
    order by descr
]]
		, "//contacts/job_titles"
	    )
	end
	if err == nil or err == false then
	    tb.loyalty_levels, err = func_execute(tran,
[[
select loyalty_level_id, descr, hidden from loyalty_levels
    order by descr, row_no
]]
		, "//contacts/loyalty_levels"
	    )
	end

	return tb, err
    end
    )
end

local function consent(stor, contact_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select consent from contacts where contact_id = %contact_id%
]]
	, "//contacts/consent"
	, {contact_id = contact_id})
    end
    )
end

local function compress(arg)
    return zlib.deflate(6):finish(arg)
end

local function personalize(datatb)
    local idx_chans = {}
    local idx_rcs = {}
    local idx_jts = {}
    local idx_lls = {}
    local idx_aus = {}

    for i, v in ipairs(datatb.rows) do
	if v.chan_id ~= nil then idx_chans[v.chan_id] = 1; end
	if v.rc_id ~= nil then idx_rcs[v.rc_id] = 1; end
	if v.job_title_id ~= nil then idx_jts[v.job_title_id] = 1; end
	if v.loyalty_level_id ~= nil then idx_lls[v.loyalty_level_id] = 1; end
	if v.author_id ~= nil then idx_aus[v.author_id] = 1; end
	v.row_no = i
    end

    datatb.channels = core.reduce(datatb.channels, 'chan_id', idx_chans)
    datatb.retail_chains = core.reduce(datatb.retail_chains, 'rc_id', idx_rcs)
    datatb.job_titles = core.reduce(datatb.job_titles, 'job_title_id', idx_jts)
    datatb.authors = core.reduce(datatb.users, 'user_id', idx_aus)
    datatb.users = nil

    return datatb
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/libs/xlsx-1.21.0.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.jobtitles.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.loyaltylevels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/contacts.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s);", json.encode(permtb))
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	if params.consent ~= nil and params.contact_id ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.contact_id), "invalid [contact_id] parameter.")
	    -- execute query
	    tb, err = consent(stor, params.contact_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 or tb[1].consent == nil then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].consent)
	    end
	else
	    -- execute query
	    tb, err = data(stor, permtb.columns or {}, sestb)
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
