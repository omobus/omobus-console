-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.mapEngine = 'Yandex.Maps'
--M.mapEngine = 'Google.Maps'
--M.mapKey = 'AIzaSyAGVIfJAbkXL771DhPfC50k37nDoU2R9bE'
M.columns = {area=true, department=true, distributor=true, channel=true, potential=true}
M.weeks = 4
M.tabs = {a_list=true}
M.target = false
M.urgent = false
M.zstatus = {granted = 'no' --[[ no|yes|self ]], depth = 7 --[[ in days ]]} 
M.availability = {checkup=true, presence=true, stock=true, oos=true}

return M
