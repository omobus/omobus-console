#!/bin/sh

PREFIX=/etc/omobus-scgi.d/console
SVCVERSION=`grep version $PREFIX/version.lua | grep '= "3' | cut -d '=' -f 2 | sed -e 's/ //g' | sed -e 's/"//g'`
WWW=/var/www/htdocs
HTDOCS=$WWW/console/$SVCVERSION
APKS=$WWW/apk
mkdir -m 755 -p $HTDOCS
#chown omobus:omobus $HTDOCS
cp -auvrp $PREFIX/htdocs/* $HTDOCS
cp -auvp $PREFIX/*.png $WWW || :
cp -auvp $PREFIX/*.ico $WWW || :
cp -auvp $PREFIX/*.webmanifest $WWW || :
cp -auvp $PREFIX/index.htm $WWW || :
cp -auvp $PREFIX/robots.txt $WWW || :
mkdir -m 755 -p $APKS
cp -afvp $PREFIX/apks.htm $APKS/index.htm || :
cp -auvp $PREFIX/apks.css $APKS/index.css || :
rm $APKS/*.apk || :
cp -auvp /var/lib/omobus.d/data/core/omobus-droid-3.5.*.apk $APKS || :
chmod 0644 $APKS/omobus-droid-3.5.*.apk
droid=$(ls $APKS | grep 'omobus-droid-3\.5\.[a-z0-9_-]*\.apk')
sed -i -e 's/omobus-droid.apk/'$droid'/g' $APKS/index.htm
query="select \"paramText\"('srv:domain')"
domain=$(echo $query | su omobus -c "/usr/local/libexec/pgsql-9.6/bin/psql -d omobus-proxy-db -At")
sed -i -e 's/xxx.omobus.net/'$domain'/g' $APKS/index.htm
