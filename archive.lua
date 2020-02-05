-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local config = require 'config'
local V = require 'version'
local json = require 'json'
local zlib = require 'zlib'
local log = require 'log'

local M = {} -- public interface

local reqtempl = "GET /ark/$(objectname)?tid=$(tokenid)$(params) HTTP/1.1\r\nHost: $(hostname)\r\nUser-Agent: " .. V.package_name .. "\r\nConnection: close\r\n\r\n"
local tlsconfig = { noverifycert = true, noverifyname = true, ciphers = "compat", ca_file = "/OMOBUS_Root_Certification_Authority.pem" }

local function errormsg(s)
    log.e("(archive) " .. s);
end

local function strrepl(s, f, t)
    return s:replace(string.format("$(%s)", f), t)
end

local function compile_params(params)
    local a = ""
    if params ~= nil then
	for key, value in pairs(params) do
	    a = a .. string.format("&%s=%s", key, value)
	end
    end
    return a
end

local function decompress(p)
    local x,_,_,_ = zlib.inflate():finish(p)
    return x
end

function M.getJSON(name, params)
    local tb, err, sockfd, msg, x, req, more, resp, zipped

    assert(config.ark.host, "uninitialized [ark.host] config variable!")
    assert(config.ark.port, "uninitialized [ark.port] config variable!")

    sockfd, msg = sock.connect(config.ark.host, config.ark.port, config.ark.connect_timeout or 10, 
	{rcvtimeo = config.ark.recv_timeout or 5, sndtimeo = config.ark.send_timeout or 5})
    if sockfd == nil then
	errormsg(msg)
	return nil, true
    end
    if config.ark.tls then
	x, msg = sockfd:start_tls(tlsconfig)
	if x == nil then
	    sockfd:close()
	    errormsg(msg)
	    return nil, true
	end
    end

    req = reqtempl
    req = strrepl(req, "hostname", config.ark.host)
    req = strrepl(req, "tokenid", config.ark.tokenid)
    req = strrepl(req, "objectname", name)
    req = strrepl(req, "params", compile_params(params))

    x, msg = sockfd:send(req)
    if x == nil then
	errormsg(msg); err = true
    else
	resp, msg = sockfd:recv()
	if resp == nil then
	    errormsg(msg); err = true
	else
	    local step = 0
	    resp:gsub("([^\r\n]+)", function(c)
		if step == 0 then
		    -- *** HTTP/1.1 200 OK
		    local protocol, code
		    c:gsub("(%w+)/(%d+).(%d+)([ ]+)(%d+)([ ]+)(%w*)", function(arg0,arg1,arg2,arg3,arg4,arg5)
			protocol = arg0; code = arg4
		    end)
		    if protocol == nil then
			errormsg(string.format("unknown response from the %s:%d", config.ark.host, config.ark.port))
			err = true
		    elseif protocol ~= "HTTP" then
			errormsg(string.format("%s:%d does not support HTTP format", config.ark.host, config.ark.port))
			err = true
		    elseif code ~= "200" then
			errormsg(string.format("%s:%d returns [%d] response.", config.ark.host, config.ark.port, code))
			err = true
		    end
		elseif c:sub(1, 12) == "Content-Type" then
		    -- *** Content-Type: application/json; charset=utf-8
		    local charset, type
		    c:gsub("([%w-%w]+):([ ]+)(%w+)/(%w+);([ ]+)(%w+)=([%w-%w]+)", function(arg0,arg1,arg2,arg3,arg4,arg5,arg6)
			type = arg3; charset = arg6
		    end)
		    if type ~= 'json' then
			errormsg(string.format("supported only json responses; the %s:%d returns %s data", 
			    config.ark.host, config.ark.port, type))
			err = true
		    elseif charset ~= 'utf-8' then
			errormsg(string.format("supported only utf-8 responses; the %s:%d returns %s data", 
			    config.ark.host, config.ark.port, charset))
			err = true
		    end
		elseif c:sub(1, 17) == "Transfer-Encoding" and c:sub(19):ltrim(" ") == "chunked" then
		    errormsg(string.format("%s:%d chunked response does't supported", config.ark.host, config.ark.port))
		    err = true
		elseif c:sub(1, 14) == "Content-Length" then
		    c:gsub("([%w-%w]+):([ ]+)(%d+)", function(arg0,arg1,arg2)
			more = tonumber(arg2)
		    end)
		elseif c:sub(1, 16) == "Content-Encoding" and c:sub(18):ltrim(" ") == "deflate" then
		    zipped = true
		end
		step = step + 1
	    end)

	    if not err then
		if zipped then
		    resp = resp:sub(resp:find("\r\n\r\n", 1, true) + 4)
		else 
		    local tmp = ""
		    resp:sub(resp:find("\r\n\r\n", 1, true) + 4):gsub("([^\r\n]+)", function(c) tmp = tmp .. c; end)
		    resp = tmp
		end
		if more ~= nil and more > #resp then
		    while more > #resp and not err do
			local tmp
			tmp, msg = sockfd:recv()
			if tmp == nil then
			    errormsg(msg); err = true
			elseif #tmp == 0 then
			    break
			else
			    resp = resp .. tmp
			end
		    end
		end
	    end
	end
    end

    if config.ark.tls then
	sockfd:stop_tls()
    end
    sockfd:close()

    if not err then
	tb = zipped and json.decode(decompress(resp)) or json.decode(resp)
    end

    return tb, err
