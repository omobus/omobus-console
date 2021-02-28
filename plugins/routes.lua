-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local core = require 'core'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local uri = require 'url'
local validate = require 'validate'
local zlib = require 'zlib'


local function genid(user_id, cycle_id, account_id)
    local ctx = hash.md5()
    ctx:update(user_id)
    ctx:update(':')
    ctx:update(cycle_id)
    ctx:update(':')
    ctx:update(account_id)
    return ctx:final(false)
end

local function compress(content_blob)
    return zlib.deflate(9):finish(content_blob)
end

local function cycles(stor, sestb, a)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select 
    cycle_id, 
    b_date, 
    e_date, 
    cycle_no, 
    case when status = 'closed' or status = %f% then 1 else 0 end closed, 
    extract(year from b_date::date) "year" 
from route_cycles 
    where hidden = 0
order by b_date desc
]]
	, "//routes/cycles/"
	, { f = a and '' or 'inprogress' } )
    end
    )
end

local function data(stor, sestb, cycle_id, a)
    return stor.get(function(tran, func_execute)
	local tb, err, tmp

	tmp, err = func_execute(tran,
[[
select 
    cycle_id, 
    b_date, 
    e_date, 
    cycle_no, 
    case when status = 'closed' or status = %f% then 1 else 0 end closed, 
    extract(year from b_date::date) "year", 
    ceil((e_date::date - b_date::date)::float/7) weeks 
from route_cycles 
    where hidden = 0 and (%cid% is null or cycle_id = %cid%) 
order by b_date desc limit 1
]]
	    , "//routes/cycle/"
	    , { cid = cycle_id == nil and stor.NULL or cycle_id, f = a and '' or 'inprogress' }
	)
	if (err == nil or err == false) and tmp ~= nil and #tmp >= 1 then
	    tb = tmp[1];
	    tb.code = "routes"
	    tb.closed = tonumber(tb.closed)
	    cycle_id = tb.cycle_id
	else
	    return nil, err
	end

        if sestb.erpid ~= nil then
	    tb.users, err = func_execute(tran,
[[
select s.s user_id, u.descr, u.dev_login from my_staff(%user_id%, 1::bool_t) s 
    left join users u on u.user_id=s.s 
where u.hidden=0
]]
		, "//routes/users/"
		, {user_id = sestb.erpid}
	    )
        elseif sestb.department ~= nil or sestb.country ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 
	and (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
order by descr
]]
		, "//routes/users/"
		, {
		    dep_id = sestb.department == nil and stor.NULL or sestb.department,
		    country_id = sestb.country == nil and stor.NULL or sestb.country
		}
	    )
        elseif sestb.distributor ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 and distr_ids && string_to_array(%distr_id%,',')::uids_t 
order by descr
]]
		, "//routes/users/"
		, {distr_id = sestb.distributor}
	    )
        elseif sestb.agency ~= nil then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 and agency_id=any(string_to_array(%agency_id%,',')) 
order by descr
]]
		, "//routes/users/"
		, {agency_id = sestb.agency})
        else
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login from users 
    where hidden=0 
