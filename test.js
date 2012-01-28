var app = require('express').createServer();
var io = require('socket.io').listen(app);
var express = require('express');

app.listen(80);

app.get('/', function (req, res)
{
    console.log("get");
    res.sendfile(__dirname + '/index.html');
});

/*app.get('/client.js', function (req, res)
{
    console.log("client");
    res.sendfile(__dirname + '/client.js');
});*/

//var socket = io.listen(app);
io.sockets.on('connection', function (socket) {
    console.log("connection");
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
  });
});
