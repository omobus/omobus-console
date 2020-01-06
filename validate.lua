-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local core = require 'core'

function M.isuid(str)
    return str ~= nil and str:match('[^a-zA-ZабвгдеёжзийклмнопрстуфхцчшщъыьэюяА-Я0-9-._/: ()+]') == nil
end

function M.isuids(str, delim)
    local ar
    if str == nil then
	return false
    end
    ar = core.split(str, delim or ',')
    if ar == nil or #ar == 0 then
	return false
    end
    for i, val in ipairs(ar) do
	if M.isuid(val) == false then
	    return false
	end
    end

    return true
end

function M.isdate(str)
    return str ~= nil and #str == 10 and str:match('((%d%d%d%d)-(%d%d)-(%d%d))') ~= nil
end

return M