order by descr
]]
		, "//routes/users/"
	    )
        end
	if not ((err == nil or err == false) and tb.users ~= nil and #tb.users >= 1) then
	    return nil, err
	end

	if tb.closed == nil or tb.closed == 0 then
	    tb.accounts, err = func_execute(tran,
[[
select 
    a.account_id, a.code a_code, a.descr a_name, a.address, a.latitude, a.longitude, c.descr chan, p.descr poten, 
    z.descr ratail_chain, z.ka_type, r.descr region, i.descr city, a.locked, a.approved
from accounts a
    left join potentials p on a.poten_id = p.poten_id
    left join channels c on a.chan_id = c.chan_id
    left join regions r on a.region_id = r.region_id
    left join cities i on a.city_id = i.city_id
    left join retail_chains z on a.rc_id = z.rc_id
where 
    (%req_uid% is null or account_id in (
	select distinct account_id from routes where cycle_id = %cycle_id% and (%req_uid% is null or user_id in (select my_staff(%req_uid%, 1::bool_t)))
	    union
	select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%req_uid%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
	    union
	select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%req_uid%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
	    union
	select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%req_uid%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
	)
    ) and a.hidden = 0
order by a.descr, a.address, a.account_id
]]
		, "//routes/habitat/"
		, {req_uid = sestb.erpid == nil and stor.NULL or sestb.erpid, cycle_id = cycle_id}
	    )
	    if err then
		return nil, err
	    end
	end

	tb.routes, err = func_execute(tran,
[[
select 
    r.account_id, a.code a_code, a.descr a_name, a.address, a.latitude, a.longitude, c.descr chan, p.descr poten, a.approved, a.locked, a.hidden,
    r.user_id, u.dev_login, u.descr u_name, r.cycle_id, array_to_string(r.days,',') days, array_to_string(r.weeks,',') weeks, 
    r.author_id, case when x.user_id is null then r.author_id else x.descr end author, r.updated_ts
from routes r
    left join users u on u.user_id = r.user_id
    left join users x on x.user_id = r.author_id
    left join accounts a on a.account_id = r.account_id
    left join channels c on a.chan_id = c.chan_id
    left join potentials p on a.poten_id = p.poten_id
where
    r.hidden = 0 and u.hidden = 0 and r.cycle_id = %cycle_id%
    and (%req_uid% is null or r.user_id in (select my_staff(%req_uid%, 1::bool_t)))
order by a.descr, a.address, a.account_id
]]
	    , "//routes/routes/"
	    , {req_uid = sestb.erpid == nil and stor.NULL or sestb.erpid, cycle_id = cycle_id}
	)

	return tb, err
    end
    )
end

