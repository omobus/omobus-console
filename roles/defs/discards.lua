-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.validate = false
M.reject = false
M.v = {registered=true, validated=true, rejected=false, closed=true}

return M
