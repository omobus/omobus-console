-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, addition_type=true}
M.rows = 500
M.data = {registered=true, validated=true, rejected=false}
M.reject = false
M.validate = false

return M
