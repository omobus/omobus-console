-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Trade marketing executive

M.home = "confirmations"
M.selectable = {
    reports = {
	daily = {"tech", "route_compliance"},
	monthly = {"confirmations", "comments", "photos", "audits", "shelfs", "quests", "advt", "prices"}
    },
    analitics = {"targets_compliance"},
    managment = {"targets", "deletions", "info_materials", "pos_materials", "planograms"},
    archive = {"photos_archive"}
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
M.permissions.photos.target = true
M.permissions.targets_compliance.target = true
M.permissions.tech.target = true

return M
