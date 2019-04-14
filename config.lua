-- -*- Lua -*-
-- Copyright (c) 2006 - 2019 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.title		= "OMOBUS"
M.subtitle	= "management console"

-- *** LOGO
M.logo		= {
    auth	= "LOGO",
    main	= ""
}

M.ca_file 	= "/OMOBUS_Root_Certification_Authority.pem"

-- *** LDAP server parameters ***
M.ldap		= {
    uri		= "ldap://127.0.0.1:389",
    bind_dn	= "uid=omobus-scgid,ou=services,dc=omobus,dc=local",
    bind_pw	= "0",
    tls		= false,
    search	= {
	user_credits = { 
	    base	= "ou=users,dc=omobus,dc=local",
	    scope 	= "subtree",
	    filter	= "(&(objectClass=omobusUser)(consoleStatus=enabled)(uid=%1))",
	    attrs	= {"uid", "userPassword", "cn", "ErpId", "groupName", "dumpsStatus", "distributor", "agency"}
	}
    }
}

-- *** Session parameters ***
M.session	= {
    lifetime 	= 12,
    strict 	= false
}

-- *** Storage parameters (PostgeSQL) ***
M.stor		= require 'stor_pgsql'
M.stor.server	= "hostaddr=127.0.0.1 port=5432"
M.stor.storage	= "omobus-proxy-db"
M.stor.user	= "omobus"
M.stor.password	= "omobus"
--#M.stor.ic_u2c	= require 'iconv'.new("utf-8", "windows-1251")
--#M.stor.ic_c2u	= require 'iconv'.new("windows-1251", "utf-8")

-- *** Storage parameters (Microsoft SQLServer) ***
--M.stor		= require 'stor_tds'
--M.stor.server	= "srv1"
--M.stor.storage	= "omobus-proxy-db"
--M.stor.user	= "omobus"
--M.stor.password	= "0"
--#M.stor.ic_uc	= require 'iconv'.new("utf-8", "windows-1251")
--#M.stor.ic_c2u= require 'iconv'.new("windows-1251", "utf-8")
--M.stor.freetdsconf= "/freetds.conf"

-- *** FTP server parameters ***
M.ftp 		= {
    host		= "127.0.0.1",
    port		= 21021,
    connect_timeout 	= 10,
    recv_timeout	= 5,
    send_timeout	= 5,
    epsv		= true,
    tls			= false,
    ccc			= false,
    cdc			= false
}

return M