end

function M.getJPEG(name, params)
    local tb, err, sockfd, msg, x, req, more, resp

    if config.ark == nil then
	return nil, false
    end

    assert(config.ark.host, "uninitialized [ark.host] config variable!")
    assert(config.ark.port, "uninitialized [ark.port] config variable!")

    sockfd, msg = sock.connect(config.ark.host, config.ark.port, config.ark.connect_timeout or 10, 
	{rcvtimeo = config.ark.recv_timeout or 5, sndtimeo = config.ark.send_timeout or 5})
    if sockfd == nil then
	errormsg(msg)
	return nil, true
    end
    if config.ark.tls then
	x, msg = sockfd:start_tls(tlsconfig)
	if x == nil then
	    sockfd:close()
	    errormsg(msg)
	    return nil, true
	end
    end

    req = reqtempl
    req = strrepl(req, "hostname", config.ark.host)
    req = strrepl(req, "tokenid", config.ark.tokenid)
    req = strrepl(req, "objectname", name)
    req = strrepl(req, "params", compile_params(params))

    x, msg = sockfd:send(req)
    if x == nil then
	errormsg(msg); err = true
    else
	resp, msg = sockfd:recv()
	if resp == nil then
	    errormsg(msg); err = true
	else
	    local step = 0
	    resp:gsub("([^\r\n]+)", function(c)
		if step == 0 then
		    -- *** HTTP/1.1 200 OK
		    local protocol, code
		    c:gsub("(%w+)/(%d+).(%d+)([ ]+)(%d+)([ ]+)(%w*)", function(arg0,arg1,arg2,arg3,arg4,arg5)
			protocol = arg0; code = arg4
		    end)
		    if protocol == nil then
			errormsg(string.format("unknown response from the %s:%d", config.ark.host, config.ark.port))
			err = true
		    elseif protocol ~= "HTTP" then
			errormsg(string.format("%s:%d does not support HTTP format", config.ark.host, config.ark.port))
			err = true
		    elseif code ~= "200" then
			errormsg(string.format("%s:%d returns [%d] response.", config.ark.host, config.ark.port, code))
			err = true
		    end
		elseif c:sub(1, 12) == "Content-Type" then
		    -- *** Content-Type: image/jpeg
		    local type
		    c:gsub("([%w-%w]+):([ ]+)(%w+)/(%w+)", function(arg0,arg1,arg2,arg3)
			type = arg3
		    end)
		    if type ~= 'jpeg' then
			errormsg(string.format("supported only jpeg responses; the %s:%d returns %s data", 
			    config.ark.host, config.ark.port, type))
			err = true
		    end
		elseif c:sub(1, 17) == "Transfer-Encoding" and c:sub(19):ltrim(" ") == "chunked" then
		    errormsg(string.format("%s:%d chunked response does't supported", config.ark.host, config.ark.port))
		    err = true
		elseif c:sub(1, 14) == "Content-Length" then
		    c:gsub("([%w-%w]+):([ ]+)(%d+)", function(arg0,arg1,arg2)
			more = tonumber(arg2)
		    end)
		end
		step = step + 1
	    end)

	    if not err then
		resp = resp:sub(resp:find("\r\n\r\n", 1, true) + 4)
		if more ~= nil and more > #resp then
		    while more > #resp and not err do
			local tmp
			tmp, msg = sockfd:recv()
			if tmp == nil then
			    errormsg(msg); err = true
			elseif #tmp == 0 then
			    break
			else
			    resp = resp .. tmp
			end
		    end
		end
	    end
	end
    end

    if config.ark.tls then
	sockfd:stop_tls()
    end
    sockfd:close()

    if not err then
	tb = resp
    end

    return tb, err
end


return M
