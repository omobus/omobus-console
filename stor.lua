-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local config = require 'config'
local stor = require 'stor_pgsql'

local M = {} -- public interface

M.NULL = { null = true }

function M.init()
    if stor.init ~= nil then stor.init() end
end

function M.cleanup()
    if stor.cleanup ~= nil then stor.cleanup() end
end

function M.get(func_in_tran, ro)
    local conn, tran, tb, err
    err = true
    if func_in_tran ~= nil then
	conn = stor.connect(config.data.server, config.data.storage, config.data.user, config.data.password)
	if conn ~= nil then
	    tran = stor.begin_tran(conn, ro == nil or ro)
	    if tran ~= nil then
		tb, err = func_in_tran(tran, stor.execute)
		stor.commit_tran(tran)
	    end
	    stor.disconnect(conn)
	end
    end
    return tb, err
end

function M.put(func_in_tran)
    local conn, tran, err
    err = true
    if func_in_tran ~= nil then
	conn = stor.connect(config.data.server, config.data.storage, config.data.user, config.data.password)
	if conn ~= nil then
	    tran = stor.begin_tran(conn, false)
	    if tran ~= nil then
		_, err = func_in_tran(tran, stor.execute)
		stor.commit_tran(tran)
	    end
	    stor.disconnect(conn)
	end
    end
    return err
end

return M
