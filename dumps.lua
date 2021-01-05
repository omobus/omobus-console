-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local core = require 'core'
local ftp = require 'ftp'
local ldap = require 'bind_ldap'


function M.list(config, username)
    local ldfd, ftpfd, s, passwd, data, err, tb

    err = false
    s = config.ldap.search.user_credits
    if s.filter ~= nil then
	s.filter = s.filter:replace("%1", username)
	s.filter = s.filter:replace("%uid", username)
    end

    ldfd = ldap.open_simple(config.ldap.uri, config.ldap.bind_dn, config.ldap.bind_pw, config.ldap.tls)
    if ldfd == nil then
	return nil
    end
    for dn, attrs in ldfd:search(s) do
	if attrs.dumpsStatus == 'enabled' then
	    passwd = attrs.userPassword
	end
	break
    end
    ldfd:close()

    if passwd == nil then
	return nil
    end

    ftpfd = ftp.connect(config.ftp.host, config.ftp.port, config.ftp.connect_timeout, 
	config.ftp.recv_timeout, config.ftp.send_timeout, config.ftp.epsv)
    if ftpfd == nil then
	return nil
    end
    if config.ftp.tls then err = not ftpfd:authtls(false, true, true, config.ca_file, "compat"); end
    if not err then err = not ftpfd:login(username, passwd); end
    if not err and config.ftp.tls and config.ftp.cdc ~= true then err = not ftpfd:prot(); end
    if not err and config.ftp.tls and config.ftp.ccc == true then err = not ftpfd:ccc(); end
    if not err then err = not ftpfd:cwd("dumps/"); end
    if not err then data, err = ftpfd:nlst(); end
    if not err then
	tb = core.split(data, '\n')
	if core.contains(tb, '__unlocked__') then
	    local ar = {}
	    for index, value in ipairs(tb) do
		if value ~= '__unlocked__' and value ~= '.' and value ~= '..' then
		    table.insert(ar, core.split(value, '+')[1])
		end
	    end
	    tb = ar
	else
	    tb = {}
	end
    end
    if not err then ftpfd:quit(); end
    ftpfd:disconnect()

    return err and nil or tb
end

function M.get(config, username, name)
    local ldfd, ftpfd, s, passwd, data, err, tb

    err = false
    s = config.ldap.search.user_credits
    if s.filter ~= nil then
	s.filter = s.filter:replace("%1", username)
	s.filter = s.filter:replace("%uid", username)
    end

    ldfd = ldap.open_simple(config.ldap.uri, config.ldap.bind_dn, config.ldap.bind_pw, config.ldap.tls)
    if ldfd == nil then
	return nil
    end
    for dn, attrs in ldfd:search(s) do
	if attrs.dumpsStatus == 'enabled' then
	    passwd = attrs.userPassword
	end
	break
    end
    ldfd:close()

    if passwd == nil then
	return nil
    end

    ftpfd = ftp.connect(config.ftp.host, config.ftp.port, config.ftp.connect_timeout, 
	config.ftp.recv_timeout, config.ftp.send_timeout, config.ftp.epsv)
    if ftpfd == nil then
	return nil
    end
    if config.ftp.tls then err = not ftpfd:authtls(false, true, true, config.ca_file, "compat"); end
    if not err then err = not ftpfd:login(username, passwd); end
    if not err and config.ftp.tls and config.ftp.cdc ~= true then err = not ftpfd:prot(); end
    if not err and config.ftp.tls and config.ftp.ccc == true then err = not ftpfd:ccc(); end
    if not err then err = not ftpfd:cwd("dumps/"); end
    if not err then data, err = ftpfd:nlst(); end
    if not err then
	tb = core.split(data, '\n')
	if core.contains(tb, '__unlocked__') then
	    local xx = {}
	    for index, value in ipairs(tb) do
		if core.split(value, '+')[1] == name then
		    xx.name = value
		    xx.data, err = ftpfd:retr(value)
		end
	    end
	    tb = xx
	else
	    tb = {}
	end
    end
    if not err then ftpfd:quit(); end
    ftpfd:disconnect()

    return err and nil or tb
end

return M
