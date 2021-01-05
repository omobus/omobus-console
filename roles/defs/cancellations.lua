-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.add = {offset=0, depth=2}
M.columns = {area=true, department=true, distributor=true}
M.restore = false
M.revoke = true
M.rows = 500

return M
