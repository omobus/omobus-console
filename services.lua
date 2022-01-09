-- -*- Lua -*-
-- Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local validate = require 'validate'

local modules = {
	photo 		= require 'services.photo',
	thumb 		= require 'services.thumb'
    }

function M.get(id)
    if validate.isuid(id) then
	if modules[id] ~= nil then return modules[id] end
    end
    return nil
end

return M
