#!/bin/bash

version=$1

echo "Making js ugly."
for f in js/*.js ; do npm run uglifyjs -- --compress --mangle -o "$f" -- "$f" ; done

echo "Optimizing js."
# Header / Day-Night mode
npm run uglifyjs -- lib/js-cookie.js js/styleswitch.js js/navigation.js -o js/header.js -c -m
rm lib/js-cookie.js js/styleswitch.js js/navigation.js

find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e 's;lib/js-cookie.js;js/header.js;g' $line
        sed -n -i '/js\/styleswitch.js/!p' $line
        sed -n -i '/js\/navigation.js/!p' $line
    done

echo "Installing CDN."

sed -i 's/IS_DEPLOYED="undefined"/_IS_DEPLOYED='"\"${version}\""',IS_DEPLOYED="undefined"/g' js/utils.js

find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -n -i '/lib\/bootstrap.js/!p' $line
        sed -n -i '/lib\/droll.js/!p' $line
        sed -n -i '/lib\/jquery.js/!p' $line
        sed -n -i '/lib\/list.js/!p' $line
        sed -n -i '/lib\/elasticlunr.js/!p' $line
        sed -n -i '/lib\/ace.js/!p' $line
        sed -i -e '/<!--5ETOOLS_SCRIPT_ANCHOR-->/a <script type="text/javascript" src="https://cdn.jsdelivr.net/combine/npm/jquery@3.2/dist/jquery.min.js,npm/bootstrap@3.3/dist/js/bootstrap.min.js,npm/droll@0.2.1/droll.min.js,npm/list.js@1.5/dist/list.min.js,gh/weixsong/elasticlunr.js@0.9/elasticlunr.min.js,gh/ajaxorg/ace-builds@1.2/src-min/ace.js"><\/script>' $line
    done

find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
    	# FIXME temporarily disabled
        # sed -i -e 's;href="css/;href="https://static.5etools.com/css/;g' $line
        # sed -i -e 's;src="js/;src="https://static.5etools.com/js/;g' $line
        echo I must pay more attention in class
    done

find css -type f -name '*.css' -print0 |
    while IFS= read -r -d $'\0' line; do
    	# FIXME temporarily disabled
        # sed -i -e 's;../fonts/Convergence-Regular.ttf;https://static.5etools.com/fonts/Convergence-Regular.ttf;g' $line
        # sed -i -e 's;../fonts/glyphicons-halflings-regular.svg;https://static.5etools.com/fonts/glyphicons-halflings-regular.svg;g' $line
        # sed -i -e 's;../fonts/glyphicons-halflings-regular.eot;https://static.5etools.com/fonts/glyphicons-halflings-regular.eot;g' $line
        # sed -i -e 's;../fonts/glyphicons-halflings-regular.woff;https://static.5etools.com/fonts/glyphicons-halflings-regular.woff;g' $line
        # sed -i -e 's;../fonts/glyphicons-halflings-regular.ttf;https://static.5etools.com/fonts/glyphicons-halflings-regular.ttf;g' $line
        echo I must pay more attention in class
    done

echo "Installing Query Strings."
for file in js/*; do
    find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
for file in css/*; do
    find . -type f -name '*.html' -print0 |
    while IFS= read -r -d $'\0' line; do
        sed -i -e "s;$file;$file?v=${version};g" $line
    done
done
