#!/bin/sh

# Clean
echo "Cleanup..."
rm -rf build
mkdir -p build

# Very complicated way to get the revision number, but works
REVISION=$(head -1 common.js | grep -oE "[[:digit:]]{1,}")
echo "Building revision $REVISION"

# Copy minified socket.io client (cached version)
cp depcache/socket.io.min.js build/socket.io.min.js

# Minify client
echo "// SnakeDemocracy client (c) 2012 Christophe Zerr, Alexis Moroz, Laurent Couvidou" > build/client.temp.js
cat vec2.js >> build/client.temp.js
cat common.js >> build/client.temp.js
cat client.js >> build/client.temp.js
#node_modules/uglify-js/bin/uglifyjs --unsafe -mt --lift-vars --overwrite build/client.min.js
node build.js
rm build/client.temp.js
mv build/client.min.js build/client.$REVISION.min.js

# Web distribs
for i in $(seq 0 2) ; do

    if [ $i -eq 0 ]; then
        SUBDIR="stachserver"
        SERVER="snakedemocracy.dyndns.org:3000"
    elif [ $i -eq 1 ]; then
        SUBDIR="www"
        SERVER="http://snakedemocracy.herokuapp.com"
        #SERVER="http://snakedemocracy2.no.de"
    elif [ $i -eq 2 ]; then
        SUBDIR="www2"
        #SERVER="http://snakedemocracy.herokuapp.com"
        SERVER="http://snakedemocracy2.no.de"
    fi

    # Create build/$SUBDIR/
    echo "Building build/$SUBDIR..."
    mkdir -p build/$SUBDIR

    # HTML
    cp index.html build/$SUBDIR/index.html
    sed -i "s#/socket.io/socket.io.js#socket.io.min.js#g" build/$SUBDIR/index.html
    sed -i 's#<script type="text/javascript" src="vec2.js"></script>#<!-- removed -->#g' build/$SUBDIR/index.html
    sed -i 's#<script type="text/javascript" src="common.js"></script>#<!-- removed -->#g' build/$SUBDIR/index.html
    sed -i "s#<script type=\"text/javascript\" src=\"client.js\"></script>#<script type=\"text/javascript\" src=\"client.$REVISION.min.js\"></script>#g" build/$SUBDIR/index.html
    sed -i "s#init()#init('$SERVER')#g" build/$SUBDIR/index.html
    cp faq.html build/$SUBDIR/faq.html
    cp about.html build/$SUBDIR/about.html
    cp channel.html build/$SUBDIR/channel.html

    # PHP
    cp highscores.php build/$SUBDIR/highscores.php
    
    # JS
    cp build/socket.io.min.js build/$SUBDIR/
    cp build/client.$REVISION.min.js build/$SUBDIR/

    # Assets
    mkdir -p build/$SUBDIR/files
    cp files/* build/$SUBDIR/files/

done

# Pokki distrib
echo "Building build/pokki..."
SERVER="http://snakedemocracy.herokuapp.com"
SUBDIR="pokki"
mkdir -p build/$SUBDIR
cp -r pokki/* build/$SUBDIR/
sed -i "s#client.REVISION.min.js#client.$REVISION.min.js#g" build/$SUBDIR/popup.html
mkdir -p build/$SUBDIR/files
cp files/* build/$SUBDIR/files/
cp build/socket.io.min.js build/$SUBDIR/js/
cp build/client.$REVISION.min.js build/$SUBDIR/js/
