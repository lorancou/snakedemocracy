#!/bin/sh

# Build
./build.sh

# Sync
rsync -avzh build/stachserver/ stachserver:/var/www/snakedemocracy
rsync -avzh --exclude-from=.rsyncignore ./ stachserver:/opt/snakedemocracy.test
