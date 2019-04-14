-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

function M.isuid(str)
    return str ~= nil and str:match('[^a-zA-ZабвгдеёжзийклмнопрстуфхцчшщъыьэюяА-Я0-9-.,_/: ()+]') == nil
end

function M.isdate(str)
    return str ~= nil and #str == 10 and str:match('((%d%d%d%d)-(%d%d)-(%d%d))') ~= nil
end

function M.equal(arr, arg)
    if type(arg) == 'table' then
	for key, value in pairs(arg) do
	    if M.equal(arr, value) then return true end
	end
    else
	if type(arr) == 'table' then
	    for key, value in pairs(arr) do
		if value == arg then return true end
	    end
	else
	    return arr == arg and true or false
	end
    end
    return false
end

return M
