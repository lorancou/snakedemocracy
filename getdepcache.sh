#!/bin/sh

# Clean
echo "Cleanup..."
rm -rf depcache
mkdir -p depcache

# Get minified socket.io client
# This assumes there's a development server running on localhost
wget http://localhost:3000/socket.io/socket.io.js -O depcache/socket.io.min.js
