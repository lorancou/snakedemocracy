#!/bin/sh

# create distrib/web/
echo "Building distrib/web..."
mkdir -p distrib/web
cp index.html distrib/web/index.html
sed -i "s#/socket.io/socket.io.js#'http://snakedemocracy.herokuapp.com/socket.io/socket.io.js'#g" distrib/web/index.html
sed -i "s#/vec2.js#'http://snakedemocracy.herokuapp.com/vec2.js'#g" distrib/web/index.html
sed -i "s#/common.js#'http://snakedemocracy.herokuapp.com/common.js'#g" distrib/web/index.html
sed -i "s#/client.js#'http://snakedemocracy.herokuapp.com/client.js'#g" distrib/web/index.html
sed -i "s#init()#init(http://snakedemocracy.herokuapp.com/)#g" distrib/web/index.html
cp faq.html distrib/web/faq.html
#cp about.html distrib/web/about.html
mkdir -p distrib/web/files
cp files/* distrib/web/files/
