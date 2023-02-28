-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'
local multipart = require 'multipart'
local permQuery = require 'permissions'
local zlib = require 'zlib'


local function data1(stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err, tmp, arg1, arg2
	tb = {}
	arg1, arg2 = permQuery.L2(sestb)
	tmp = 
[[
select
    x.account_id,
    x.qname_id,
    x.fix_dt,
    x.user_id,
    x.founded_dt,
    x.founder_id,
    x2.altered_dt,
    x2.censor_id
from (
    select distinct on (fix_date, account_id, qname_id)
	fix_date, 
	account_id, 
	qname_id,
	user_id,
	fix_dt,
	founder_id,
	founded_dt,
	updated_ts
    from dyn_quests
	where "_isRecentData" = 1
    order by fix_date desc, account_id, qname_id, fix_dt desc
) x
    left join (
	select distinct on (fix_date, account_id, qname_id)
	    fix_date, 
	    account_id, 
	    qname_id,
	    censor_id,
	    altered_dt
	from (
	    select fix_date, account_id, qname_id, censor_id, altered_dt from dyn_quests
		where "_isRecentData" = 1 and censor_id is not null and altered_dt is not null
		    union
	    select fix_date, account_id, qname_id, censor_id, altered_dt from dyn_quests2
		where "_isRecentData" = 1 and censor_id is not null and altered_dt is not null
	) v
	order by fix_date desc, account_id, qname_id, altered_dt desc
    ) x2 on x2.fix_date = x.fix_date and x2.account_id = x.account_id and x2.qname_id = x.qname_id
where x.account_id in (  $(0)  )
order by x.updated_ts desc, x.account_id, x.qname_id
]]

	if err == nil or err == false then
	    tb.rows, err = func_execute(tran, tmp:replace("$(0)", arg1),
		"/plugins/quests_results/data1/rows/", arg2)
	end
	if err == nil or err == false then
	    tmp = 
[[
select 
    account_id, code, descr, address, rc_id, chan_id, city_id, region_id, hidden, locked 
from accounts
where account_id in ( $(0) )
order by descr, address, code
]]
	    tb.accounts, err = func_execute(tran, tmp:replace("$(0)", arg1),
		"/plugins/quests_results/data1/accounts", arg2)
	end
	if err == nil or err == false then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "/plugins/quests_results/data1/channels"
	    )
	end
	if err == nil or err == false then
	    tb.cities, err = func_execute(tran,
[[
select city_id, descr, long_city_name(pid,1::bool_t) territory, hidden from cities
    order by descr
]]
		, "/plugins/quests_results/data1/cities"
	    )
	end
	if err == nil or err == false then
	    tb.quest_names, err = func_execute(tran,
[[
select qname_id, descr, hidden from quest_names
    order by descr, row_no
]]
		, "/plugins/quests_results/data1/quest_names"
	    )
	end
	if err == nil or err == false then
	    tb.regions, err = func_execute(tran,
[[
select region_id, descr, hidden from regions
    order by descr
]]
		, "/plugins/quests_results/data1/regions"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_type, hidden from retail_chains
    order by descr
]]
		, "/plugins/quests_results/data1/retail_chains"
	    )
	end
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "/plugins/quests_results/data1/users"
	    )
	end
	if err == nil or err == false then
	    tmp, err = func_execute(tran,
[[
select current_timestamp data_ts
]]
		, "/plugins/quests_results/data1/data_ts"
	    )
	    if tmp ~= nil and #tmp == 1 then
		tb.data_ts = tmp[1].data_ts
	    end
	end

	return tb, err
    end
    )
end

