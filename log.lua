-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface
local code = "(console) "

M.i = function(s) log_msg(code..s) end
M.w = function(s) log_warn(code..s) end
M.e = function(s) log_error(code..s) end
M.d = function(s) print(code.."[DEBUG] "..s) end

return M
