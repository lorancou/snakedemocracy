#!/bin/sh

# Build
./build.sh

# SFTP
for i in $(seq 0 2) ; do

    if [ $i -eq 0 ]; then
        SUBDIR="www"
        VHOST="snakedemocracy.com"
    elif [ $i -eq 1 ]; then
        SUBDIR="www"
        VHOST="www.snakedemocracy.com"
    elif [ $i -eq 2 ]; then
        SUBDIR="www2"
        VHOST="www2.snakedemocracy.com"
    fi

    cd build/$SUBDIR/
    sftp -b ../../upload.sftp $1:vhosts/$VHOST/htdocs/
    cd ../..

done

# Git push
cd ../snakedemocracy.heroku
./publish.sh
cd ../snakedemocracy.no.de
./publish.sh
