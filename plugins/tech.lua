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
local bzlib = require 'bzlib'

local function decompress(content_blob, content_compress)
    if content_compress ~= nil and #content_compress > 0 then
	local sz_in, sz_out;
	if content_compress == "gz" then
	    content_blob, _, sz_in, sz_out = zlib.inflate():finish(content_blob)
	    --print("IN="..sz_in..", OUT="..sz_out)
	elseif content_compress == "bz2" then
	    content_blob, _, sz_in, sz_out = bzlib.decompress():finish(content_blob)
	else
	    assert(false, "content_compress="..content_compress.." does not supported.")
	end
    end
    return content_blob
end

local function compress(content_blob)
    return zlib.deflate(9):finish(content_blob)
end

local function calendar(stor)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select distinct b_date as fix_date from content_stream where content_ts is not null and content_code='tech'
    order by b_date
]]
        , "//tech/calendar"
        )
    end
    )
end

local function uname(stor, user_id, date)
    local tb, err = stor.get(function(tran, func_execute) return func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('tech', '', %fix_date%, %fix_date%)
]]
        , "//tech/content"
	, {fix_date=date}
        )
    end
    )
    if (err == nil or err == false) and tb ~= nil and #tb == 1 then
	tb = json.decode(decompress(tb[1].content_blob, tb[1].content_compress))
	if tb ~= nil and tb.rows ~= nil then
	    for i, v in ipairs(tb.rows) do
		if v.user_id == user_id then
		    return v.u_name
		end
	    end
	end
    end
    return nil
end

local function dataL0(stor, permtb, sestb, date)
    return stor.get(function(tran, func_execute)
	local tb, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get('tech', '', %fix_date%, %fix_date%)
]]
	    , "//tech/content"
	    , {fix_date=date}
	)
	if (err == nil or err == false) and tb ~= nil and #tb == 1 then
	    tb = tb[1]
	    if sestb.erpid ~= nil then
		tb.my_staff, err = func_execute(tran,
[[
select my_staff user_id from my_staff(%user_id%, 1::bool_t)
]]
		    , "//tech/F.my_staff"
		    , {user_id = sestb.erpid}
		)
		tb.indirect_staff, err = func_execute(tran,
[[
select distinct user_id from (
    select user_id, account_id from j_user_activities where fix_date=%fix_date%
	union
    select user_id, account_id from my_routes where p_date=%fix_date%
) x where account_id in (
    select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
	union
    select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
	union
    select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
	union
    select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
) and user_id not in (select my_staff(%user_id%, 1::bool_t))
]]
		    , "//tech/F.indirect_staff"
		    , {user_id = sestb.erpid, fix_date = date}
		)
	    elseif sestb.department ~= nil or sestb.country ~= nil then
		tb.my_staff, err = func_execute(tran,
[[
select user_id from users
    where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
order by descr, user_id
]]
		    , "//tech/F.my_staff"
		    , {
			dep_id = sestb.department == nil and stor.NULL or sestb.department,
			country_id = sestb.country == nil and stor.NULL or sestb.country
		    }
		)
	    elseif sestb.distributor ~= nil then
		tb.my_staff, err = func_execute(tran,
[[
select user_id from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t
order by descr, user_id
]]
		    , "//tech/F.my_staff"
		    , {distr_id = sestb.distributor}
		)
	    elseif sestb.agency ~= nil then
		tb.my_staff, err = func_execute(tran,
[[
select user_id from users
    where agency_id=any(string_to_array(%agency_id%,','))
order by descr, user_id
]]
		    , "//tech/F.my_staff"
		    , {agency_id = sestb.agency}
		)
	    else
		tb._everyone = true
	    end
	end
	if err then
	    tb = nil
	end
	return tb, err
    end
    )
end

