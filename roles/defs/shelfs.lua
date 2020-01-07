-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true}
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{categ},{sos},{soa}'
M.zip = {photo='{doc_id}-{blob_id}', max=1000}

return M
