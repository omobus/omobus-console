-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.daily_reports = {
    "tech", 
    "route_compliance"
}

M.monthly_reports = {
    "joint_routes", 
    "orders", 
    "reclamations", 
    "comments", 
    "confirmations", 
    "photos", 
    "checkups",
    "presences", 
    "stocks", 
    "oos",
    "advt", 
    "prices", 
    "posms", 
    "promos",
    "trainings", 
    "presentations", 
    "audits", 
    "shelfs", 
    "quests" 
}

M.analitics = {
    "targets_compliance",
    "time"
}

M.managment = {
    "routes", 
    "scheduler", 
    "targets", 
    "additions", 
    "deletions", 
    "wishes", 
    "discards", 
    "cancellations", 
    "info_materials", 
    "training_materials", 
    "pos_materials", 
    "planograms",
    "contacts"
}

M.archives = {
    "photos_archive"
}

return M
