#!/bin/sh

# Git push
echo "Committing local changes..."
git status
git add .
git commit
echo "Pushing to stachserver..."
git push stachserver master

# Build
./build.sh

# Sync
rsync -avzh build/stachserver/ stachserver:/var/www/snakedemocracy
#rsync -avzh --exclude-from=.rsyncignore ./ stachserver:/opt/snakedemocracy.test
