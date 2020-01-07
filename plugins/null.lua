-- -*- Lua -*-
-- Copyright (c) 2006 - 2020 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

local mime = require 'mime'
local scgi = require 'scgi'


-- *** plugin interface: begin
function M.scripts(lang, permtb, sestb, params)
    return nil
end

function M.startup(lang, permtb, sestb, params, stor)
    return nil
end

function M.ajax(lang, method, permtb, sestb, params, content, content_type, stor, res)
    scgi.writeHeader(res, 200, {["Content-Type"] = mime.json .. "; charset=utf-8"})
    scgi.writeBody(res, "{}")
end
-- *** plugin interface: end

return M
