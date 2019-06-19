-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, brand=true}
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{training_type},{tm_id},{tm},{brand},{name},{patronymic},{surname},{job_title},{doc_note}'
M.zip = {photo='{doc_id}-{blob_id}', max=1000}

return M
