-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.home = "tech"
M.permissions = {
    null 		= {},

    additions 		= require 'roles.defs.additions',
    audits 		= require 'roles.defs.audits',
    cancellations 	= require 'roles.defs.cancellations',
    checkups 		= require 'roles.defs.checkups',
    comments 		= require 'roles.defs.comments',
    confirmations 	= require 'roles.defs.confirmations',
    contacts 		= require 'roles.defs.contacts',
    deletions 		= require 'roles.defs.deletions',
    discards 		= require 'roles.defs.discards',
    info_materials 	= require 'roles.defs.info_materials',
    joint_routes 	= require 'roles.defs.joint_routes',
    oos 		= require 'roles.defs.oos',
    orders 		= require 'roles.defs.orders',
    photos 		= require 'roles.defs.photos',
    photos_archive 	= require 'roles.defs.photos_archive',
    planograms 		= require 'roles.defs.planograms',
    pos_materials 	= require 'roles.defs.pos_materials',
    posms 		= require 'roles.defs.posms',
    presences 		= require 'roles.defs.presences',
    presentations 	= require 'roles.defs.presentations',
    prices 		= require 'roles.defs.prices',
    promos 		= require 'roles.defs.promos',
    quests 		= require 'roles.defs.quests',
    quests_results 	= require 'roles.defs.quests_results',
    reclamations 	= require 'roles.defs.reclamations',
    route_compliance 	= require 'roles.defs.route_compliance',
    routes 		= require 'roles.defs.routes',
    scheduler 		= require 'roles.defs.scheduler',
    shelfs 		= require 'roles.defs.shelfs',
    stocks 		= require 'roles.defs.stocks',
    targets 		= require 'roles.defs.targets',
    targets_compliance 	= require 'roles.defs.targets_compliance',
    tech 		= require 'roles.defs.tech',
    tickets 		= require 'roles.defs.tickets',
    time 		= require 'roles.defs.time',
    training_materials 	= require 'roles.defs.training_materials',
    trainings 		= require 'roles.defs.trainings',
    unsched 		= require 'roles.defs.unsched',
    whereis 		= require 'roles.defs.whereis',
    wishes 		= require 'roles.defs.wishes'
}

-- # extra permission:
M.permissions = require 'core'.deepcopy(M.permissions)
M.permissions.additions.data.rejected = true
M.permissions.additions.reject = true
M.permissions.additions.validate = true
M.permissions.cancellations.add.offset = -5
M.permissions.cancellations.restore = true
M.permissions.confirmations.remark = true
M.permissions.deletions.validate = true
M.permissions.deletions.reject = true
M.permissions.deletions.data.rejected = true
M.permissions.deletions.data.closed = true
M.permissions.discards.validate = true
M.permissions.discards.reject = true
M.permissions.discards.data.rejected = true
M.permissions.discards.data.closed = true
M.permissions.info_materials.remove = true
M.permissions.info_materials.edit = true
M.permissions.photos.target = true
M.permissions.photos.urgent = true
M.permissions.planograms.remove = true
M.permissions.planograms.edit = true
M.permissions.pos_materials.remove = true
M.permissions.pos_materials.edit = true
M.permissions.posms.target = true
M.permissions.posms.urgent = true
M.permissions.quests_results.edit = true
M.permissions.quests_results.eraseEverything = true
M.permissions.quests_results.remove = true
M.permissions.routes.inprogress = true
M.permissions.targets.remove = true
M.permissions.targets.edit = true
M.permissions.targets_compliance.remark = true
M.permissions.training_materials.remove = true
M.permissions.training_materials.edit = true
M.permissions.tech.target = true
M.permissions.tech.urgent = true
M.permissions.tech.zstatus.granted = 'yes'
M.permissions.wishes.data.rejected = true
M.permissions.wishes.data.closed = true
M.permissions.wishes.reject = true
M.permissions.wishes.validate = true

return M
