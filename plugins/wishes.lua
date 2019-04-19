-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local V = require 'version'
local mime = require 'mime'
local scgi = require 'scgi'
local json = require 'json'
local validate = require 'validate'
local core = require 'core'


local function data(permtb, stor, sestb)
    return stor.get(function(tran, func_execute)
	local tb, err
	tb = {}
	tb.rows, err = func_execute(tran,
[[
select
    md5(format('%s:%s', j.user_id, j.account_id)) row_id,
    j.validated, j.hidden rejected, a.hidden closed, 
    j.account_id, a.code a_code, a.descr a_name, a.address,
    reg.descr region,
    c.descr city,
    a.rc_id, r.descr rc, r.ka_code,
    p.descr poten,
    a.chan_id, ch.descr chan,
    j.user_id, u.descr u_name, u.dev_login, u.area,
    j.validator_id v_code, v.descr v_name,
    j.fix_dt, j.note, w.descr weeks, d.descr days,
    u.executivehead_id head_id, ex.descr head_name
from j_wishes j
    left join wish_weeks w on w.wish_week_id = j.wish_week_id
    left join wish_days d on d.wish_day_id = j.wish_day_id
    left join accounts a on a.account_id = j.account_id
    left join potentials p on a.poten_id = p.poten_id
    left join channels ch on a.chan_id = ch.chan_id
    left join retail_chains r on a.rc_id = r.rc_id
    left join regions reg on a.region_id = reg.region_id
    left join cities c on a.city_id = c.city_id
    left join users u on u.user_id = j.user_id
    left join users ex on ex.user_id = u.executivehead_id
    left join users v on v.user_id = j.validator_id
where
    (
	(j.validated = 0 and j.hidden = 0 and a.hidden = 0 and %registered% = 1)
	or (j.validated = 1 and j.hidden = 0 and a.hidden = 0 and %validated% = 1)
	or (j.hidden = 1 and a.hidden = 0 and %rejected% = 1)
	or (a.hidden = 1 and %closed% = 1)
    )
    and (%user_id% is null or j.user_id in (select * from my_staff(%user_id%, 1::bool_t)))
    and (%distr_id% is null or u.distr_ids && string_to_array(%distr_id%,',')::uids_t)
    and (%agency_id% is null or u.agency_id = any(string_to_array(%agency_id%,',')))
order by j.inserted_ts desc, j.fix_dt desc
]]
	    , "//wishes/get/"
	    , {
		user_id = sestb.erpid == nil and stor.NULL or sestb.erpid,
		distr_id = sestb.distributor == null and stor.NULL or sestb.distributor,
		agency_id = sestb.agency == null and stor.NULL or sestb.agency,
		registered = (permtb.data or {}).registered == true and 1 or 0,
		validated = (permtb.data or {}).validated == true and 1 or 0,
		rejected = (permtb.data or {}).rejected == true and 1 or 0,
		closed = (permtb.data or {}).closed == true and 1 or 0
	    }
	)
	if err == nil or err == false then
	    tb.users, err = func_execute(tran,
[[
select user_id, descr, dev_login, area, hidden from users
    order by descr
]]
		, "//wishes/users/"
	    )
	end
	if (permtb.columns or {}).channel == true and (err == nil or err == false) then
	    tb.channels, err = func_execute(tran,
[[
select chan_id, descr, hidden from channels
    order by descr
]]
		, "//wishes/channels/"
	    )
	end
	if err == nil or err == false then
	    tb.retail_chains, err = func_execute(tran,
[[
select rc_id, descr, ka_code, hidden from retail_chains
    order by descr
]]
		, "//wishes/retail_chains/"
	    )
	end
	return tb, err
    end
    )
end

local function accept(stor, uid, account_id, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_wish(%req_uid%, 'validate', %account_id%, %user_id%)
]]
        , "//wishes/validate/"
        , {req_uid = uid, account_id = account_id, user_id = user_id})
    end
    )
end

local function reject(stor, uid, account_id, user_id)
    return stor.put(function(tran, func_execute) return func_execute(tran,
[[
select console.req_wish(%req_uid%, 'reject', %account_id%, %user_id%)
]]
        , "//wishes/reject/"
        , {req_uid = uid, account_id = account_id, user_id = user_id})
    end
    )
end

local function personalize(data)
    local p = {}
    local x = {u = {}, chan = {}, rc = {}, e = {}}

    for i, v in ipairs(data.rows) do
	v.row_no = i

	x.u[v.user_id] = 1
	if v.chan_id ~= nil then x.chan[v.chan_id] = 1; end
	if v.rc_id ~= nil then x.rc[v.rc_id] = 1; end
	if v.head_id ~= nil then x.e[v.head_id] = 1; end
    end

    p.rows = data.rows
    p.users = core.reduce(data.users, 'user_id', x.u)
    p.heads = core.reduce(data.users, 'user_id', x.e)
    p.channels = core.reduce(data.channels, 'chan_id', x.chan)
    p.retail_chains = core.reduce(data.retail_chains, 'rc_id', x.rc)

    return p
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.channels.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.retailchains.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.users.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/wishes.js"> </script>')
    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    return  "startup(_('pluginCore')," .. json.encode(permtb) .. ");"
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err
    if method == "GET" then
	tb, err = data(permtb, stor, sestb)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil or tb.rows == nil or #tb.rows == 0 then
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, "{}")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
	    scgi.writeBody(res, json.encode(personalize(tb)))
	end
    elseif method == "PUT" then
	-- validate input data
	assert(permtb.validate ~= nil and permtb.validate == true, string.format("function %s() operation does not permitted.", debug.getinfo(1,"n").name))
	assert(validate.isuid(params.account_id), string.format("function %s() invalid account_id.", debug.getinfo(1,"n").name))
	assert(validate.isuid(params.user_id), string.format("function %s() invalid user_id.", debug.getinfo(1,"n").name))
	-- execute query
	accept(stor, sestb.erpid or sestb.username, params.account_id, params.user_id)
	if err then
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	else
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
	    scgi.writeBody(res, "{\"status\":\"success\"}")
	end
    elseif method == "DELETE" then
	-- validate input data
	assert(permtb.reject ~= nil and permtb.reject == true, string.format("function %s() operation does not permitted.", debug.getinfo(1,"n").name))
	assert(validate.isuid(params.account_id), string.format("function %s() invalid account_id.", debug.getinfo(1,"n").name))
	assert(validate.isuid(params.user_id), string.format("function %s() invalid user_id.", debug.getinfo(1,"n").name))
	-- execute query
	reject(stor, sestb.erpid or sestb.username, params.account_id, params.user_id)
	if err then
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
