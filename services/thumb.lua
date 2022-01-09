-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local config = require 'config'
local mime = require 'mime'
local scgi = require 'scgi'
local validate = require 'validate'
local core = require 'core'
local stor = require 'stor'
local ark = require 'archive'
local log = require 'log'

local SERVICE_CODE = "/services/thumb"

function M.main(lang, ip, method, params, content, content_type, res)
    if params == nil or params.ref == nil or not validate.isuid(params.ref) then
	log.e(string.format("[%s] [from: %s] => bad request", SERVICE_CODE, ip));
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, "Bad request")
    elseif method == 'GET' then
	stor.init()
	local tb, err = stor.get(function(tran, func_execute) return func_execute(tran,
[[
select thumb_get(%guid%::uuid) thumb
]]
		, SERVICE_CODE
		, {guid = params.ref}
	    )
	end
	)
	stor.cleanup()
	if err then
	    log.e(string.format("[%s] GET => ref:%s [from: %s] => internal server error", SERVICE_CODE, params.ref, ip));
	    scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	    scgi.writeBody(res, "Internal server error")
	elseif tb == nil or #tb ~= 1 or tb[1].thumb == nil then
	    tb, err = ark.getJPEG('thumb', {ref = params.ref})
	    if err then
		log.e(string.format("[%s] GET via ark (LTS) => ref:%s [from: %s] => internal server error", SERVICE_CODE, params.ref, ip));
		scgi.writeHeader(res, 500, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Internal server error")
	    elseif tb == nil then
		log.w(string.format("[%s] GET via ark (LTS) => ref:%s [from: %s] => dosn't exist", SERVICE_CODE, params.ref, ip));
		scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
		scgi.writeBody(res, "Bad request")
	    else
		log.i(string.format("[%s] GET via ark (LTS) => ref:%s [from: %s]", SERVICE_CODE, params.ref, ip));
		scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
		scgi.writeBody(res, tb)
	    end
	else
	    log.i(string.format("[%s] GET => ref:%s [from: %s]", SERVICE_CODE, params.ref, ip));
	    scgi.writeHeader(res, 200, {["Content-Type"] = mime.jpeg})
	    scgi.writeBody(res, tb[1].thumb)
	end
    else
	log.w(string.format("[%s] %s => %s [from: %s] => method dosn't supported", SERVICE_CODE, method, params.ref, ip));
	scgi.writeHeader(res, 400, {["Content-Type"] = mime.txt .. "; charset=utf-8"})
	scgi.writeBody(res, string.format("[%s] method dosn't supported.",method))
    end
end

return M
