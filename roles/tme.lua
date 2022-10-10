-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Trade marketing executive

M.home = "tech"
M.permissions = {
    null 		= { },

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
    reclamations 	= require 'roles.defs.reclamations',
    scheduler 		= require 'roles.defs.scheduler',
    shelfs 		= require 'roles.defs.shelfs',
    stocks 		= require 'roles.defs.stocks',
    targets 		= require 'roles.defs.targets',
    targets_compliance 	= require 'roles.defs.targets_compliance',
    tech 		= require 'roles.defs.tech',
    tickets 		= require 'roles.defs._ro',
    time 		= require 'roles.defs.time',
    training_materials 	= require 'roles.defs.training_materials',
    trainings 		= require 'roles.defs.trainings',
    unsched 		= require 'roles.defs.unsched',
    wishes 		= require 'roles.defs.wishes'
}

-- # extra permission:
M.permissions = require 'core'.deepcopy(M.permissions)
M.permissions.confirmations.remark = true
M.permissions.photos.target = true
M.permissions.photos.urgent = true
M.permissions.posms.target = true
M.permissions.posms.urgent = true
M.permissions.targets_compliance.remark = true
M.permissions.tech.target = true
M.permissions.tech.urgent = true

return M