local function data2(stor, sestb, account_id, qname_id)
    return stor.get(function(tran, func_execute)
	local tb, err, tmp, arg1, arg2
	tb = { account_id = account_id, qname_id = qname_id }
	arg1, arg2 = permQuery.L2(sestb)
	tmp = 
[[
select
    a.account_id,
    a.code a_code,
    a.descr a_name,
    a.address,
    c.descr chan_name,
    a.phone,
    a.extra_info,
    a.hidden,
    a.locked
from accounts a
    left join channels c on c.chan_id = a.chan_id
where a.account_id = %account_id% and account_id in (  $(0)  )
]]
	arg2.account_id = account_id
	tmp, err = func_execute(tran, tmp:replace("$(0)", arg1), 
	    "/plugins/quests_results/data2/account", arg2)
	if (err == nil or err == false) and tmp ~= nil and #tmp == 1 then
	    tb.a = tmp[1]
	end
	if tb.a ~= nil and (err == nil or err == false) then
	    tmp, err = func_execute(tran,
[[
select qname_id, descr, hidden from quest_names
    where qname_id = %qname_id%
]]
		, "/plugins/quests_results/data2/quest_name"
		, { qname_id = qname_id }
	    )
	    if (err == nil or err == false) and tmp ~= nil and #tmp == 1 then
		tb.qname = tmp[1]
	    end
	end
	if tb.a ~= nil and tb.qname ~= nil and (err == nil or err == false) then
	    tb.rows, err = func_execute(tran,
[[
select
    d.fix_date,
    d.account_id,
    d.qname_id,
    d.qrow_id,
    quest_path(null, r.qname_id, r.pid) qpath, 
    r.descr qrow,
    r.extra_info,
    r.qtype,
    d.value,
    i.descr qitem,
    d.hidden,
    d.fix_dt,
    d.user_id,
    d.founded_dt,
    d.founder_id,
    d.altered_dt,
    d.censor_id,
    u3.descr censor_name
from dyn_quests d
    left join quest_rows r on r.qname_id = d.qname_id and r.qrow_id = d.qrow_id
    left join quest_items i on i.qname_id = r.qname_id and i.qrow_id = r.qrow_id and i.qitem_id = d.value and r.qtype = 'selector'
    left join users u3 on u3.user_id = d.censor_id
where d.account_id = %account_id% and d.qname_id = %qname_id% and d."_isRecentData" = 1
order by r.pid, r.row_no, r.descr
]]
		, "/plugins/quests_results/data2/dyn_quests"
		, { account_id = account_id, qname_id = qname_id }
	    )
	end
	if tb.a ~= nil and tb.qname ~= nil and (err == nil or err == false) then
	    tb.rows2, err = func_execute(tran,
[[
select
    d.fix_date,
    d.account_id,
    d.qname_id,
    d.guid,
    d.qentity_id,
    e.descr qentity,
    d.photo::varchar blob_id,
    ts.guid::varchar "ref",
    d.hidden,
    d.fix_dt,
    d.user_id,
    d.founded_dt,
    d.founder_id,
    d.altered_dt,
    d.censor_id,
    u3.descr censor_name
from dyn_quests2 d
    left join quest_entities e on e.qname_id = d.qname_id and e.qentity_id = d.qentity_id
    left join thumbnail_stream ts on ts.photo = d.photo
    left join users u3 on u3.user_id = d.censor_id
where d.account_id = %account_id% and d.qname_id = %qname_id% and d."_isRecentData" = 1 and d.photo is not null
order by e.row_no, e.descr
]]
		, "/plugins/quests_results/data2/dyn_quests2"
		, { account_id = account_id, qname_id = qname_id }
	    )
	end
	if tb.a ~= nil and tb.qname ~= nil and tb.rows ~= nil and (err == nil or err == false) then
	    tmp, err = func_execute(tran,
[[
select qrow_id, qitem_id, descr from quest_items
    where qname_id = %qname_id% and hidden = 0
order by qrow_id, row_no, descr, qitem_id
]]
		, "/plugins/quests_results/data2/quest_items"
		, { qname_id = qname_id }
	    )
	    if (err == nil or err == false) and tmp ~= nil and #tmp > 0 then
		for _, v1 in ipairs(tb.rows) do
		    if v1.qtype == 'selector' then
			local junk = {}
			v1.quest_items = {}
			for i2, v2 in ipairs(tmp) do
			    if v1.qrow_id == v2.qrow_id then
				table.insert(v1.quest_items, v2)
			    else
				table.insert(junk, v2)
			    end
			end
			tmp = junk
		    end
		end
	    end 
	end
	if tb.a ~= nil and tb.qname ~= nil and tb.rows ~= nil and (err == nil or err == false) then
	    for i, v in ipairs(tb.rows or {}) do
		if tb._Z1 == nil or v.fix_dt > tb._Z1.fix_dt then
		    tb._Z1 = v
		end
		if v.altered_dt ~= nil and (tb._Z2 == nil or v.altered_dt > tb._Z2.altered_dt) then
		    tb._Z2 = v
		end
	    end
	    for i, v in ipairs(tb.rows2 or {}) do
		if tb._Z1 == nil or v.fix_dt > tb._Z1.fix_dt then
		    tb._Z1 = v
		end
		if v.altered_dt ~= nil and (tb._Z2 == nil or v.altered_dt > tb._Z2.altered_dt) then
		    tb._Z2 = v
		end
	    end
	    if tb._Z1 ~= nil and (err == nil or err == false) then
		tmp, err = func_execute(tran,
[[
select 
    u.user_id,
    u.dev_login,
    u.descr u_name,
    coalesce(c.descr,u.country_id) country,
    u.area,
    u.email,
    u.mobile,
    ex.descr head_name,
    a.descr agency,
    (
	select array_to_string(array_agg(descr::text),'|') from distributors aa,
	    (select uu distr_id, row_number() over() rowno from unnest(u.distr_ids) uu) bb
	where aa.distr_id=bb.distr_id order by min(bb.rowno)
    ) distributors,
    (
	select array_to_string(array_agg(descr::text),'|') from departments aa,
	    (select uu dep_id, row_number() over() rowno from unnest(u.dep_ids) uu) bb
	where aa.dep_id=bb.dep_id order by min(bb.rowno)
    ) departments,
    u.hidden
from users u
    left join countries c on c.country_id = u.country_id
    left join agencies a on a.agency_id = u.agency_id
    left join users ex on ex.user_id = u.executivehead_id
where u.user_id = %user_id%
]]
		    , "/plugins/quests_results/data2/user"
		    , { user_id = tb._Z1.user_id }
		)
		if (err == nil or err == false) and tmp ~= nil and #tmp == 1 then
		    tb.u = tmp[1]
		    tb.fix_dt = tb._Z1.fix_dt
		    tb.user_id = tb._Z1.user_id
		    if tb.u.distributors ~= nil then
			tb.u.distributors = core.split(tb.u.distributors, '|')
		    end
		    if tb.u.departments ~= nil then
			tb.u.departments = core.split(tb.u.departments, '|')
		    end
		end
	    end
	    if tb._Z1 ~= nil and (err == nil or err == false) then
		tmp, err = func_execute(tran,
[[
select user_id, dev_login, descr u_name, hidden from users
    where user_id = %user_id%
]]
		    , "/plugins/quests_results/data2/founder"
		    , { user_id = tb._Z1.founder_id }
		)
		if (err == nil or err == false) and tmp ~= nil and #tmp == 1 then
		    tb.founder = tmp[1]
		    tb.founded_dt = tb._Z1.founded_dt
		    tb.founder_id = tb._Z1.founder_id
		end
	    end
	    if tb._Z2 ~= nil and (err == nil or err == false) then
		tmp, err = func_execute(tran,

[[
select user_id, dev_login, descr u_name, hidden from users
    where user_id = %user_id%
]]
		    , "/plugins/quests_results/data2/censor"
		    , { user_id = tb._Z2.censor_id }
		)
		if (err == nil or err == false) and tmp ~= nil and #tmp == 1 then
		    tb.censor = tmp[1]
		end
		tb.altered_dt = tb._Z2.altered_dt
		tb.censor_id = tb._Z2.censor_id
	    end
	    tb.fix_date = tb._Z1.fix_date
	    tb._Z1 = nil
	    tb._Z2 = nil
	end
	if err == nil or err == false then
	    tmp, err = func_execute(tran,
[[
select current_timestamp data_ts
]]
		, "/plugins/quests_results/data2/data_ts"
	    )
	    if tmp ~= nil and #tmp == 1 then
		tb.data_ts = tmp[1].data_ts
	    end
	end

	if tb.a == nil or tb.qname == nil or tb.rows == nil then
	    tb = nil
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
	, "/plugins/quests_results/photo"
	, {blob_id = blob_id})
    end
    )
