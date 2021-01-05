-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.home = "null"

M.permissions = { -- disable any objects exept *null*
    null = { }
}

return M
