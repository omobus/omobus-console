-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.add = {max_file_size_mb=25, offset=1, depth=12}
-- not owner:
M.remove = false
M.edit = false

return M
