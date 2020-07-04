-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.package_code		= "console"
M.package_version	= "3.5.6"
M.package_name		= "omobus-" .. M.package_code
M.static_prefix		= "/" .. M.package_code .. "/" .. M.package_version

return M