end


local function thumb(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select thumb_get(%blob_id%::blob_t) photo
]]
	, "/plugins/quests_results/thumb"
	, {blob_id = blob_id})
    end
    )
end

local function hiddenStatus(stor, uid, reqdt, cmd, attrs)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_quest(
    %req_uid%, 
    %req_dt%, 
    %command%, 
    hstore('fix_date',%fix_date%::text) || hstore('account_id',%account_id%::text) ||
	hstore('qname_id',%qname_id%::text) || hstore('qrow_id',%qrow_id%::text)
) rv
]]
	, "/plugins/quests_results/" .. cmd
	, { 
	    command = cmd,
	    req_uid = uid, 
	    req_dt = reqdt, 
	    fix_date = attrs.fix_date or stor.NULL, 
	    account_id = attrs.account_id or stor.NULL, 
	    qname_id = attrs.qname_id or stor.NULL, 
	    qrow_id = attrs.qrow_id or stor.NULL
	})
    end
    )
end

local function hiddenStatus2(stor, uid, reqdt, cmd, attrs)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_quest(
    %req_uid%, 
    %req_dt%, 
    %command%, 
    hstore('fix_date',%fix_date%::text) || hstore('account_id',%account_id%::text) ||
	hstore('qname_id',%qname_id%::text) || hstore('guid',%guid%::text) ||
	hstore('qentity_id',%qentity_id%::text)
) rv
]]
	, "/plugins/quests_results/" .. cmd
	, { 
	    command = cmd,
	    req_uid = uid, 
	    req_dt = reqdt, 
	    fix_date = attrs.fix_date or stor.NULL, 
	    account_id = attrs.account_id or stor.NULL, 
	    qname_id = attrs.qname_id or stor.NULL, 
	    guid = attrs.guid or stor.NULL,
	    qentity_id = attrs.qentity_id or stor.NULL
	})
    end
    )
