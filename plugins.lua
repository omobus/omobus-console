-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local validate = require 'validate'

local modules = {
	null 			= require 'plugins.null',

	additions 		= require 'plugins.additions',
	advt 			= require 'plugins.advt',
	audits 			= require 'plugins.audits',
	cancellations 		= require 'plugins.cancellations',
	comments 		= require 'plugins.comments',
	confirmations 		= require 'plugins.confirmations',
	deletions 		= require 'plugins.deletions',
	discards 		= require 'plugins.discards',
	info_materials 		= require 'plugins.info_materials',
	joint_routes 		= require 'plugins.joint_routes',
	orders 			= require 'plugins.orders',
	photos 			= require 'plugins.photos',
	photos_archive 		= require 'plugins.photos_archive',
	planograms 		= require 'plugins.planograms',
	pos_materials 		= require 'plugins.pos_materials',
	posms 			= require 'plugins.posms',
	presentations 		= require 'plugins.presentations',
	prices 			= require 'plugins.prices',
	promos 			= require 'plugins.promos',
	quests 			= require 'plugins.quests',
	reclamations 		= require 'plugins.reclamations',
	route_compliance 	= require 'plugins.route_compliance',
	routes 			= require 'plugins.routes',
	scheduler 		= require 'plugins.scheduler',
	shelfs 			= require 'plugins.shelfs',
	stocks 			= require 'plugins.stocks',
	targets 		= require 'plugins.targets',
	targets_compliance 	= require 'plugins.targets_compliance',
	tech 			= require 'plugins.tech',
	testings 		= require 'plugins.testings',
	tickets 		= require 'plugins.tickets',
	training_materials 	= require 'plugins.training_materials',
	trainings 		= require 'plugins.trainings',
	wishes 			= require 'plugins.wishes'
    }

function M.get(id)
    if id ~= nil and validate.isuid(id) then
	if modules[id] ~= nil then return modules[id] end
    end
    return modules.null
end

return M
