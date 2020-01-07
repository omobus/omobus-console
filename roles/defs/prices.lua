-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, brand=true, category=true}
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{p_code},{brand},{categ},{prod},{price},{promo},{rrp}'

return M
