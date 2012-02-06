#!/bin/sh

# Clean
echo "Cleanup..."
rm -rf build

# Web distribs
for i in $(seq 0 1) ; do

    if (($i == 0)); then
        SUBDIR="www"
        SERVER="http://snakedemocracy2.no.de"
    elif (($i == 1)); then
        SUBDIR="www2"
        SERVER="http://snakedemocracy.herokuapp.com"
    fi

    # Create build/$SUBDIR/
    echo "Building build/$SUBDIR..."
    mkdir -p build/$SUBDIR

    # HTML
    cp index.html build/$SUBDIR/index.html
    #sed -i "s#/socket.io/socket.io.js#$SERVER/socket.io/socket.io.js#g" build/$SUBDIR/index.html
    sed -i "s#/socket.io/socket.io.js#socket.io.js#g" build/$SUBDIR/index.html
    #sed -i "s#vec2.js#$SERVER/vec2.js#g" build/$SUBDIR/index.html
    #sed -i "s#common.js#$SERVER/common.js#g" build/$SUBDIR/index.html
    #sed -i "s#client.js#$SERVER/client.js#g" build/$SUBDIR/index.html
    sed -i "s#init()#init('$SERVER')#g" build/$SUBDIR/index.html
    cp faq.html build/$SUBDIR/faq.html
    #cp about.html build/$SUBDIR/about.html

    # PHP
    cp highscores.php build/$SUBDIR/highscores.php
    
    # JS
    cp socket.io.js build/$SUBDIR/
    cp vec2.js build/$SUBDIR/
    cp common.js build/$SUBDIR/
    cp client.js build/$SUBDIR/

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