local function dataL1(stor, permtb, sestb, code, user_id, date)
    return stor.get(function(tran, func_execute)
	local tb, err, xx
	tb, err = func_execute(tran,
[[
select content_ts, content_type, content_compress, content_blob from content_get(%content_code%, %user_id%, %fix_date%, %fix_date%)
]]
	    , "//tech/content"
	    , {content_code=code, user_id=user_id, fix_date=date}
	)
	if (err == nil or err == false) and tb ~= nil and #tb == 1 then
	    tb = tb[1]
	    if sestb.erpid ~= nil and sestb.erpid == user_id then
		tb._everything = true
	    elseif sestb.erpid ~= nil then
		xx, err = func_execute(tran,
[[
select count(*) exist from my_staff(%user_id%, 1::bool_t)
    where my_staff = %code%
]]
		    , "//tech/exist.my_staff"
		    , {user_id = sestb.erpid, code = user_id}
		)
		if (err == nil or err == false) and xx ~= nil and #xx == 1 and xx[1].exist > 0 then
		    tb._everything = true
		elseif (err == nil or err == false) and code == 'a_list' then
		    xx, err = func_execute(tran,
[[
select count(*) exist from j_user_activities where fix_date=%fix_date% and user_id = %code% and account_id in (
    select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
	union
    select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
	union
    select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
	union
    select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
)
]]
			, "//tech/exist.indirect_staff"
			, {user_id = sestb.erpid, fix_date=date, code = user_id}
		    )
		    if (err == nil or err == false) and xx ~= nil and #xx == 1 and xx[1].exist then
			tb._everything = true
		    end
		elseif (err == nil or err == false) then
		    tb.my_habitat, err = func_execute(tran,
[[
select account_id from my_accounts where user_id in (select my_staff(%user_id%, 1::bool_t))
    union
select account_id from my_retail_chains r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.rc_id=a.rc_id and (r.region_id='' or r.region_id=a.region_id)
    union
select account_id from my_regions r, accounts a where r.user_id in (select my_staff(%user_id%, 1::bool_t)) and r.region_id=a.region_id and (r.chan_id='' or r.chan_id=a.chan_id)
    union
select account_id from (select expand_cities(city_id) city_id, chan_id from my_cities where user_id in (select my_staff(%user_id%, 1::bool_t))) c, accounts a where c.city_id=a.city_id and (c.chan_id='' or c.chan_id=a.chan_id)
]]
			, "//tech/F.my_habitat"
			, {user_id = sestb.erpid}
		    )
		end
	    elseif sestb.department ~= nil or sestb.country ~= nil then
		xx, err = func_execute(tran,
[[
select count(*) exist from users
    where (%dep_id% is null or dep_ids is null or dep_ids && string_to_array(%dep_id%,',')::uids_t)
	and (%country_id% is null or (country_id=any(string_to_array(%country_id%,',')::uids_t)))
]]
		    , "//tech/exist.my_staff"
		    , {
			dep_id = sestb.department == nil and stor.NULL or sestb.department,
			country_id = sestb.country == nil and stor.NULL or sestb.country, 
			code = user_id
		    }
		)
		if (err == nil or err == false) and xx ~= nil and #xx == 1 and xx[1].exist > 0 then
		    tb._everything = true
		end
	    elseif sestb.distributor ~= nil then
		xx, err = func_execute(tran,
[[
select count(*) exist from users
    where distr_ids && string_to_array(%distr_id%,',')::uids_t and user_id = %code%
]]
		    , "//tech/exist.my_staff"
		    , {distr_id = sestb.distributor, code = user_id}
		)
		if (err == nil or err == false) and xx ~= nil and #xx == 1 and xx[1].exist > 0 then
		    tb._everything = true
		end
	    elseif sestb.agency ~= nil then
		xx, err = func_execute(tran,
[[
select count(*) exist from users
    where agency_id=any(string_to_array(%agency_id%,',')) and user_id = %code%
]]
		    , "//tech/exist.my_staff"
		    , {agency_id = sestb.agency, code = user_id}
		)
		if (err == nil or err == false) and xx ~= nil and #xx == 1 and xx[1].exist > 0 then
		    tb._everything = true
		end
	    else
		tb._everything = true
	    end

	    if (err == nil or err == false) and permtb ~= nil and permtb.zstatus and code == 'tech_route' then
		tb.zstatus, err = func_execute(tran,
[[
select guid, zstatus, znote from j_user_activities where user_id = %user_id% and fix_date = %fix_date%
]]
		    , "//tech/zstatus"
		    , {user_id=user_id, fix_date=date}
		)
	    end
	end
	if err then
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
	, "//tech/photo"
	, { blob_id = blob_id })
    end
    )
