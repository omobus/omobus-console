-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Area Sales (or InStore) managers

M.home = "tech"
M.selectable = {
    reports = {
	daily = {"tech", "route_compliance"},
	monthly = {"joint_routes", "confirmations", "orders", "reclamations", "comments", "photos", "testings", "trainings", "presentations", "audits", "shelfs", "quests", "advt", "prices", "promos"}
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
    planograms 		= require 'roles.defs._ro',
    pos_materials 	= require 'roles.defs._ro',
    presentations 	= require 'roles.defs.presentations',
    prices 		= require 'roles.defs.prices',
    promos 		= require 'roles.defs.promos',
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
    trainings 		= require 'roles.defs.trainings',
    wishes 		= require 'roles.defs.wishes'
}

-- # extra permission:
M.permissions = require 'core'.deepcopy(M.permissions)
M.permissions.additions.reject = true
M.permissions.additions.validate = true
M.permissions.cancellations.add.offset = -5
M.permissions.cancellations.restore = true
M.permissions.deletions.validate = true
M.permissions.deletions.reject = true
M.permissions.discards.validate = true
M.permissions.discards.reject = true
M.permissions.photos.target = true
M.permissions.targets_compliance.remark = true
M.permissions.tech.target = true
M.permissions.wishes.reject = true
M.permissions.wishes.validate = true

return M
