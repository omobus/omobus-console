-- -*- Lua -*-
-- Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

local M = {} -- public interface

M.title		= "OMOBUS"
M.subtitle	= "management console"

-- *** LOGO
M.logo		= {
    auth	= "LOGO",
    main	= "" -- "<td width='110px'><img height='35px' src='/logo.png'></td>" 
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
	    attrs	= {"uid", "userPassword", "cn", "ErpId", "groupName", "dumpsStatus", "department", "country", "distributor", "agency"}
	}
    }
}

-- *** Session parameters ***
M.session	= {
    lifetime 	= 12,
    strict 	= false
}

-- *** PostgreSQL server parameters ***
M.data 		= {
    server	= "hostaddr=127.0.0.1 port=5432",
    storage	= "omobus-proxy-db",
    user	= "omobus",
    password	= "omobus"
}

-- *** LTS web-service parameters ***
M.ark 		= {
    host 	= "192.168.83.7",
    port 	= 8080,
    connect_timeout = 10,
    recv_timeout= 25, -- maximum timiout for waiting omobus-ark web service data
    send_timeout= 5,
    tls		= true,
    tokenid 	= 'b69570cb-0d78-41c1-8f2d-175c255e9ad8'
}

-- *** FTP server parameters ***
M.ftp 		= {
    host	= "127.0.0.1",
    port	= 21021,
    connect_timeout = 10,
    recv_timeout= 5,
    send_timeout= 5,
    epsv	= true,
    tls		= false,
    ccc		= false,
    cdc		= false
}

return M