end

local function thumb(stor, blob_id)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select thumb_get(%blob_id%::blob_t) photo
]]
	, "//tech/thumb"
	, {blob_id = blob_id})
    end
    )
end

local function target(stor, uid, params)
    params.req_uid = uid
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select console.req_target(%req_uid%, %_datetime%, (%doc_id%, %sub%, %msg%, %strict%::bool_t, %urgent%::bool_t)::console.target_at_t) target_id
]]
	, "//tech/new_target"
	, params)
    end, false
    )
end

local function zstatus(stor, uid, reqdt, cmd, guid, note)
    return stor.get(function(tran, func_execute) return func_execute(tran,
[[
select console.req_zstatus(%req_uid%, %req_dt%, %cmd%, %guid%, %msg%) zrows
]]
	, "//tech/zstatus"
	, {req_uid = uid, req_dt = reqdt, cmd = cmd, guid = guid, msg = note or stor.NULL})
    end, false
    )
end

local function recompile_calendar(tb)
    local ar = {}
    for i, v in ipairs(tb) do
	table.insert(ar, v.fix_date)
    end
    return ar
end

local function personalizeL0(tb, my_staff, indirect_staff) --: tech
    local ar = {}
    if my_staff ~= nil and #my_staff > 0 then
	local idx = {}
	for i, v in ipairs(tb.rows) do
	    idx[v.user_id] = v
	end
	for i, v in ipairs(my_staff) do
	    local ptr = idx[v.user_id]
	    if ptr ~= nil then
		table.insert(ar, ptr); ptr.row_no = #ar
	    end
	end
    end
    if indirect_staff ~= nil and #indirect_staff > 0 then
	local idx = {}
	for i, v in ipairs(indirect_staff) do
	    idx[v.user_id] = true
	end
	for i, v in ipairs(tb.rows) do
	    if idx[v.user_id] == true then
		table.insert(ar, v); v.row_no = #ar; v.indirect = true
	    end
	end
    end
    tb.rows = ar
    return tb
end

local function personalizeL1(tb, my_habitat)  --: tech_*
    local ar = {}
    if my_habitat ~= nil and #my_habitat > 0 then
	local idx = {}
	for i, v in ipairs(my_habitat) do
	    idx[v.account_id] = true
	end
	for i, v in ipairs(tb.rows) do
	    if idx[v.account_id] == true then
		table.insert(ar, v); v.row_no = #ar
	    end
	end
    end
    tb.rows = ar
    tb._cropped = true
    return tb
end

