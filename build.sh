#!/bin/sh

# create distrib/web/
echo "Building distrib/web..."
mkdir -p distrib/web

# HTML
cp index.html distrib/web/index.html
sed -i "s#/socket.io/socket.io.js#http://snakedemocracy.herokuapp.com/socket.io/socket.io.js#g" distrib/web/index.html
sed -i "s#vec2.js#http://snakedemocracy.herokuapp.com/vec2.js#g" distrib/web/index.html
sed -i "s#common.js#http://snakedemocracy.herokuapp.com/common.js#g" distrib/web/index.html
sed -i "s#client.js#http://snakedemocracy.herokuapp.com/client.js#g" distrib/web/index.html
sed -i "s#init()#init('http://snakedemocracy.herokuapp.com/')#g" distrib/web/index.html
cp faq.html distrib/web/faq.html
#cp about.html distrib/web/about.html

# JavaScript
cp client.js distrib/web/client.js
sed -i 's#var SERVER_ADDRESS = "/";#var SERVER_ADDRESS = "http://snakedemocracy.herokuapp.com/";#g' distrib/web/client.js
cp common.js distrib/web/common.js
cp vec2.js distrib/web/vec2.js

# Assets
mkdir -p distrib/web/files
cp files/* distrib/web/files/
