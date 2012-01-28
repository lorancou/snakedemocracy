// requires
var app = require("express").createServer();
var io = require("socket.io").listen(app);

// DIRTY don't try this at home
var fs = require('fs');
eval(fs.readFileSync('vec2.js')+'');

// global variables
var g_sockets = null;
var g_votes = null;
var g_snake = null;
var g_opinion = null;
var g_direction = null;

app.listen(80);

// serve index.html
app.get("/", function (req, res)
{
    res.sendfile(__dirname + "/index.html");
});

// serve client.js, vec2.js
app.get("/client.js", function (req, res)
{
    res.sendfile(__dirname + "/client.js");
});
app.get("/vec2.js", function (req, res)
{
    res.sendfile(__dirname + "/vec2.js");
});
app.get("/files/head.png", function (req, res)
{
    res.sendfile(__dirname + "/files/head.png");
});
app.get("/files/body.png", function (req, res)
{
    res.sendfile(__dirname + "/files/body.png");
});

// serve resource files
// https://github.com/visionmedia/express/blob/master/examples/downloads/app.js
// /files/* is accessed via req.params[0]
// but here we name it :file
/*app.get("/files/:file(*)", function(req, res, next){
  var file = req.params.file
    , path = __dirname + "/files/" + file;

  res.download(path);
});
// error handling middleware. Because it's
// below our routes, you will be able to
// "intercept" errors, otherwise Connect
// will respond with 500 "Internal Server Error".
app.use(function(err, req, res, next){
  // log all errors
  console.error(err.stack);

  // special-case 404s
  if (404 == err.status) {
    res.send("Cant find that file, sorry!");
  } else {
    next(err);
  }
});*/

g_sockets = new Array(); // do NOT put in init

function init()
{
    g_votes = new Array();
    g_snake = new Array();
    g_opinion = new vec2(0.0, -1.0);
    g_direction = "south";
}
init();

// client connection sockets
io.sockets.on("connection", function (socket)
{
    // push new socket
    g_sockets.push(socket);

    // log connection
    console.log("new client");
    socket.emit("ping", g_snake);

    // receive client message
    socket.on("message", function (_message)
    {
        console.log("processing message:" + _message.name + " (" + _message.value + ")");
        if (_message.name == "cheatTweet")
        {
            processTweet(socket, _message.value);
        }
        else if (_message.name == "cheatClear")
        {
            processClear(socket, _message.value);
        }
        else if (_message.name == "vote")
        {
            processVote(socket, _message.value);
        }
    });

    // disconnecting clients
    socket.on('disconnect', function()
    {
	    g_sockets = g_sockets.filter(function(s)
        {
	        return s != socket;
	    });
        console.log("bye bye client");
    });
});

function processClear(_socket, _value)
{
    console.log("clear!");
    init();

    var message = { name : "clear" };
    broadcast(message);
}

function processTweet(_socket, _value)
{
    var newHead;
    if (g_snake.length == 0)
    {
        // first tweet, spawn head in the middle
        console.log("spawn head");
        //g_snake.push();
        newHead = new vec2(10, 10);
    }
    else
    {
        // add head in current opinion's direction
        var head = g_snake[g_snake.length-1];
        var newHead = head.clone();
        console.log(g_opinion.x +","+g_opinion.y);
        var absX = Math.abs(g_opinion.x);
        var absY = Math.abs(g_opinion.y);
        console.log(absX +","+absY);
        if (absX > absY)
        {
            if (g_opinion.x > 0)
            {
                ++newHead.x;
                g_direction = "east";
            }
            else
            {
                --newHead.x;
                g_direction = "west";
            }
        }
        else
        {
            if (g_opinion.y > 0)
            {
                ++newHead.y;
                g_direction = "south";
            }
            else
            {
                --newHead.y;
                g_direction = "north";
            }
        }
    }
    g_snake.push(newHead);

    // broadcast new head
    var message = { name : "head", value : newHead };
    broadcast(message);

    // reset opinion
    g_votes = new Array();
    g_opinion.normalize();

    // broadcast it
    var message = { name : "opinion", value : g_opinion };
    broadcast(message);
}

function processVote(_socket, _value)
{
    // push/update client vote
	g_votes = g_votes.filter(function(v)
    {
	    //return v.socket != _socket;
        return true;
	});
    var vote = { socket : _socket, value : _value };
    g_votes.push(vote);

    // compute opinion
    console.log(g_votes.length)
    var numLeft = 0;
    var numForward = 0;
    var numRight = 0;
    var total = 0;
    g_opinion.x = 0.0;
    g_opinion.y = 0.0;
    for (var i=0; i<g_votes.length; i++)
    {
        var ivote = g_votes[i];
        if (ivote.value == "left") { ++numLeft; ++total; }
        else if (ivote.value == "forward") { ++numForward; ++total }
        else if (ivote.value == "right") { ++numRight; ++total }
        else console.log("ERROR: invalid vote: " + ivote.value);
    }
    console.log("left votes: " + numLeft);
    console.log("right votes: " + numRight);
    console.log("forward votes: " + numForward);
    if (g_direction == "east")
    {
        g_opinion.x = numForward;
        g_opinion.y = numRight - numLeft;
    }
    else if (g_direction == "west")
    {
        g_opinion.x = -numForward;
        g_opinion.y = numLeft - numRight;
    }
    else if (g_direction == "south")
    {
        g_opinion.x = numLeft - numRight;
        g_opinion.y = numForward;
    }
    else if (g_direction == "north")
    {
        g_opinion.x = numRight - numLeft;
        g_opinion.y -= numForward;
    }

    // broadcast it
    var message = { name : "opinion", value : g_opinion };
    broadcast(message);
}

function broadcast(_message)
{
    console.log("broadcasting: " + _message.name);
    for (var i=0; i<g_sockets.length; i++)
    {
        console.log("pouf");
        var s = g_sockets[i];
        console.log("broadcast: " + _message.name);
        s.emit("message", _message);
    }
}

