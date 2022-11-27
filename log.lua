-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local debug = false
local code = "(console) "
local shielding = function(s) return s == nil and '<nil>' or s; end

return {
    init = function(arg) debug = arg; end,
    i = function(s) log_msg(code .. shielding(s)); end,
    w = function(s) log_warn(code .. shielding(s)); end,
    e = function(s) log_error(code .. shielding(s)); end,
    d = function(s) if debug then print(code .. shielding(s)); end; end
}

