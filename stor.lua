-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local defstor

M.NULL = { null = true }

function M.init(config)
    defstor = config.stor
    if defstor.init ~= nil then defstor.init() end
end

function M.cleanup()
    if defstor.cleanup ~= nil then defstor.cleanup() end
    defstor = nil
end

function M.get(func_in_tran, ro)
    local conn, tran, tb, err
    err = true
    if func_in_tran ~= nil then
	conn = defstor.connect()
	if conn ~= nil then
	    tran = defstor.begin_tran(conn, ro == nil or ro)
	    if tran ~= nil then
		tb, err = func_in_tran(tran, defstor.execute)
		defstor.commit_tran(tran)
	    end
	    defstor.disconnect(conn)
	end
    end
    return tb, err
end

function M.put(func_in_tran)
    local conn, tran, err
    err = true
    if func_in_tran ~= nil then
	conn = defstor.connect()
	if conn ~= nil then
	    tran = defstor.begin_tran(conn, false)
	    if tran ~= nil then
		_, err = func_in_tran(tran, defstor.execute)
		defstor.commit_tran(tran)
	    end
	    defstor.disconnect(conn)
	end
    end
    return err
end

return M
