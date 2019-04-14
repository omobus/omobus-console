-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, author=true}
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{target_id},{subject},{body},{b_date},{e_date},{target_type},{confirm},{doc_note},{author},{doc_id}'
M.zip = {photo='{doc_id}-{blob_id}', max=1000}

return M
