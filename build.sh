#!/bin/sh

# Clean
echo "Cleanup..."
rm -rf build

# Create build/www/
echo "Building build/www..."
mkdir -p build/www

# HTML
cp index.html build/www/index.html
sed -i "s#/socket.io/socket.io.js#http://snakedemocracy.herokuapp.com/socket.io/socket.io.js#g" build/www/index.html
sed -i "s#vec2.js#http://snakedemocracy.herokuapp.com/vec2.js#g" build/www/index.html
sed -i "s#common.js#http://snakedemocracy.herokuapp.com/common.js#g" build/www/index.html
sed -i "s#client.js#http://snakedemocracy.herokuapp.com/client.js#g" build/www/index.html
sed -i "s#init()#init('http://snakedemocracy.herokuapp.com/')#g" build/www/index.html
cp faq.html build/www/faq.html
#cp about.html build/www/about.html

# PHP
cp highscores.php build/www/highscores.php

# Assets
mkdir -p build/www/files
cp files/* build/www/files/

# Create build/www2/
echo "Building build/www2..."
mkdir -p build/www2

# HTML
cp index.html build/www2/index.html
sed -i "s#/socket.io/socket.io.js#http://snakedemocracy2.no.de/socket.io/socket.io.js#g" build/www2/index.html
sed -i "s#vec2.js#http://snakedemocracy2.no.de/vec2.js#g" build/www2/index.html
sed -i "s#common.js#http://snakedemocracy2.no.de/common.js#g" build/www2/index.html
sed -i "s#client.js#http://snakedemocracy2.no.de/client.js#g" build/www2/index.html
sed -i "s#init()#init('http://snakedemocracy2.no.de/')#g" build/www2/index.html
cp faq.html build/www2/faq.html
#cp about.html build/www2/about.html

# PHP
cp highscores.php build/www2/highscores.php

# Assets
mkdir -p build/www2/files
cp files/* build/www2/files/

# Create build/pokki/
echo "Building build/pokki..."
mkdir -p build/pokki

# Copy pokki files
cp -r pokki/* build/pokki/
