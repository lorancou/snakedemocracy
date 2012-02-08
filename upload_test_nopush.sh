#!/bin/sh

# rsync to server
rsync -avzh --exclude-from=.rsyncignore ./ stachserver:/opt/snakedemocracy.test

# build on server
ssh stachserver "cd /opt/snakedemocracy.test && ./build.sh"

# copy www build to Apache server directory
ssh stachserver "cd /opt/snakedemocracy.test && rsync -avzh build/stachserver/ /var/www/snakedemocracy"

# bring build back
rsync -avzh --delete stachserver:/opt/snakedemocracy.test/build .
