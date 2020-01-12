-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, brand=true, photo_type=true}
M.target = false
M.urgent = false
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{brand},{placement},{photo_type},{doc_note},{doc_id}'
M.zip = {photo='{doc_id}', max=1000}

return M
