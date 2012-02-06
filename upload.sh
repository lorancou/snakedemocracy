#!/bin/sh

# Web distribs
for i in $(seq 0 2) ; do

    if (($i == 0)); then
        SUBDIR="www"
        VHOST="snakedemocracy.com"
    elif (($i == 1)); then
        SUBDIR="www"
        VHOST="www.snakedemocracy.com"
    elif (($i == 2)); then
        SUBDIR="www2"
        VHOST="www2.snakedemocracy.com"
    fi

    cd build/$SUBDIR/
    sftp -b ../../upload.sftp $1:vhosts/$VHOST/htdocs/
    cd ../..

done
