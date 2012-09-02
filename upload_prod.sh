#!/bin/bash

if [[ -z "$1" ]]; then
    echo "Usage: ./upload_prod.sh user@host"
    exit 1
fi

# Git push
echo "Committing local changes..."
git status
git add .
git commit
echo "Pushing to stachserver..."
git push stachserver master
echo "Pushing to GitHub..."
git push github master

# Build
./build.sh

# SFTP
#for i in $(seq 1 2) ; do

    if [ $i -eq 1 ]; then
        SUBDIR="www"
        VHOST="www.snakedemocracy.com"
    elif [ $i -eq 2 ]; then
        SUBDIR="www2"
        VHOST="www2.snakedemocracy.com"
    fi

    cd build/$SUBDIR/
    sftp -b ../../upload_prod.sftp $1:vhosts/$VHOST/htdocs/
    cd ../..

#done

# Git pull, repush
cd ../snakedemocracy.heroku
./publish.sh
#cd ../snakedemocracy2.no.de
#./publish.sh
