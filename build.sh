#!/bin/sh

# Clean
echo "Cleanup..."
rm -rf build
mkdir -p build

# Copy minified socket.io client
cp depcache/socket.io.min.js build/socket.io.min.js

# Minify client
echo "// SnakeDemocracy client (c) 2012 Christophe Zerr, Alexis Moroz, Laurent Couvidou" > build/client.min.js
cat vec2.js >> build/client.min.js
cat common.js >> build/client.min.js
cat client.js >> build/client.min.js
node_modules/uglify-js/bin/uglifyjs --unsafe -mt --lift-vars --overwrite build/client.min.js

# Web distribs
for i in $(seq 0 2) ; do

    if [ $i -eq 0 ]; then
        SUBDIR="stachserver"
        SERVER="snakedemocracy.dyndns.org:3000"
    elif [ $i -eq 1 ]; then
        SUBDIR="www"
        SERVER="http://snakedemocracy2.no.de"
    elif [ $i -eq 2 ]; then
        SUBDIR="www2"
        SERVER="http://snakedemocracy.herokuapp.com"
    fi

    # Create build/$SUBDIR/
    echo "Building build/$SUBDIR..."
    mkdir -p build/$SUBDIR

    # HTML
    cp index.html build/$SUBDIR/index.html
    sed -i "s#/socket.io/socket.io.js#socket.io.min.js#g" build/$SUBDIR/index.html
    sed -i 's#<script type="text/javascript" src="vec2.js"></script>#<!-- removed -->#g' build/$SUBDIR/index.html
    sed -i 's#<script type="text/javascript" src="common.js"></script>#<!-- removed -->#g' build/$SUBDIR/index.html
    sed -i 's#<script type="text/javascript" src="client.js"></script>#<script type="text/javascript" src="client.min.js"></script>#g' build/$SUBDIR/index.html
    sed -i "s#init()#init('$SERVER')#g" build/$SUBDIR/index.html
    cp faq.html build/$SUBDIR/faq.html

    # PHP
    cp highscores.php build/$SUBDIR/highscores.php
    
    # JS
    cp build/socket.io.min.js build/$SUBDIR/
    cp build/client.min.js build/$SUBDIR/

    # Assets
    mkdir -p build/$SUBDIR/files
    cp files/* build/$SUBDIR/files/

done

# Pokki distrib
echo "Building build/pokki..."
mkdir -p build/pokki
cp -r pokki/* build/pokki/
mkdir -p build/pokki/files
cp files/* build/pokki/files/
