var http = require('http');
var io = require('socket.io');
var express = require('express');

var tweets = 0;

if (process.argv.length != 4) {
    console.log("usage: node ./server.js login password");
    process.exit();
}

var app = express.createServer(express.logger({
    stream: require('fs').WriteStream('/tmp/kilopede-access.log')
}));
//app.use(express.staticProvider(__dirname + '/')); 
app.use(express.bodyDecoder());

app.listen(1024);

var clients = [];

// socket.io 
var socket = io.listen(app); 
socket.on('connection', function(client){ 

    clients.push(client);
	console.log("new client");

    client.on('message', function(){
    }) 

    client.on('disconnect', function(){
	clients = clients.filter(function(c) {
	    console.log("bye bye client");
	    return c != client;
	});
    }) 
}); 


var username = process.argv[2];
var password = process.argv[3];
var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');


var options = {
    host: 'stream.twitter.com',
    port: 80,
    path: '/1/statuses/filter.json',
    headers : {'Host': 'stream.twitter.com', 
	       'Authorization': auth,
	       'Content-type': 'application/x-www-form-urlencoded'},
    method: "POST"
};


console.dir(options);

var buf = "";

var req = http.request(options, function(res) {
    //  console.log('STATUS: ' + res.statusCode);
    //  console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
	buf += chunk;
	var a = buf.split("\r\n");
	buf = a[a.length-1];

	for(var i=0; i < a.length-1; i++) {
	    if (a[i] != "") {
		var json = JSON.parse(a[i]);
		if (json.user && json.text) {
		    console.log(json.user.screen_name, " : ", json.text)
		    tweets++;
		    for(var j=0; j<clients.length; j++) {
			clients[j].send(a[i]);
		    }
		}
	    } else {
		console.log("-- empty line --");
	    }
	}
    });
});

//req.write("track=TokioHotel,Bieber\n\n");
req.write("track=fukushima\n\n");
req.end();

setInterval(function() {
    // no tweet = quit                                                                                                                         
    if (tweets == 0) {
	console.log("No tweets for the last 10 seconds, restarting...");
	process.exit(0);
    } else {
	console.log(tweets+" tweets during the last 10 seconds...");
        tweets = 0;
    }

}, 10000);
