# Copyright (c) 2006 - 2021 omobus-console authors, see the included COPYRIGHT file.

PACKAGE_NAME 	= omobus-console
PACKAGE_VERSION = 3.5.18
COPYRIGHT 	= Copyright (c) 2006 - 2021 ak obs, ltd. <info@omobus.net>
SUPPORT 	= Support and bug reports: <support@omobus.net>
AUTHOR		= Author: Igor Artemov <i_artemov@omobus.net>
BUGREPORT	= support@omobus.net
ETC_PATH 	= /etc/omobus-scgi.d/console

INSTALL		= install
RM		= rm -f
CP		= cp
CHOWN 		= chown

DISTR_NAME	= $(PACKAGE_NAME)-$(PACKAGE_VERSION)

all:
	@echo "$(PACKAGE_NAME) $(PACKAGE_VERSION)"

install:
	$(INSTALL) -d $(ETC_PATH)
	$(INSTALL) -m 0644 *.lua *.sh *.htm $(ETC_PATH)
	$(CP) -r plugins/ $(ETC_PATH)
	$(CP) -r roles/ $(ETC_PATH)
	$(CP) -r htdocs/ $(ETC_PATH)
	$(CHOWN) -v omobus:omobus $(ETC_PATH)
	$(CHOWN) -Rv omobus:omobus $(ETC_PATH)/*
	$(INSTALL) -m 0644 systemd/*.service /etc/systemd/system
	$(CHOWN) root:root /etc/systemd/system/omobus-console.service