local function set(stor, uid, reqdt, command, user_id, cycle_id, account_id, arg, a)
    return stor.get(function(tran, func_execute)
	local tb, err = func_execute(tran,
[[
select 
    case when status = 'closed' or status = %f% then 1 else 0 end closed
from route_cycles 
    where hidden = 0 and cycle_id = %cid%
]]
	    , "//routes/cycle/"
	    , { cid = cycle_id == nil and stor.NULL or cycle_id, f = a and '' or 'inprogress' }
	)
	if (err == nil or err == false) and tb ~= nil and #tb >= 1 then
	    if tonumber(tb.closed) == 1 then
		tb = {status='request_denied'}
	    else
		tb, err = func_execute(tran,
[[
select * from console.req_route(%req_uid%, %req_dt%, %cmd%, (%user_id%, %cycle_id%, %account_id%), %arg%)
]]
		    , "//routes/set/"
		    , {
			req_uid = uid, 
			req_dt = reqdt, 
			cmd = command, 
			user_id = user_id, 
			cycle_id = cycle_id, 
			account_id = account_id, 
			arg = arg == nil and stor.NULL or tonumber(arg)
		    }
		)
		if (err == nil or err == false) and tb ~= nil and #tb == 1 then
		    if tb[1].req_route == nil or tb[1].req_route == 0 then
			tb = {status='request_denied'}
		    elseif command == 'add' then
			tb, err = func_execute(tran,
[[
select 
    r.account_id, a.code a_code, a.descr a_name, a.address, a.latitude, a.longitude, c.descr chan, p.descr poten, a.approved, a.locked, a.hidden,
    r.user_id, u.dev_login, u.descr u_name, r.cycle_id, array_to_string(r.days,',') days, array_to_string(r.weeks,',') weeks, 
    r.author_id, case when x.user_id is null then r.author_id else x.descr end author, r.updated_ts
from routes r
    left join users u on u.user_id = r.user_id
    left join users x on x.user_id = r.author_id
    left join accounts a on a.account_id = r.account_id
    left join channels c on a.chan_id = c.chan_id
    left join potentials p on a.poten_id = p.poten_id
where
    r.cycle_id = %cycle_id% and r.user_id = %user_id% and r.account_id = %account_id%
]]
			    , "//routes/dump/"
			    , {user_id = user_id, cycle_id = cycle_id, account_id = account_id}
			)
			if (err == nil or err == false) and tb ~= nil and #tb == 1 then
			    tb = tb[1]
			    tb.status = 'success'
			    tb.weeks = core.split(tb.weeks, ',', tonumber)
			    tb.days = core.split(tb.days, ',', tonumber)
			    tb.row_id = genid(tb.user_id, tb.cycle_id, tb.account_id)
			else
			    tb = {status='runtime_error'}
			end
		    else
			tb = {status='success'}
		    end
		else
		    tb = {status='runtime_error'}
		end
	    end
	else
	    tb = {status='runtime_error'}
	end

	return tb, err
    end, false)
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    if permtb.mapEngine == 'Google.Maps' then
	if permtb.mapKey then
	    table.insert(ar, '<script src="https://maps.googleapis.com/maps/api/js?v=3&key=' .. permtb.mapKey .. '&libraries=places" type="text/javascript"> </script>')
	else
	    table.insert(ar, '<script src="https://maps.googleapis.com/maps/api/js?v=3" type="text/javascript"> </script>')
	end
    elseif permtb.mapEngine == 'Yandex.Maps' then
	if permtb.mapKey then
	    table.insert(ar, '<script src="https://api-maps.yandex.ru/2.1/?lang=ru-RU&apikey=' .. permtb.mapKey .. '" type="text/javascript"> </script>')
	else
	    table.insert(ar, '<script src="https://api-maps.yandex.ru/2.1/?lang=ru-RU" type="text/javascript"> </script>')
	end
    end
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup_L.cycles.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/routes.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    assert(params.cycle_id == nil or validate.isuid(params.cycle_id), "invalid [cycle_id] parameter.")
    return "startup(_('pluginContainer')," .. (params.cycle_id == nil and "null" or ("'" .. params.cycle_id .. "'")) 
	.. "," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    if method == "GET" and params.cycles ~= nil then
	local tb, err = cycles(stor, sestb, permtb.inprogress)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(tb))
	end
    elseif method == "GET" then
	-- validate input data
	assert(params.cycle_id == nil or validate.isuid(params.cycle_id), "invalid [cycle_id] parameter.")
	-- execute query
	local tb, err = data(stor, sestb, params.cycle_id, permtb.inprogress)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    local i, v, idx, tmp
	    idx = {}
	    tmp = {}
	    if tb.users ~= nil then
		for i, v in ipairs(tb.users) do
		    idx[v.user_id] = 1
		end
	    end
	    if tb.accounts ~= nil then
		for i, v in ipairs(tb.accounts) do
		    v.row_id = genid('', '', v.account_id)
		end
	    end
	    if tb.routes ~= nil then
		for i, v in ipairs(tb.routes) do
		    if idx[v.user_id] ~= nil then
			table.insert(tmp, v);
			v.weeks = core.split(v.weeks, ',', tonumber)
			v.days = core.split(v.days, ',', tonumber)
			v.row_id = genid(v.user_id, v.cycle_id, v.account_id)
		    end
		end
	    end
	    tb.routes = tmp
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
	    scgi.writeBody(res, compress(json.encode(tb)))
	end
    elseif method == "POST" or method == "PUT" or method == "DELETE" then
	local commands = {"set/day","drop/day","set/week","drop/week","remove","restore","add"}
	-- validate input data
	assert(validate.isdatetime(params._datetime), "invalid [_datetime] parameter.")
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	assert(validate.isuid(params.cycle_id), "invalid [cycle_id] parameter.")
	assert(validate.isuid(params.account_id), "invalid [account_id] parameter.")
	assert(params.cmd ~= nil and core.contains(commands, params.cmd), "unsupported command.")
	-- execute query
	local tb, err = set(stor, sestb.erpid or sestb.username, params._datetime, params.cmd, params.user_id, 
	    params.cycle_id, params.account_id, params.arg, permtb.inprogress)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"internal server error\"}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, json.encode(tb))
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
