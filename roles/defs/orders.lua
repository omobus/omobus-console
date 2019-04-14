-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {channel=true, head=true, distributor=true, payment=true}
M.rows = 500
M.csv = '{fix_dt},{head_name},{user_id},{u_name},{a_code},{a_name},{address},{rc},{chan},{region},{city},{order_type},{amount},{delivery_date},{delivery_type},{delivery_note},{payment_method},{encashment},{payment_delay},{bonus},{distributor},{warehouse},{doc_note},{doc_id}'

return M
