#!/bin/sh

rsync -avzh --exclude-from=.rsyncignore ./ stachserver:/opt/snakedemocracy.test
ssh stachserver "cd /opt/snakedemocracy.test && ./build.sh"
ssh stachserver "cd /opt/snakedemocracy.test && rsync -avzh build/stachserver/ /var/www/snakedemocracy"
