-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Area Sales (or InStore) managers

M.home = "tech"
M.permissions = {
    null 		= { },

    additions 		= require 'roles.defs.additions',
    advt 		= require 'roles.defs.advt',
    audits 		= require 'roles.defs.audits',
    cancellations 	= require 'roles.defs.cancellations',
    checkups 		= require 'roles.defs.checkups',
    comments 		= require 'roles.defs.comments',
    confirmations 	= require 'roles.defs.confirmations',
    deletions 		= require 'roles.defs.deletions',
    discards 		= require 'roles.defs.discards',
    info_materials 	= require 'roles.defs.info_materials',
    joint_routes 	= require 'roles.defs.joint_routes',
    oos 		= require 'roles.defs.oos',
    orders 		= require 'roles.defs.orders',
    photos 		= require 'roles.defs.photos',
    photos_archive 	= require 'roles.defs.photos_archive',
    planograms 		= require 'roles.defs._ro',
    pos_materials 	= require 'roles.defs._ro',
    posms 		= require 'roles.defs.posms',
    presences 		= require 'roles.defs.presences',
    presentations 	= require 'roles.defs.presentations',
    prices 		= require 'roles.defs.prices',
    promos 		= require 'roles.defs.promos',
    quests 		= require 'roles.defs.quests',
    reclamations 	= require 'roles.defs.reclamations',
    route_compliance 	= require 'roles.defs.route_compliance',
    routes 		= require 'roles.defs.routes',
    scheduler 		= require 'roles.defs.scheduler',
    shelfs 		= require 'roles.defs.shelfs',
    stocks 		= require 'roles.defs.stocks',
    targets 		= require 'roles.defs.targets',
    targets_compliance 	= require 'roles.defs.targets_compliance',
    tech 		= require 'roles.defs.tech',
    testings 		= require 'roles.defs.testings',
    tickets 		= require 'roles.defs._ro',
    time 		= require 'roles.defs.time',
    training_materials 	= require 'roles.defs._ro',
    trainings 		= require 'roles.defs.trainings',
    wishes 		= require 'roles.defs.wishes'
}

-- # extra permission:
M.permissions = require 'core'.deepcopy(M.permissions)
M.permissions.additions.reject = true
M.permissions.additions.validate = true
M.permissions.cancellations.add.offset = -15
M.permissions.cancellations.restore = true
M.permissions.deletions.validate = true
M.permissions.deletions.reject = true
M.permissions.discards.validate = true
M.permissions.discards.reject = true
M.permissions.photos.target = true
M.permissions.photos.urgent = true
M.permissions.posms.target = true
M.permissions.posms.urgent = true
M.permissions.targets_compliance.remark = true
M.permissions.tech.target = true
M.permissions.tech.urgent = true
M.permissions.tech.zstatus = true
M.permissions.wishes.reject = true
M.permissions.wishes.validate = true

return M