local function personalizeL2(tb, my_habitat) --: tech_route
    local idx = {}
    local cropRows = function(rows, exist)
	if rows ~= nil then
	    local ar = {}
	    for i, v in ipairs(rows) do
		if exist[v.account_id] == true then
		    table.insert(ar, v); v.row_no = #ar
		end
	    end
	    return ar
	else
	    return nil
	end
    end
    local cropMap = function(rows, exist)
	if rows ~= nil then
	    local ar = {}
	    for k, v in pairs(rows) do
		if exist[k] == true then
		    ar[k] = v
		end
	    end
	    return ar
	else
	    return nil
	end
    end
    if my_habitat ~= nil and #my_habitat > 0 then
	for i, v in ipairs(my_habitat) do
	    idx[v.account_id] = true
	end
    end
    for k, v in pairs(tb) do
	if type(v) == 'table' then
	    if core.contains({'packets','rules','power','traffics','exchanges','dev_ids','map','trace','wd','rd','departments','distributors','violations'}, k) then
		--[[ doesn't crop system data ]]
	    elseif core.contains({'additions','unsched','reviews','joints'}, k) then
		tb[k] = nil
	    elseif #v > 0 then -- array
		tb[k] = cropRows(v, idx, 'account_id')
	    else -- hashmap
		tb[k] = cropMap(v, idx)
	    end
	end
    end
    tb._cropped = true
    return tb
end

local function personalizeL3(tb, zstatus)  --: tech_route
    local idx = {}
    if tb.route ~= nil and #tb.route > 0 then
	for i, v in ipairs(zstatus) do
	    idx[v.guid] = v
	end
	for i, v in ipairs(tb.route) do
	    local k = idx[v.guid]
	    v.zstatus = k and k.zstatus
	    v.znote = k and k.znote
	end
    end
    return tb
end


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    local ar = {}
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/popup_L.dailycal.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/slideshow.simple.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_route.js"> </script>')
    if permtb.mapEngine == 'Google.Maps' then
	if permtb.mapKey then
	    table.insert(ar, '<script src="https://maps.googleapis.com/maps/api/js?v=3&key=' .. permtb.mapKey .. '&libraries=places" type="text/javascript"> </script>')
	else
	    table.insert(ar, '<script src="https://maps.googleapis.com/maps/api/js?v=3" type="text/javascript"> </script>')
	end
	table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_gmap.js"> </script>')
    elseif permtb.mapEngine == 'Yandex.Maps' then
	if permtb.mapKey then
	    table.insert(ar, '<script src="https://api-maps.yandex.ru/2.1/?lang=ru-RU&apikey=' .. permtb.mapKey .. '" type="text/javascript"> </script>')
	else
	    table.insert(ar, '<script src="https://api-maps.yandex.ru/2.1/?lang=ru-RU" type="text/javascript"> </script>')
	end
	table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_ymap.js"> </script>')
    end
    if permtb.tabs ~= nil and permtb.tabs.a_list == true then 
	table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/a_list.js"> </script>')
    end
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_advt.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_audits.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_checkups.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_comments.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_confirmations.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_oos.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_orders.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_photos.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_posms.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_presences.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_presentations.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_prices.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_promos.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_quests.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_ratings.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_reclamations.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_shelfs.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_stocks.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_targets.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/plugins/tech_trainings.js"> </script>')

    return table.concat(ar,"\n")
end

function M.startup(lang, permtb, sestb, params, stor)
    local ar = {}
    table.insert(ar, string.format("__routeWeeks = %d;",permtb.weeks or 4))
    if permtb.target == true then
	table.insert(ar, "__allowTargetCreation = true;")
    end
    if permtb.urgent == true then
	table.insert(ar, "__allowUrgentActivities = true;")
    end
    if permtb.zstatus == true then
	table.insert(ar, "__allowZstatusChanging = true;")
    end
    if permtb.columns ~= nil then
	table.insert(ar, string.format("__allowedColumns = %s;", json.encode(permtb.columns)))
    end
    if params.user_id ~= nil and params.date ~= nil then
	local u_name = uname(stor, params.user_id, params.date)
	assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	assert(validate.isdate(params.date), "invalid [date] parameter.")
	assert(u_name ~= nil, 'incorrect [u_name] parameter.')
	table.insert(ar, string.format("startup(\"%s\",\"%s\",\"%s\");", params.user_id, u_name:gsub('"',"'"), params.date))
    elseif params.date ~= nil then
	table.insert(ar, string.format("startup(null,null,'%s');", params.date))
    else
	assert(params.user_id == nil and params.date == nil)
	table.insert(ar, "startup(null,null,new Date());")
    end

    return table.concat(ar,"\n")
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    local tb, err, x
    if method == "GET" then
	if params.calendar ~= nil then
	    tb, err = calendar(stor)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "[]")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, json.encode(recompile_calendar(tb)))
	    end
	elseif params.blob ~= nil then
	    assert(validate.isuid(params.blob_id), "invalid [blob_id] parameter.")
	    tb, err = params.thumb == nil and photo(stor, params.blob_id) or thumb(stor, params.blob_id)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil or #tb ~= 1 then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb[1].photo)
	    end
	elseif params.code == "tech" then
	    assert(validate.isuid(params.code), "invalid [code] parameter.")
	    assert(validate.isdate(params.date), "invalid [date] parameter.")
	    tb, err = dataL0(stor, permtb, sestb, params.date)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    elseif tb._everyone then
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(decompress(tb.content_blob, tb.content_compress)))
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(personalizeL0(json.decode(decompress(tb.content_blob, tb.content_compress)), tb.my_staff, tb.indirect_staff))))
	    end
	else
	    assert(validate.isuid(params.code), "invalid [code] parameter.")
	    assert(validate.isuid(params.user_id), "invalid [user_id] parameter.")
	    assert(validate.isdate(params.date), "invalid [date] parameter.")
	    local tb, err = dataL1(stor, permtb, sestb, params.code, params.user_id, params.date)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{}")
	    elseif permtb.zstatus and params.code == 'tech_route' and tb.zstatus ~= nil and #tb.zstatus > 0 and tb._everything then
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(personalizeL3(json.decode(decompress(tb.content_blob, tb.content_compress)), tb.zstatus))))
	    elseif tb._everything then
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(decompress(tb.content_blob, tb.content_compress)))
	    elseif params.code == 'tech_route' then
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(personalizeL2(json.decode(decompress(tb.content_blob, tb.content_compress)), tb.my_habitat))))
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = tb.content_type .. "; charset=utf-8", ["Content-Encoding"] = "deflate"})
		scgi.writeBody(res, compress(json.encode(personalizeL1(json.decode(decompress(tb.content_blob, tb.content_compress)), tb.my_habitat))))
	    end
	end
    elseif method == "POST" then
	if permtb.target == true then
	    local p, tb, err
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    assert(validate.isdatetime(p._datetime), "invalid [_datetime] parameter.")
	    assert(p.sub ~= nil and #p.sub, "invalid [subject] parameter.")
	    assert(p.msg ~= nil and #p.msg, "invalid [body] parameter.")
	    assert(validate.isuid(p.doc_id), "invalid [doc_id] parameter.")
	    p.strict = p.strict == 'true' and 1 or 0
	    p.urgent = (p.urgent == 'true' and permtb.urgent == true) and 1 or 0
	    tb, err = target(stor, sestb.erpid or sestb.username, p)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].target_id == nil then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"success\"}")
	    end
        else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Operation does not permitted.")
	end
    elseif method == "PUT" then
	if permtb.zstatus == true then
	    local p, tb, err
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    assert(validate.isdatetime(p._datetime), "invalid [_datetime] parameter.")
	    assert(validate.isuid(p.guid), "invalid [guid] parameter.")
	    tb, err = zstatus(stor, sestb.erpid or sestb.username, p._datetime, 'accept', p.guid, p.note)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].zrows == nil or tb[1].zrows == 0 then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"success\"}")
	    end
        else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Operation does not permitted.")
	end
    elseif method == "DELETE" then
	if permtb.zstatus == true then
	    local p, tb, err
	    if type(content) == "string" then p = uri.parseQuery(content) end
	    assert(validate.isdatetime(p._datetime), "invalid [_datetime] parameter.")
	    assert(validate.isuid(p.guid), "invalid [guid] parameter.")
	    assert(p.note ~= nil and #p.note, "invalid [note] parameter.")
	    tb, err = zstatus(stor, sestb.erpid or sestb.username, p._datetime, 'reject', p.guid, p.note)
	    if err then
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		scgi.writeBody(res, "{\"status\":\"failed\",\"msg\":\"Internal server error\"}")
	    elseif tb == nil or #tb ~= 1 or tb[1].zrows == nil or tb[1].zrows == 0 then
		scgi.writeHeader(res, 409, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Invalid input parameters")
	    else
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.json})
		scgi.writeBody(res, "{\"status\":\"success\"}")
	    end
        else
	    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Bad request. Operation does not permitted.")
	end
    else
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request. Mehtod " .. method .. " does not supported.")
    end
end
-- *** plugin interface: end

return M
