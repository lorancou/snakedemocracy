#!/bin/sh

# create build/web/
echo "building build/web..."
rm -rf build/web
mkdir -p build/web

# HTML
cp index.html build/web/index.html
sed -i "s#/socket.io/socket.io.js#http://snakedemocracy.herokuapp.com/socket.io/socket.io.js#g" build/web/index.html
sed -i "s#vec2.js#http://snakedemocracy.herokuapp.com/vec2.js#g" build/web/index.html
sed -i "s#common.js#http://snakedemocracy.herokuapp.com/common.js#g" build/web/index.html
sed -i "s#client.js#http://snakedemocracy.herokuapp.com/client.js#g" build/web/index.html
sed -i "s#init()#init('http://snakedemocracy.herokuapp.com/')#g" build/web/index.html
cp faq.html build/web/faq.html
#cp about.html build/web/about.html

# PHP
cp highscores.php build/web/highscores.php

# Assets
mkdir -p build/web/files
cp files/* build/web/files/
