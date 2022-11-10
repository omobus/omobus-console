-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local config = require 'config'
local code = "(console) "
local shielding = function(s) return s == nil and '<nil>' or s; end

M.i = function(s) log_msg(code .. shielding(s)) end
M.w = function(s) log_warn(code .. shielding(s)) end
M.e = function(s) log_error(code .. shielding(s)) end
M.d = function(s) if config.debug then print(code .. shielding(s)); end; end

return M
