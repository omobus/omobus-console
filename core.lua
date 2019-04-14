-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

function M.split(str, pat, fn)
    local t = {}  -- NOTE: use {n = 0} in Lua-5.0
    local fpat = "(.-)" .. pat
    local last_end = 1
    local s, e, cap = str:find(fpat, 1)
    while s do
	if s ~= 1 or cap ~= "" then
	    table.insert(t, fn ~= nil and fn(cap) or cap)
	end
	last_end = e+1
	s, e, cap = str:find(fpat, last_end)
    end
    if last_end <= #str then
	cap = str:sub(last_end)
	table.insert(t, fn ~= nil and fn(cap) or cap)
    end
    return t
end

function M.contains(arr, val)
    for index, value in ipairs(arr) do
	if value == val then
	    return true
	end
    end

    return false
end

function M.reduce(rows, colname, idx)
    local tb = {}
	if rows ~= nil then
	    for i, v in ipairs(rows) do
		if idx[ v[colname] ] ~= nil then
		table.insert(tb, v);
	    end
	end
	return tb
    else
	return rows
    end
end

function M.deepcopy(o, seen)
    seen = seen or {}
    if o == nil then return nil end
    if seen[o] then return seen[o] end

    local no
    if type(o) == 'table' then
	no = {}
	seen[o] = no

	for k, v in next, o, nil do
	    no[M.deepcopy(k, seen)] = M.deepcopy(v, seen)
	end
	setmetatable(no, M.deepcopy(getmetatable(o), seen))
    else -- number, string, boolean, etc
	no = o
    end
    return no
end

return M
