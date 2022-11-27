-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local config = require 'config'
local V = require 'version'
local scgi = require 'scgi'
local mime = require 'mime'
local uri = require 'url'
local log = require 'log'
local json = require 'json'
local core = require 'core'

local auth = require 'auth'
local stor = require 'stor'

local roles = require 'roles'
local objects = require 'objects'
local plugins = require 'plugins'
local dumps = require 'dumps'
local services = require 'services'


local function REF(arg)
    return '/' .. V.package_code .. arg
end

local function SAFE(arg)
    return arg or '-'
end

local function userparams(stor, user_id)
    return stor.get(function(tran, func_execute) 
	local tb = {}
	if user_id ~= nil then
	    tb, _ = func_execute(tran, 
[[
select user_id, descr from users where user_id=%user_id%
]]
		, "/main/u_params"
		, {user_id = user_id}
	    )
	    tb = (tb ~= nil and #tb > 0) and tb[1] or {}
	end

	tb.support, _ = func_execute(tran,
[[
select 
    case 
	when sup.country_id is null or sup.country_id='' then sup.descr 
	else format('%s (%s)', sup.descr, coalesce(c.descr,sup.country_id)) 
    end descr,
    sup.phone, 
    sup.email 
from support sup
    left join countries c on c.country_id=sup.country_id
where sup.hidden = 0 and (
	sup.country_id is null or sup.country_id='' or 
	    sup.country_id in (select country_id from users where user_id=%user_id%)
    )
order by sup.row_no limit 10
]]
	    , "/main/support"
	    , { user_id = user_id ~= nil and user_id or '' }
	)

	local sysparams, _ = func_execute(tran,
[[
select param_id, ("monthDate_First"(current_date - "paramInteger"('dumps:depth')))::date_t param_value from sysparams 
    where param_id='dumps:depth' and param_value is not null
]]
	    , "/main/sysparams"
	)
	if sysparams ~= nil then
	    for i, v in ipairs(sysparams) do
		if v.param_id == 'dumps:depth' and v.param_value ~= nil then
		    tb.dumps_depth = v.param_value
		end
	    end
	end

	return tb;
    end)
end

local function username(sestb, usertb)
    if usertb ~= nil and usertb.descr ~= nil then return usertb.descr end
    return sestb.cn ~= nil and sestb.cn or sestb.username
end

local function userdata(sestb, usertb, modstb, dumpstb)
    local tb = {}
    tb.cn = username(sestb, usertb)
    tb.ip = sestb.ip
    tb.username = sestb.username
    tb.group = sestb.group
    tb.permissions = modstb ~= nil and modstb or {}
    tb.supports = (usertb ~= nil and usertb.support ~= nil) and usertb.support or {}
    tb.dumps = { rows = dumpstb, depth = usertb ~= nil and usertb.dumps_depth or nil }
    return json.encode(tb)
end

local function selectableobjects(stor, perm)
    return stor.get(function(tran, func_execute) 
	local rv, idx1, idx2, tb = {}, {}, {}, func_execute(tran,
[[
select distinct right(content_code,length(content_code)-5) content_code from content_stream 
    where content_code like 'stat_%' and content_blob is not null
	union
select distinct content_code from content_stream 
    where content_code not like 'stat_%' and content_code not like 'tech_%' and content_code <> 'a_list' and content_blob is not null
]]
	    , "/main/objects"
	)
	for k in pairs(perm) do
	    idx1[k] = true
	end
	if tb ~= nil then
	    for i, v in ipairs(tb) do
		idx2[v.content_code] = true
	    end
	end
	for k in pairs(objects) do
	    local f = core.contains({'monthly_reports','analitics'}, k)
	    local ref = {}
	    for i2, v2 in ipairs(objects[k]) do
		if idx1[v2] == true and (f == false or idx2[v2] == true) then
		    table.insert(ref, v2)
		end
	    end
	    if #ref > 0 then
		rv[k] = ref
	    end
	end
	return rv;
    end)
end

local function startup_script(lang, sestb, usertb, modstb, dumpstb, res, plug_data)
    local ar = {}
    table.insert(ar, "const __AUTHOR__='" .. V.package_name .. '/' .. V.package_version .. "';")
    table.insert(ar, "const __SID__='" .. sestb.sid .. "';")
    table.insert(ar, "const __STATIC_REF_PREFIX__='" .. V.static_prefix .. "';")
    table.insert(ar, "const __USERNAME__='" .. ((usertb ~= nil and usertb.descr ~= nil) and usertb.descr or sestb.username) .. "';")
    table.insert(ar, "window.onload = function() {")
    if not config.session.strict then
	table.insert(ar, "setInterval(function() { G.xhr('GET','keep-alive?sid=" .. sestb.sid .. 
	    "','',function(xhr) {}).send(); }, " .. sestb.lifetime*1000/4 .. ");")
    end
    table.insert(ar, "Dashboard.startup(" .. userdata(sestb, usertb, modstb, dumpstb) .. ");")
    if plug_data ~= nil then
	table.insert(ar, plug_data)
    end
    table.insert(ar, "}")
    scgi.writeHeader(res, 200, {["Content-Type"] = mime.js .. "; charset=utf-8"})
    scgi.writeBody(res, table.concat(ar,"\n"));
end

local function default_page(lang, sestb, params, res, plug_data)
    local ar = {}
    table.insert(ar, '<!DOCTYPE html>')
    table.insert(ar, '<html>')
    table.insert(ar, '<head>')
    table.insert(ar, '<meta http-equiv="content-type" content="text/html; charset=utf-8" />')
    table.insert(ar, '<meta name="author" content="' .. V.package_name .. '/' .. V.package_version .. '" />')
    table.insert(ar, '<title>' .. config.title .. '</title>')
    table.insert(ar, '<link rel="stylesheet" href="' .. V.static_prefix .. '/core.css" />')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/lang/' .. lang .. '.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/G.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/array.extra.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/cache.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/dashboard.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/date.extra.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/dialog.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/element.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/filter.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/filesaver.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/json.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/number.extra.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/progress.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/string.extra.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/toast.js"> </script>')
    if plug_data ~= nil then
	table.insert(ar, plug_data)
    end
    table.insert(ar, '<script src="' .. REF('/startup') .. '?' .. uri.buildQuery(params) .. '"> </script>')
    table.insert(ar, '</head>')
    table.insert(ar, '<body>')
    table.insert(ar, '<table class="topbar" width="100%">')
    table.insert(ar, '<tr>')
    if config.logo.main ~= nil and #config.logo.main > 0 then
	table.insert(ar, config.logo.main)
    end
    table.insert(ar, '<td>')
    table.insert(ar, '<span class="logoTitle" onclick="document.location=G.getdefref();">' .. config.title .. 
	'&nbsp;</span><span class="logoSubTitle">' .. config.subtitle .. '</span>')
    table.insert(ar, '</td>')
    table.insert(ar, '<td align="right">')
    table.insert(ar, '<div style="text-align: right; white-space: nowrap;">')
    table.insert(ar, '<span id="userRef">&nbsp;</span>')
    table.insert(ar, '&nbsp;|&nbsp;')
    table.insert(ar, '<a id="pluginsRef" href="javascript:void(0);">&nbsp;</a>')
    table.insert(ar, '&nbsp;|&nbsp;')
    table.insert(ar, '<a id="dumpsRef" href="javascript:void(0);">&nbsp;-&nbsp;</a>')
    table.insert(ar, '&nbsp;|&nbsp;')
    table.insert(ar, '<a id="supportRef" href="javascript:void(0);">&nbsp;-&nbsp;</a>')
    table.insert(ar, '&nbsp;|&nbsp;')
    table.insert(ar, '<a id="logoutRef" href="javascript:void(0);" class="a_critical">&nbsp;-&nbsp;</a>')
    table.insert(ar, '</div>')
    table.insert(ar, '</td>')
    table.insert(ar, '</tr></table>')
    table.insert(ar, '<hr />')
    table.insert(ar, '<div id="pluginContainer"> </div>')
    table.insert(ar, '<div id="supportContainer" class="ballon"><div class="arrow"></div><div class="body"></div></div>')
    table.insert(ar, '<div id="pluginsContainer" class="ballon"><div class="arrow"></div><div class="body"></div></div>')
    table.insert(ar, '<div id="dumpsContainer" class="ballon"><div class="arrow"></div><div class="body"></div></div>')
    table.insert(ar, '<div id="toastContainer" class="toast"></div>')
    table.insert(ar, '<div id="progressContainer" class="progress"><div class="spinner"></div></div>')
    table.insert(ar, '</body>')
    table.insert(ar, '</html>')
    scgi.writeHeader(res, 200, {["Content-Type"] = mime.html .. "; charset=utf-8"})
    scgi.writeBody(res, table.concat(ar,"\n"));
end

function login_page(lang, params, ip, agent, res)
    local ar = {}
    table.insert(ar, '<!DOCTYPE html>')
    table.insert(ar, '<html>')
    table.insert(ar, '<head>')
    table.insert(ar, '<meta http-equiv="content-type" content="text/html; charset=utf-8" />')
    table.insert(ar, '<meta name="author" content="' .. V.package_name .. '/' .. V.package_version .. '">')
    table.insert(ar, '<meta http-equiv="Pragma" content="no-cache"/>')
    table.insert(ar, '<title>' .. config.title .. '</title>')
    table.insert(ar, '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    table.insert(ar, '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">');
    table.insert(ar, '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">');
    table.insert(ar, '<link rel="manifest" href="/site.webmanifest">');
    table.insert(ar, '<link rel="stylesheet" href="' .. V.static_prefix .. '/auth.css" />')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/lang/' .. lang .. '.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/element.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/env.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/string.extra.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/G.js"> </script>')
    table.insert(ar, '<script src="' .. V.static_prefix .. '/auth.js"> </script>')
    table.insert(ar, '</head>')
    table.insert(ar, '<body>')
    table.insert(ar, '<form method="post" action="/auth" id="authForm">')
    table.insert(ar, '<table class="auth" align="center">')
    table.insert(ar, '<tr><td colspan="2">')
    table.insert(ar, '<table width="100%"><tr>')
    table.insert(ar, '<td align="left">' .. config.logo.auth .. '</td>')
    table.insert(ar, '<td align="right"><span class="logotitle">' .. config.title .. '&nbsp;</span><span class="logosubtitle">' .. config.subtitle .. '</span></td>')
    table.insert(ar, '</tr></table>')
    table.insert(ar, '</td></tr>')
    table.insert(ar, '<tr><td colspan="2"><hr /></td></tr>')
    table.insert(ar, '<tr><td align="right" id="hint0"></td><td align="left"><input autocomplete="on" type="text" size="25" maxlength="32" id="username" name="username"/></td></tr>')
    table.insert(ar, '<tr><td align="right" id="hint1"></td><td align="left"><input autocomplete="off" type="password" maxlength="32" id="password" name="password"/></td></tr>')
    table.insert(ar, '<tr><td colspan="2"> </td></tr>')
    table.insert(ar, '<tr><td><a href="mailto:support@omobus.net">support@omobus.net</a></td><td align="right"><input id="authButton" type="submit" value=""/></td></tr>')
    table.insert(ar, '<tr><td colspan="2"></td></tr>')
    table.insert(ar, '<tr class="alert"><td align="left" colspan="2"><div id="msg" X-msgcode="' .. (params.msgcode ~= nil and params.msgcode or "") .. '"> </div></td></tr>')
    table.insert(ar, '<tr><td colspan="2"><hr /></td></tr>')
    table.insert(ar, '<tr><td colspan="2"><span id="apks"></span></td></tr>')
    table.insert(ar, '</table>')
    table.insert(ar, '</form>')
    table.insert(ar, '</body>')
    table.insert(ar, '</html>')
    scgi.writeHeader(res, 200, {
	["Content-Type"] = mime.html .. "; charset=utf-8", 
	["Content-Security-Policy"] = "default-src 'self'",
	["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    })
    scgi.writeBody(res, table.concat(ar,"\n"));
    log.i(string.format("[audit] IP:%s => requested the login form using %s", ip, agent))
end

local function get_lang(lang)
    -- supported languages
    local codes = { "ru" }
    -- check needed language is supported
    if codes[lang] ~= null then return codes[lang] end
    return codes[1]
end

function websvc_main()
    -- initialize glogal objects
    log.init(config.debug)

    return {
	request_handler = function(env, content_size, content, res) -- request handler
	    assert(env.QUERY_STRING ~= nil, "invalid request. QUERY_STRING is unavailable.")
	    assert(env.REQUEST_METHOD ~= nil, "invalid request. REQUEST_METHOD is unavailable.")

	    if env.HTTP_ACCEPT_LANGUAGE == nil then env.HTTP_ACCEPT_LANGUAGE = 'en' end

	    local ip = env.REMOTE_ADDR
	    local method = env.REQUEST_METHOD
	    local script = (env.PATH_INFO ~= nil and #env.PATH_INFO > 0) and env.PATH_INFO or env.SCRIPT_NAME
	    local params = uri.parseQuery(env.QUERY_STRING)
	    local lang = get_lang(params.lang or string.sub(env.HTTP_ACCEPT_LANGUAGE,1,2))
	    local sestb, roletb, permtb, q, sid, obsolete

	    if script == nil or #script == 0 or script == REF('/about:echo') then
		if method == 'GET' then
		    log.i(string.format("[/about:echo] GET [from: %s]", ip));
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		    scgi.writeBody(res, json.encode(env))
		else
		    log.w(string.format("[/about:echo] %s [from: %s] => method dosn't supported", method, ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
		end
	    elseif script == REF("/") or script == REF("/login") then
		if method == 'GET' then
		    log.i(string.format("[/login] GET [from: %s]", ip));
		    login_page(lang, params, ip, env.HTTP_USER_AGENT, res)
		else
		    log.w(string.format("[/login] %s [from: %s] => method dosn't supported", method, ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
		end
	    elseif script == REF("/auth") then
		stor.init()
		local pp = (method == "POST" and type(content) == "string") and uri.parseQuery(content) or params
		sid = auth.mySID(lang, pp, ip, stor)
		if sid == nil then
		    log.w(string.format("[/auth] %s [from: %s] => invalid username or password", method, ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, 'Invalid username or password')
		else
		    log.i(string.format("[/auth] %s [from: %s]", method, ip));
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("%s?sid=%s&lang=%s", REF("/default"), sid, lang))
		    log.i(string.format("[audit] IP:%s user is logged on as %s (SID:%s)", ip, pp.username, sid))
		end
		stor.cleanup()
	    elseif script == REF("/logout") then
		stor.init()
		sestb = auth.killSID(params.sid, ip, stor)
		log.i(string.format("[/logout] %s => sid:%s [from: %s]", method, SAFE(params.sid), ip));
		if sestb ~= nil then
		    scgi.writeHeader(res, 301, {["Location"] = REF("/")})
		    log.i(string.format("[audit] IP:%s user %s logs out (SID:%s).", ip, sestb.username, params.sid))
		else 
		    scgi.writeHeader(res, 302, {["Location"] = string.format("%s?msgcode=invalid&lang=%s", REF("/login"), lang)})
		    scgi.writeBody(res, "Invalid session")
		    log.w(string.format("[audit] IP:%s => invalid session (SID: %s).", ip, params.sid == nil and '-' or params.sid))
		end
		stor.cleanup()
	    elseif script == REF("/keep-alive") then
		stor.init()
		sestb, obsolete = auth.validate(params.sid, ip, stor)
		if sestb ~= nil then
		    log.i(string.format("[/keep-alive] %s => sid:%s [from: %s]", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 200, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		elseif obsolete == 1 then
		    log.w(string.format("[/keep-alive] %s => sid:%s [from: %s] => obsolete session", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Obsolete session")
		else
		    log.w(string.format("[/keep-alive] %s => sid:%s [from: %s] => invalid session", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Invalid session")
		end
		stor.cleanup()
	    elseif script == REF("/default") then
		if method == 'GET' then
		    stor.init()
		    sestb, obsolete = auth.validate(params.sid, ip, stor)
		    if sestb ~= nil then
			roletb = roles.get(sestb.group)
			if roletb ~= nil and roletb.permissions ~= nil and roletb.permissions ~= nil then
			    q = params.plug ~= nil and params.plug or roletb.home
			    if q == nil then
				log.w(string.format("[/default] %s => sid:%s, role:%s [from: %s] => bad request", 
				    method, SAFE(params.sid), SAFE(sestb.group), ip));
				scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
				scgi.writeBody(res, "Bad request")
			    else
				permtb = roletb.permissions[q]
				if permtb == nil then
				    log.w(string.format("[/default] %s => sid:%s, role:%s, plug:%s [from: %s] => not permitted", 
					method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
				    scgi.writeBody(res, "Not permitted")
				else
				    log.w(string.format("[/default] %s => sid:%s, role:%s, plug:%s [from: %s]", 
					method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				    default_page(lang, sestb, params, res, plugins.get(q).scripts(lang, permtb, sestb, params))
				end
			    end
			else
			    log.i(string.format("[/default] %s => sid:%s, role:%s [from: %s] => bad request", 
				method, SAFE(params.sid), SAFE(sestb.group), ip));
			    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			    scgi.writeBody(res, "Bad request")
			end

		    elseif obsolete == 1 then
			log.w(string.format("[/default] %s => sid:%s [from: %s] => obsolete session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 302, {["Location"] = string.format("%s?msgcode=obsolete&lang=%s", REF("/login"), lang)})
			scgi.writeBody(res, "Obsolete session")
		    else
			log.w(string.format("[/default] %s => sid:%s [from: %s] => invalid session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 302, {["Location"] = string.format("%s?msgcode=invalid&lang=%s", REF("/login"), lang)})
			scgi.writeBody(res, "Invalid session")
		    end
		    stor.cleanup()
		else
		    log.w(string.format("[/default] %s => sid:%s [from: %s] => method dosn't supported", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
		end
	    elseif script == REF("/startup") then
		if method == 'GET' then
		    stor.init()
		    sestb, obsolete = auth.validate(params.sid, ip, stor)
		    if sestb ~= nil then
			roletb = roles.get(sestb.group)
			if roletb ~= nil and roletb.permissions ~= nil and roletb.permissions ~= nil then
			    q = params.plug ~= nil and params.plug or roletb.home
			    if q == nil then
				log.w(string.format("[/startup] %s => sid:%s, role:%s [from: %s] => bad request", 
				    method, SAFE(params.sid), SAFE(sestb.group), ip));
				scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
				scgi.writeBody(res, "Bad request")
			    else
				permtb = roletb.permissions[q]
				if permtb == nil then
				    log.w(string.format("[/startup] %s => sid:%s, role:%s, plug:%s [from: %s] => not permitted", 
					method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
				    scgi.writeBody(res, "Not permitted")
				else
				    log.i(string.format("[/startup] %s => sid:%s, role:%s, plug:%s [from: %s]", 
					method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				    startup_script(lang, 
					sestb,
					userparams(stor, sestb.erpid), 
					selectableobjects(stor,roletb.permissions),
					dumps.list(config, sestb.username),
					res, 
					plugins.get(q).startup(lang, permtb, sestb, params, stor)
				    )
				end
			    end
			else
			    log.w(string.format("[/startup] %s => sid:%s, role:%s [from: %s] => bad request", 
				method, SAFE(params.sid), SAFE(sestb.group), ip));
			    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			    scgi.writeBody(res, "Bad request")
			end
		    elseif obsolete == 1 then
			log.w(string.format("[/startup] %s => sid:%s [from: %s] => obsolete session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			scgi.writeBody(res, "Obsolete session")
		    else
			log.w(string.format("[/startup] %s => sid:%s [from: %s] => invalid session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			scgi.writeBody(res, "Invalid session")
		    end
		    stor.cleanup()
		else
		    log.w(string.format("[/startup] %s => sid:%s [from: %s] => method dosn't supported", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
		end
	    elseif script == REF("/data") then
		stor.init()
		sestb, obsolete = auth.validate(params.sid, ip, stor)
		if sestb ~= nil then
		    roletb = roles.get(sestb.group)
		    if roletb == nil or roletb.permissions == nil or roletb.permissions == nil then
			log.w(string.format("[/data] %s => sid:%s, role:%s [from: %s] => bad request", 
			    method, SAFE(params.sid), SAFE(sestb.group), ip));
			scgi.writeHeader(res, 400, {["Content-Type"] = mime.json .. "; charset=utf-8"})
			scgi.writeBody(res, "{\"msg\":\"Bad request\"}")
		    else
			q = params.plug ~= nil and params.plug or roletb.home
			if q == nil then
			    log.w(string.format("[/data] %s => sid:%s, role:%s [from: %s] => bad request", 
				method, SAFE(params.sid), SAFE(sestb.group), ip));
			    scgi.writeHeader(res, 400, {["Content-Type"] = mime.json .. "; charset=utf-8"})
			    scgi.writeBody(res, "{\"msg\":\"Bad request\"}")
			else
			    permtb = roletb.permissions[q]
			    if permtb == nil then
				log.w(string.format("[/data] %s => sid:%s, role:%s, plug:%s [from: %s] => not permitted", 
				    method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				scgi.writeHeader(res, 403, {["Content-Type"] = mime.json .. "; charset=utf-8"})
				scgi.writeBody(res, "{\"msg\":\"Not permitted\"}")
			    else
				log.i(string.format("[/data] %s => sid:%s, role:%s, plug:%s [from: %s]", 
				    method, SAFE(params.sid), SAFE(sestb.group), q, ip));
				plugins.get(q).data(lang, method, permtb, sestb, params, content, env.CONTENT_TYPE, stor, res)
			    end
			end
		    end
		elseif obsolete == 1 then
		    log.w(string.format("[/data] %s => sid:%s [from: %s] => obsolete session", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 401, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		    scgi.writeBody(res, "{\"msg\":\"Obsolete session\"}")
		else
		    log.w(string.format("[/data] %s => sid:%s [from: %s] => invalid session", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 401, {["Content-Type"] = mime.json .. "; charset=utf-8"})
		    scgi.writeBody(res, "{\"msg\":\"Invalid session\"}")
		end
		stor.cleanup()
	    elseif script == REF("/dump") and params.name ~= nil then
		if method == 'GET' then
		    stor.init()
		    sestb, obsolete = auth.validate(params.sid, ip, stor)
		    if sestb ~= nil then
			local dumptb = dumps.get(config, sestb.username, params.name)
			if dumptb == nil then
			    log.w(string.format("[/data] %s => sid:%s, name:%s [from: %s] => bad request", 
				method, SAFE(params.sid), params.name, ip));
			    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			    scgi.writeBody(res, "Bad request")
			elseif dumptb.name == nil or dumptb.data == nil then
			    log.w(string.format("[/data] %s => sid:%s, name:%s [from: %s] => not found", 
				method, SAFE(params.sid), params.name, ip));
			    scgi.writeHeader(res, 404, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			    scgi.writeBody(res, "Not Found")
			else
			    log.i(string.format("[/data] %s => sid:%s, name:%s [from: %s]", 
				method, SAFE(params.sid), params.name, ip));
			    scgi.writeHeader(res, 200, {
				["Content-Type"] = mime.zip,
				["Content-Disposition"] = "inline; filename=\"" .. dumptb.name .. "\""
			    })
			    scgi.writeBody(res, dumptb.data)
			end
		    elseif obsolete == 1 then
			log.w(string.format("[/dump] %s => sid:%s [from: %s] => obsolete session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			scgi.writeBody(res, "Obsolete session")
		    else
			log.w(string.format("[/dump] %s => sid:%s [from: %s] => invalid session", method, SAFE(params.sid), ip));
			scgi.writeHeader(res, 401, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
			scgi.writeBody(res, "Invalid session")
		    end
		    stor.cleanup()
		else
		    log.w(string.format("[/dump] %s => sid:%s [from: %s] => method dosn't supported", method, SAFE(params.sid), ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
		end
	    else -- public services
		local svc = services.get(string.match(script, '/' .. V.package_code .. '/(%w+)'))
		if svc ~= nil then
		    svc.main(lang, ip, method, params, content, env.CONTENT_TYPE, res)
		else 
		    log.w(string.format("request: %s, method: %s, from: %s => ignored", script, method, ip));
		    scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		    scgi.writeBody(res, "Bad request")
		end
	    end

	    return 0
	end, 
	gc = function() -- GC
	    stor.init()
	    auth.gc(stor)
	    stor.cleanup()
	end
    }
end
