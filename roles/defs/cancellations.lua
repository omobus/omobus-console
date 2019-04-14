-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

--[[ locked by default: M.add = {offset=-5, depth=2} ]]
M.restore = false
M.reject = true

return M
