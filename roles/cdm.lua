-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

-- *** Customer development manager

M.home = "tech"
M.permissions = {
    null 	= { },

    advt 		= require 'roles.defs.advt',
    checkups 		= require 'roles.defs.checkups',
    comments 		= require 'roles.defs.comments',
    confirmations 	= require 'roles.defs.confirmations',
    joint_routes 	= require 'roles.defs.joint_routes',
    oos 		= require 'roles.defs.oos',
    orders 		= require 'roles.defs.orders',
    photos 		= require 'roles.defs.photos',
    posms 		= require 'roles.defs.posms',
    presences 		= require 'roles.defs.presences',
    presentations 	= require 'roles.defs.presentations',
    prices 		= require 'roles.defs.prices',
    promos 		= require 'roles.defs.promos',
    quests 		= require 'roles.defs.quests',
    reclamations 	= require 'roles.defs.reclamations',
    route_compliance 	= require 'roles.defs.route_compliance',
    shelfs 		= require 'roles.defs.shelfs',
    stocks 		= require 'roles.defs.stocks',
    targets_compliance 	= require 'roles.defs.targets_compliance',
    tech 		= require 'roles.defs.tech',
    tickets 		= require 'roles.defs._ro',
    time 		= require 'roles.defs.time',
    trainings 		= require 'roles.defs.trainings'
}

return M
