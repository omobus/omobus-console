-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Key account manager

M.home = "tech"
M.selectable = {
    reports = {
	daily = {"tech", "route_compliance"},
	monthly = {"joint_routes", "confirmations", "comments", "photos", "testings", "audits", "shelfs", "quests", "stocks", "advt", "prices", "posms"}
    },
    analitics = {"targets_compliance"},
    managment = {"routes", "targets", "additions", "deletions", "wishes", "discards", "cancellations", "info_materials", "training_materials", "pos_materials", "planograms"},
    archives = {"photos_archive"}
}

M.permissions = {
    null 	= { },

    additions 		= require 'roles.defs.additions',
    advt 		= require 'roles.defs.advt',
    audits 		= require 'roles.defs.audits',
    cancellations 	= require 'roles.defs.cancellations',
    comments 		= require 'roles.defs.comments',
    confirmations 	= require 'roles.defs.confirmations',
    deletions 		= require 'roles.defs.deletions',
    discards 		= require 'roles.defs.discards',
    info_materials 	= require 'roles.defs.info_materials',
    joint_routes 	= require 'roles.defs.joint_routes',
    orders 		= require 'roles.defs.orders',
    photos 		= require 'roles.defs.photos',
    photos_archive 	= require 'roles.defs.photos_archive',
    planograms 		= require 'roles.defs.planograms',
    pos_materials 	= require 'roles.defs.pos_materials',
    posms 		= require 'roles.defs.posms',
    prices 		= require 'roles.defs.prices',
    quests 		= require 'roles.defs.quests',
    reclamations 	= require 'roles.defs.reclamations',
    route_compliance 	= require 'roles.defs.route_compliance',
    routes 		= require 'roles.defs.routes',
    shelfs 		= require 'roles.defs.shelfs',
    stocks 		= require 'roles.defs.stocks',
    targets 		= require 'roles.defs.targets',
    targets_compliance 	= require 'roles.defs.targets_compliance',
    tech 		= require 'roles.defs.tech',
    testings 		= require 'roles.defs.testings',
    tickets 		= require 'roles.defs._ro',
    training_materials 	= require 'roles.defs._ro',
    wishes 		= require 'roles.defs.wishes'
}

-- # extra permission:
M.permissions = require 'core'.deepcopy(M.permissions)
M.permissions.confirmations.remark = true
M.permissions.photos.target = true
M.permissions.posms.target = true
M.permissions.targets_compliance.remark = true
M.permissions.tech.target = true

return M
