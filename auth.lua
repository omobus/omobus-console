-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local config = require 'config'
local V = require 'version'
local scgi = require 'scgi'
local mime = require 'mime'
local log = require 'log'
local ldap = require 'bind_ldap'


function bin2hex(str)
    local len = string.len(str)
    local hex = ""
    for i = 1, len do hex = hex .. string.format("%02x", string.byte(str, i)) end
    return hex
end

local function crc64(buf)
    local x = hash.crc64()
    x:calc(buf)
    return x:get()
end

local function crypto_hash_sha1(string)
    local ctx = hash.sha1()
    if string ~= nil and #string > 0 then
	ctx:update(string)
    end
    return base64.encode(ctx:final(true))
end

local function crypto_hash_md5(string)
    local ctx = hash.md5()
    if string ~= nil and #string > 0 then
	ctx:update(string)
    end
    return base64.encode(ctx:final(true))
end

local function crypto_hash_ssha1(string, stored)
    local decoded, digest_len, salt, ctx

    digest_len = hash.sha1_digest_size()
    decoded = base64.decode(stored)
    --log_msg(bin2hex(decoded))
    assert(decoded ~= nil, "huge salt (ssha)")
    assert(#decoded >= digest_len, "corrupted hash result (ssha)")
    salt = decoded:sub(digest_len + 1)
    ctx = hash.sha1()
    if string ~= nil and #string > 0 then
	ctx:update(string)
    end
    if #salt > 0 then
	ctx:update(salt)
    end

    return base64.encode(ctx:final(true) .. salt)
end

local function crypto_hash_smd5(string, stored)
    local decoded, digest_len, salt, ctx

    digest_len = hash.md5_digest_size()
    decoded = base64.decode(stored)
    --log_msg(bin2hex(decoded))
    assert(decoded ~= nil, "huge salt (smd5)")
    assert(#decoded >= digest_len, "corrupted hash result (smd5)")
    salt = decoded:sub(digest_len + 1)
    ctx = hash.md5()
    if string ~= nil and #string > 0 then
	ctx:update(string)
    end
    if #salt > 0 then
	ctx:update(salt)
    end

    return base64.encode(ctx:final(true) .. salt)
end

local function sescreate(stor, username, ip, attrs, lang)
    local tb, x

    tb = {}
    tb.server = string.format("%s/%s", V.package_name, V.package_version)
    tb.username = username
    tb.lifetime = config.session.lifetime*60;
    tb.at = os.date("%Y-%m-%dT%X%z", os.time())
    tb.ip = ip;
    tb.sid = crc64(string.format("%s from %s at %s", username, ip, tb.at));
    tb.lang = lang
    tb.cn = attrs.cn
    tb.erpid = attrs.ErpId
    tb.group = attrs.groupName
    tb.department = attrs.department
    tb.country = attrs.country
    tb.distributor = attrs.distributor
    tb.agency = attrs.agency

    x = stor.get(function(tran, func_execute) 
	    return func_execute(tran, "select console.ses_create(%params%) sid", 
		"//auth/sescreate", {params=json.encode(tb)})
    end, false)

    return (x ~= nil and #x == 1) and tb.sid or nil
end

local function sesdecode(tb, sid, ip)
    local obsolete
    if tb ~= nil and #tb == 1 and tb[1].params ~= nil then
	obsolete = tb[1].obsolete
	tb = json.decode(tb[1].params)
	if tb ~= nil and tb.username ~= nil and tb.ip ~= nil and tb.sid == sid then
	    if tb.ip ~= ip then
		log.e(string.format("IP=%s, SID=%s, username=%s: session is bound to a different IP=%s",
		    ip, sid, tb.username, tb.ip))
		tb = nil
	    end
	else
	    log.e(string.format("IP=%s, SID=%s: invalid session.", ip, sid))
	    tb = nil
	end
    else
	log.e(string.format("IP=%s, SID=%s: invalid session.", ip, sid))
	tb = nil
    end

    return tb, obsolete
end

local function sesget(stor, sid, ip)
    local tb, err = stor.get(function(tran, func_execute) 
	return func_execute(tran, "select p::text params, obsolete from console.ses_get(%ses_id%, %ses_ip%)", 
	    "//auth/sesget", {ses_id=sid, ses_ip=ip})
    end, false)

    return sesdecode(tb, sid, ip)
end

local function sesdestroy(stor, sid, ip)
    local tb, err = stor.get(function(tran, func_execute) 
	return func_execute(tran, "select console.ses_destroy(%ses_id%, %ses_ip%)::text params", 
	    "//auth/sesdestroy", {ses_id=sid, ses_ip=ip})
    end, false)

    return sesdecode(tb, sid, ip)
end

local function sesgc(stor)
    local tb, err = stor.get(function(tran, func_execute) 
	return func_execute(tran, "select * from console.ses_gc()", "//auth/sesgc", {})
    end, false)
    if tb ~= nil then
	for i, v in ipairs(tb) do
	    log.i(string.format("[audit] (GC) unlink expired session: %s, user=%s, ip=%s",
		v.sid, v.username, v.ip))
        end
    end
end

local function check_username(username)
    for w in string.gmatch(username, '[^a-zA-Z0-9-_]') do
	return false
    end
    return true
end

local function check_credits(attrs, username, password)
    if attrs.uid ~= nil and attrs.userPassword ~= nil and #attrs.userPassword > 0 and attrs.uid:lower() == username:lower() then
	local pwd, alg
	for i in attrs.userPassword:gmatch("{%w+}") do alg = i:upper(); break; end
	if     alg == nil then
	    pwd = password
	elseif alg == "{SHA}" then
	    pwd = "{SHA}" .. crypto_hash_sha1(password)
	elseif alg == "{MD5}" then
	    pwd = "{MD5}" .. crypto_hash_md5(password)
	elseif alg == "{SSHA}" then
	    pwd = "{SSHA}" .. crypto_hash_ssha1(password, attrs.userPassword:sub(7))
	elseif alg == "{SMD5}" then
	    pwd = "{SMD5}" .. crypto_hash_smd5(password, attrs.userPassword:sub(7))
	else
	    assert(false, "unsupported algorithm")
	end
	return pwd == attrs.userPassword
    else
	return false
    end
end

local function sesID(stor, username, password, ip, lang)
    local sid, ld, err, s

    sid = nil
    ld, err = ldap.open_simple(config.ldap.uri, config.ldap.bind_dn, config.ldap.bind_pw, config.ldap.tls)

    if ld == nil then
	log.w(string.format("%s:%d %s", debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline, err));
    else
	s = config.ldap.search.user_credits
	if s.filter ~= nil then
	    s.filter = s.filter:replace("%1", username)
	    s.filter = s.filter:replace("%uid", username)
	end
	for dn, attrs in ld:search(s) do
	    if check_credits(attrs, username, password) then
		sid = sescreate(stor, username, ip, attrs, lang)
		break
	    end
	end
	ld:close()
    end

    return sid
end

function M.mySID(lang, params, ip, stor)
    local sid
    if params ~= nil and params.username ~= nil and params.password ~= nil and #params.username > 0 and #params.password > 0 and check_username(params.username) then
	sid = sesID(stor, params.username, params.password, ip, lang)
    end
    return sid
end

function M.killSID(sid, ip, stor)
    local tb = nil
    if sid ~= nil and ip ~= nil then
	tb = sesdestroy(stor, sid, ip);
    end
    return tb
end

function M.gc(stor)
    sesgc(stor)
end

function M.validate(sid, ip, stor)
    local tb, obsolete
    if sid ~= nil and ip ~= nil then
	tb, obsolete = sesget(stor, sid, ip)
    end
    return tb, obsolete
end

return M
