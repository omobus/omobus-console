-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local validate = require 'validate'

local modules = {
	null 		= require 'roles.null',

	admins 		= require 'roles.admins',
	analitics 	= require 'roles.analitics',
	asm 		= require 'roles.asm',
	cdm 		= require 'roles.cdm',
	guests 		= require 'roles.guests',
	ise 		= require 'roles.ise',
	kam 		= require 'roles.kam',
	ksr 		= require 'roles.ksr',
	merch 		= require 'roles.merch',
	mr 		= require 'roles.mr',
	sr 		= require 'roles.sr',
	sv 		= require 'roles.sv',
	tme 		= require 'roles.tme'
    }

function M.get(id)
    if validate.isuid(id) then
	if modules[id] ~= nil then return modules[id] end
    end
    return modules.null
end

return M
