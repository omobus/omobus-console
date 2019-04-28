-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Supervisor

M.home = "tech"
M.selectable = {
    reports = {
	daily = {"tech", "route_compliance"},
	monthly = {"joint_routes", "confirmations", "orders", "reclamations", "comments", "photos", "testings", "audits", "shelfs", "quests", "prices"}
    },
    analitics = {"targets_compliance"},
    managment = {"routes", "targets", "additions", "deletions", "wishes", "discards", "cancellations", "info_materials", "training_materials", "pos_materials", "planograms"}
}

M.permissions = {
    null 	= { },

    additions 		= require 'roles.defs.additions',
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
    planograms 		= require 'roles.defs._ro',
    pos_materials 	= require 'roles.defs._ro',
    prices 		= require 'roles.defs.prices',
    quests 		= require 'roles.defs.quests',
    reclamations 	= require 'roles.defs.reclamations',
    route_compliance 	= require 'roles.defs.route_compliance',
    routes 		= require 'roles.defs.routes',
    shelfs 		= require 'roles.defs.shelfs',
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
M.permissions.additions.data.lidate = true
M.permissions.additions.reject = true
M.permissions.additions.validate = true
M.permissions.cancellations.add.offset = -5
M.permissions.cancellations.restore = true
M.permissions.deletions.validate = true
M.permissions.deletions.reject = true
M.permissions.discards.validate = true
M.permissions.discards.reject = true
M.permissions.photos.target = true
M.permissions.targets_compliance.target = true
M.permissions.tech.target = true
M.permissions.wishes.reject = true
M.permissions.wishes.validate = true

return M
