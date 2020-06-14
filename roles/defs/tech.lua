-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.mapEngine = 'Yandex.Maps'
--M.mapEngine = 'Google.Maps'
--M.mapKey = 'AIzaSyAGVIfJAbkXL771DhPfC50k37nDoU2R9bE'
M.columns = {area=true, department=true, distributor=true}
M.tabs = {a_list=true}
M.target = false
M.urgent = false
M.zstatus = false

return M
