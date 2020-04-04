#!/bin/sh

PREFIX=/etc/omobus-scgi.d/console
SVCVERSION=`grep version $PREFIX/version.lua | grep '= "3' | cut -d '=' -f 2 | sed -e 's/ //g' | sed -e 's/"//g'`
WWW=/var/www/htdocs
HTDOCS=$WWW/console/$SVCVERSION
mkdir -m 755 -p $HTDOCS
#chown omobus:omobus $HTDOCS
cp -auvrp $PREFIX/htdocs/* $HTDOCS
cp -auvp $PREFIX/*.png $WWW || :
cp -auvp $PREFIX/*.ico $WWW || :
cp -auvp $PREFIX/*.webmanifest $WWW || :
cp -auvp $PREFIX/*.htm $WWW || :
cp -auvp $PREFIX/robots.txt $WWW || :