end

local function hiddenStatusEverything(stor, uid, reqdt, attrs)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_quest(
    %req_uid%, 
    %req_dt%, 
    'erase', 
    hstore('fix_date',%fix_date%::text) || hstore('account_id',%account_id%::text) ||
	hstore('qname_id',%qname_id%::text)
) rv
]]
	, "/plugins/quests_results/erase"
	, { 
	    req_uid = uid, 
	    req_dt = reqdt, 
	    fix_date = attrs.fix_date or stor.NULL, 
	    account_id = attrs.account_id or stor.NULL, 
	    qname_id = attrs.qname_id or stor.NULL
	})
    end
    )
end

local function set(stor, uid, reqdt, attrs)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_quest(
    %req_uid%, 
    %req_dt%, 
    'set', 
    hstore('fix_date',%fix_date%::text) || hstore('account_id',%account_id%::text) ||
	hstore('qname_id',%qname_id%::text) || hstore('qrow_id',%qrow_id%::text) ||
	hstore('value',%value%::text)
) rv
]]
	, "/plugins/quests_results/set"
	, { 
	    req_uid = uid, 
	    req_dt = reqdt, 
	    fix_date = attrs.fix_date or stor.NULL, 
	    account_id = attrs.account_id or stor.NULL, 
	    qname_id = attrs.qname_id or stor.NULL, 
	    qrow_id = attrs.qrow_id or stor.NULL,
	    value = attrs.value or stor.NULL
	})
    end
    )
end

local function urgent(stor, uid, reqdt, attrs)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_quest(
    %req_uid%, 
    %req_dt%, 
    'urgent', 
    hstore('fix_date',%fix_date%::text) || hstore('account_id',%account_id%::text) ||
	hstore('qname_id',%qname_id%::text) || hstore('note',%note%::text)
) rv
]]
	, "/plugins/quests_results/urgent"
	, { 
	    req_uid = uid, 
	    req_dt = reqdt, 
	    fix_date = attrs.fix_date or stor.NULL, 
	    account_id = attrs.account_id or stor.NULL, 
	    qname_id = attrs.qname_id or stor.NULL,
	    note = attrs.note or stor.NULL
	})
    end
    )
end

local function genid(quest_id, account_id)
    local ctx = hash.md5()
    ctx:update(quest_id or "?")
    ctx:update(':')
    ctx:update(account_id or "?")
    return ctx:final(false)
end

local function compress(content_blob)
    return zlib.deflate(6):finish(content_blob)
end

local function personalize(datatb)
    local p = {}
    local i_accounts = {}
    local i_channels = {}
    local i_cities = {}
    local i_qnames = {}
    local i_regions = {}
    local i_retail_chains = {}
    local i_users = {}
    local i_founders = {}
    local i_censors = {}

    for i, v in ipairs(datatb.rows or {}) do
	i_accounts[v.account_id] = 1
	i_users[v.user_id] = 1
	i_founders[v.founder_id] = 1
	if v.censor_id ~= nil then i_censors[v.censor_id] = 1; end
	if v.qname_id ~= nil then i_qnames[v.qname_id] = 1; end
	v.row_no = i
	v.row_id = genid(v.qname_id, v.account_id)
    end

    p.accounts = core.reduce(datatb.accounts, 'account_id', i_accounts)
    p.users = core.reduce(core.deepcopy(datatb.users), 'user_id', i_users)
    p.founders = core.reduce(core.deepcopy(datatb.users), 'user_id', i_founders)
    p.censors = core.reduce(core.deepcopy(datatb.users), 'user_id', i_censors)
    p.quest_names = core.reduce(datatb.quest_names, 'qname_id', i_qnames)

    for i, v in ipairs(p.accounts or {}) do
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
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.questnames.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/quests_results.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return string.format("startup(%s,%s);", json.encode(params), json.encode(permtb))
end

