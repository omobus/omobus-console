-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.columns = {workday=true, mileage=true, head=true}
M.csv = '{row_no},{head_name},{user_id},{u_name},{wd_begin},{wd_end},{wd_duration},{rd_begin},{rd_end},{rd_duration},{duration},{scheduled},{closed},{pending},{other},{canceled},{warn_min_duration},{warn_max_duration},{warn_max_distance},{canceling_note},{mileage},{violations.gps},{violations.tm},{power.begin},{power.end},{power.chargings}'

return M
