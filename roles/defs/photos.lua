-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, brand=true, photo_type=true}
M.target = false
M.urgent = false
M.rows = 500
M.zip = {photo='{doc_id}', max=1000}

return M