function M.data(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" and params.blob ~= nil then
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
    elseif method == "GET" then
	if params.account_id ~= nil and params.qname_id ~= nil then
	    -- validate input data
	    assert(validate.isuid(params.account_id), "invalid [account_id] parameter.")
	    assert(validate.isuid(params.qname_id), "invalid [qname_id] parameter.")
	    -- execute query
	    tb, err = data2(stor, sestb, params.account_id, params.qname_id)
	else
	    -- execute query
	    tb, err = data1(stor, sestb)
	    if tb ~= nil then
		tb = personalize(tb)
	    end
	end
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil or tb.rows == nil then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
	    scgi.writeBody(res, compress(json.encode(tb)))
	end
    elseif (method == "DELETE" or method == 'PUT') and params.facility == 'Q' then
	local cmd = method == "DELETE" and "remove" or "restore"
	-- check permissions
	assert(permtb.remove ~= nil and permtb.remove == true, string.format('[%s] command not permitted.', cmd))
        -- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(mp.fix_date), "invalid [fix_date] parameter.")
	assert(validate.isuid(mp.account_id), "invalid [account_id] parameter.")
	assert(validate.isuid(mp.qname_id), "invalid [qname_id] parameter.")
	assert(validate.isuid(mp.qrow_id), "invalid [qrow_id] parameter.")
	-- execute query
	if hiddenStatus(stor, sestb.erpid or sestb.username, mp._datetime, cmd, mp) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif (method == "DELETE" or method == 'PUT') and params.facility == 'Q2' then
	local cmd = method == "DELETE" and "remove2" or "restore2"
	-- check permissions
	assert(permtb.remove ~= nil and permtb.remove == true, string.format('[%s] command not permitted.', cmd))
        -- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(mp.fix_date), "invalid [fix_date] parameter.")
	assert(validate.isuid(mp.account_id), "invalid [account_id] parameter.")
	assert(validate.isuid(mp.qname_id), "invalid [qname_id] parameter.")
	assert(validate.isuid(mp.guid), "invalid [guid] parameter.")
	assert(validate.isuid(mp.qentity_id), "invalid [qentity_id] parameter.")
	-- execute query
	if hiddenStatus2(stor, sestb.erpid or sestb.username, mp._datetime, cmd, mp) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" and params.facility == 'erase' then
	local cmd = params.facility
	-- check permissions
	assert(permtb.eraseEverything ~= nil and permtb.eraseEverything == true, string.format('[%s] command not permitted.', cmd))
        -- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(mp.fix_date), "invalid [fix_date] parameter.")
	assert(validate.isuid(mp.account_id), "invalid [account_id] parameter.")
	assert(validate.isuid(mp.qname_id), "invalid [qname_id] parameter.")
	-- execute query
	if hiddenStatusEverything(stor, sestb.erpid or sestb.username, mp._datetime, mp) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == 'PUT' and params.facility == 'set' then
	local cmd = params.facility
	-- check permissions
	assert(permtb.edit ~= nil and permtb.edit == true, string.format('[%s] command not permitted.', cmd))
        -- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(mp.fix_date), "invalid [fix_date] parameter.")
	assert(validate.isuid(mp.account_id), "invalid [account_id] parameter.")
	assert(validate.isuid(mp.qname_id), "invalid [qname_id] parameter.")
	assert(validate.isuid(mp.qrow_id), "invalid [qrow_id] parameter.")
	assert(mp.value ~= nil, "invalid [value] parameter.")
	-- execute query
	if set(stor, sestb.erpid or sestb.username, mp._datetime, mp) then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "POST" and params.facility == 'urgent' then
	local cmd = params.facility
	-- check permissions
	assert(permtb.urgent ~= nil and permtb.urgent == true, string.format('[%s] command not permitted.', cmd))
        -- validate input data
	assert(string.find(content_type, "multipart/form-data", 1, true),
	    string.format("unsupported content type (expected: %s, received: %s).", "multipart/form-data", content_type))
	mp = multipart.parse(content, content_type)
	assert(mp, "unable to parse multipart data.")
	assert(validate.isdatetime(mp._datetime), "invalid [_datetime] parameter.")
	assert(validate.isdate(mp.fix_date), "invalid [fix_date] parameter.")
	assert(validate.isuid(mp.account_id), "invalid [account_id] parameter.")
	assert(validate.isuid(mp.qname_id), "invalid [qname_id] parameter.")
	assert(mp.note ~= nil and #mp.note > 0, "invalid [note] parameter.")
	-- execute query
	if urgent(stor, sestb.erpid or sestb.username, mp._datetime, mp) then
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
