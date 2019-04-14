-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true}
M.target = false
M.rows = 500
M.csv = '{author_name},{account_id},{a_code},{a_name},{address},{region},{city},{rc},{ka_code},{poten},{chan},{subject},{body},{b_date},{e_date},{target_type},{myself},{L.performer_name},{L.fix_dt},{L.confirm},{L.doc_note},{L.head_name},{target_id}'
M.zip = {photo='{target_id}-{blob_id}', max=1000}

return M
