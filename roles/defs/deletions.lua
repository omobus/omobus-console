-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, potential=true}
M.rows = 500
M.data = {registered=true, validated=true, rejected=false, closed=false}
M.reject = false
M.validate = false

return M
