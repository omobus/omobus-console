-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local core = require 'core'
local log = require 'log'
local pq = require 'bind_pgsql'

local READ_TRAN = "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
local WRITE_TRAN = "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ WRITE"
local COMMIT_TRAN = "COMMIT TRANSACTION"
local ROLLBACK_TRAN = "ROLLBACK TRANSACTION"

local numberTypes = {
    23 --[[INT4OID]],
    20 --[[INT8OID]],
    21 --[[INT2OID]],
    1700 --[[NUMERICOID]],
    700 --[[FLOAT4OID]],
    701 --[[FLOAT8OID]]
}

local function isnull(arg)
    return type(arg) == "table" and arg.null == true;
end

local function dumparray(arg)
    local s = ""
    for a,b in pairs(arg) do
	s = s .. (#s==0 and "" or ",") .. b
    end
    return s
end

local function dumpparams(query_id, params)
    local f = false
    local str = query_id
    if params ~= nil then
	for k, v in pairs(params) do
	    if f then 
		str = str .. "&" 
	    else
		str = str .. "?"
		f = true
	    end
	    str = str .. k .. "=" .. (isnull(v) and 'null' or 
		(type(v) == "table" and dumparray(v) or v))
	end
    end
    return str
end

local function write_largeobject(conn, blob)
    assert(conn, "incorrect connection context")
    assert(blob, "invalid blob buffer")

    local oid, fd, wr

    oid = conn:lo_create()
    assert(oid~=0, "unable to create a new large object.")
    fd = conn:lo_open(oid, pq.INV_WRITE)
    if fd == nil then
	conn:unlink(oid)
	log.e(string.format("%s:%d unable to open an existing large object (oid=%d) for writing blob data.", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    oid))
	return 0
    end
    wr = fd:write(blob)
    fd:close()
    if wr == -1 then
	log.e(string.format("%s:%d unable to write blob data (oid=%d).", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    oid))
	conn:unlink(oid)
	return 0
    end

    return oid
end

local function read_largeobject(conn, oid)
    assert(conn, "incorrect connection context")

    local fd, blob, tmp, rd

    if oid == nil or oid == -1 then
	return nil
    end

    fd = conn:lo_open(oid, pq.INV_READ)
    if fd == nil then
	log.e(string.format("%s:%d unable to open an existing large object (oid=%d) for reading blob data.", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    oid))
	return nil
    end
    blob = ""
    while true do
	tmp, rd = fd:read()
	if rd > 0 then 
	    blob = blob .. tmp 
	else
	    break
	end
    end
    fd:close()
    if rd == -1 then
	log.e(string.format("%s:%d unable to read blob data (oid=%d).", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    oid))
	blob = nil
    end

    return blob
end

local function sqlexec(conn, query, params, blob)
    local res
    if params ~= nil then
	local tmp = query
	for k,v in pairs(params) do
	    if isnull(v) then 
		tmp = tmp:replace(string.format("%%%s%%", k), 'null')
	    elseif type(v) == "table" then
		local z
		for a,b in pairs(v) do
		    if z == nil then z = "" else z = z .. "," end
		    z = z .. b
		end
		tmp = tmp:replace(string.format("%%%s%%", k), z~=nil and conn:escape(z) or 'null')
	    elseif type(v) == "number" then
		tmp = tmp:replace(string.format("%%%s%%", k), v)
	    else
		tmp = tmp:replace(string.format("%%%s%%", k), conn:escape(v))
	    end
	end
	query = tmp
    end
    if blob ~= nil and #blob > 0 then
	local blob_oid = write_largeobject(conn, blob)
	if blob_id == 0 then
	    log.e(string.format("%s:%d unable to write blob data (size=%d).",
		debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
		#blob))
	    return nil
	end
	query = query:replace("%1:blob%", blob_oid)
    else
	query = query:replace("%1:blob%", "")
    end

    return conn:exec(query)
end

local function putdata(conn, colname, ftype, ptr, len, tb)
    if ptr ~= nil then
	if ftype == 26 --[[OIDOID]] then
	    tb[colname] = read_largeobject(conn, tonumber(ptr))
	elseif core.contains(numberTypes, ftype) == true then
	    tb[colname] = tonumber(ptr)
	else
	    tb[colname] = ptr
	end
    end
end

-- *** stor_pgsql interface: begin *** 

function M.connect(server, storage, user, password)
    assert(server, "uninitialized 'server' variable!")
    assert(storage, "uninitialized 'storage' variable!")
    assert(user, "uninitialized 'user' variable!")
    assert(password, "uninitialized 'password' variable!")

    local cs, conn

    cs = string.format("%s dbname=%s user=%s password=%s", server, storage, user, password)
    conn = pq.connectdb(cs)
    if conn:status() ~= pq.CONNECTION_OK then
	log.w(string.format("%s:%d unable to create connection (%s). %s.", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    cs, conn:errorMessage()))
	conn:finish()
	return nil
    end

    log.d(string.format("database %s@[%s]/%s connected.", user, server, storage))

    conn:setNoticeProcessor(log.i);

    return conn
end

function M.disconnect(conn)
    conn:finish()
    conn = nil
    log.d("database disconnected.")
end

function M.begin_tran(conn, readonly)
    assert(conn, "incorrect connection context")
    local res = sqlexec(conn, readonly and READ_TRAN or WRITE_TRAN)
    if res == nil or res:status() ~= pq.PGRES_COMMAND_OK then
	log.w(string.format("%s:%d unable to begin %s transaction. %s.", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
		readonly and "read" or "write", 
		res ~= nil and res:errorMessage() or "unable to allocate memory"
	    ))
	if res ~= nil then res:clear() end
	return nil
    end
    res:clear()
    log.d(string.format("begin %s transaction.",
	    readonly and "read" or "write"))
    return conn
end

local function end_tran(conn, commit)
    assert(conn, "incorrect connection context")
    local res = sqlexec(conn, commit and COMMIT_TRAN or ROLLBACK_TRAN)
    if res == nil or res:status() ~= pq.PGRES_COMMAND_OK then
	log.w(string.format("%s:%d unable to begin %s transaction. %s.", 
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    commit and "commit" or "rollback",
	    res ~= nil and res:errorMessage() or "unable to allocate memory"
	    ))
    else
	log.d(string.format("%s transaction.",
	    commit and "commit" or "rollback"))
    end
    if res ~= nil then 
	res:clear()
    end
end

function M.commit_tran(tran)
    end_tran(tran, true)
end

function M.rollback_tran(tran)
    end_tran(tran, false)
end

function M.execute(conn, query, query_id, params, blob)
    assert(conn, "incorrect connection context")
    assert(query and #query>0, "invalid query string")

    local tb, v, res, status, columns, rows, i, r, colname

    res = sqlexec(conn, query, params, blob)
    if res == nil then
	log.e(string.format("%s:%d unable to execute query %s.",
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    dumpparams(query_id, params)))
	return nil, true
    end
    status = res:status()
    if status == pq.PGRES_TUPLES_OK then
	columns = res:nfields(); rows = res:ntuples()
	if columns > 0 and rows > 0 then
	    tb = {}
	    for r = 1, rows do
		v = {}
		for i = 1, columns do
		    colname = string.lower(res:fname(i))
		    if res:fformat(i) > 0 then
			log.w(string.format("%s:%d binary representation does not support. Column: %s. Row: %d.", 
			debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
			colname, r))
		    elseif not res:getisnull(r, i) then
			putdata(conn, colname, res:ftype(i), res:getvalue(r, i), res:getlength(r, i), v)
		    end
		end
		tb[r] = v
	    end
	end
    elseif status ~= pq.PGRES_COMMAND_OK then
	log.e(string.format("%s:%d unable to execute query %s: %s.",
	    debug.getinfo(1,'S').short_src, debug.getinfo(1, 'l').currentline,
	    dumpparams(query_id, params), res:errorMessage()))
	res:clear()
	return nil, true
    end
    res:clear()

    log.d(string.format("query %s executed successfully. Rows: %d.",
	dumpparams(query_id, params), tb == nil and 0 or #tb))

    return tb, false
end

-- *** stor_pgsql interface: end *** 

return M
