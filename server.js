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
var g_apples = null;
var g_opinion = null;
var g_direction = null;
var g_state = null;
var g_moveDelay = 2000;
var g_pauseDelay = 10000;
var g_pendingGrow = false;
var g_moveTimeoutHandle = null;
var g_pauseTimeoutHandle = null;

// global constants
var AREA_SIZE = 20;
var STARTUP_APPLE_COUNT = 3;

app.listen(80);

// serve index.html
app.get("/", function (req, res)
{
    res.sendfile(__dirname + "/index.html");
});

// serve stuff
// meh. public folder?...
app.get("/client.js", function (req, res)
{
    res.sendfile(__dirname + "/client.js");
});
app.get("/vec2.js", function (req, res)
{
    res.sendfile(__dirname + "/vec2.js");
});
/*app.get("/files/head.png", function (req, res)
{
    res.sendfile(__dirname + "/files/head.png");
});
app.get("/files/body.png", function (req, res)
{
    res.sendfile(__dirname + "/files/body.png");
});*/

// serve resource files
// https://github.com/visionmedia/express/blob/master/examples/downloads/app.js
// /files/* is accessed via req.params[0]
// but here we name it :file
app.get("/files/:file(*)", function(req, res, next){
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
});

g_sockets = new Array(); // do NOT put in init

function init()
{
    g_votes = new Array();
    g_snake = new Array();
    g_apples = new Array();

    g_opinion = {};
    g_opinion.current = "forward";
    g_opinion.numLeft = 0;
    g_opinion.numRight = 0;
    g_opinion.numForward = 0;

    g_direction = "south";
    g_state = { name : "init" };
    g_pendingGrow = false;

    // start first game
    startGame();
}
init();

// client connection sockets
io.sockets.on("connection", function (socket)
{
    // push new socket
    g_sockets.push(socket);

    // log connection
    console.log("new client");
    socket.emit("ping", { snake : g_snake, apples : g_apples, state : g_state });

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
        else if (_message.name == "moveDelayChange")
        {
            processMoveDelayChange(socket, _message.value);
        }
        else if (_message.name == "pauseDelayChange")
        {
            processPauseDelayChange(socket, _message.value);
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

// start game session
function startGame()
{
    console.log("start game!");

    // start with 3 elements
    // TODO: random?
    g_snake = new Array();
    g_snake.push(new vec2(10, 10));
    g_snake.push(new vec2(10, 11));
    g_snake.push(new vec2(10, 12));

    // start with some random apples
    g_apples = new Array();
    spawnApple(STARTUP_APPLE_COUNT, false);

    // "unlock" clients, time to play and vote!!
    g_state = { name : "playing", snake : g_snake, apples : g_apples };
    broadcast(g_state);
    
    // plan next move
    planNextMove();
}

function planNextMove()
{
    console.log("plan next move, delay: " + g_moveDelay);

    if (g_moveDelay > 0)
    {
        if (g_moveTimeoutHandle)
        {
            clearTimeout(g_moveTimeoutHandle);
            g_moveTimeoutHandle = null;
        }
        g_moveTimeoutHandle = setTimeout(move, g_moveDelay);
    }
}

function planNextGame()
{
    console.log("plan next game, delay: " + g_pauseDelay);

    // cancel upcoming move
    clearTimeout(g_moveTimeoutHandle);
    g_moveTimeoutHandle = null;
    
    if (g_pauseDelay > 0)
    {
        if (g_pauseTimeoutHandle)
        {
            clearTimeout(g_pauseTimeoutHandle);
            g_pauseTimeoutHandle = null
        }
        g_pauseTimeoutHandle = setTimeout(startGame, g_pauseDelay);
    }
}

function processClear(_socket, _value)
{
    console.log("clear!");
    init();

    var message = { name : "clear" };
    broadcast(message);
}

function checkSelf(_newHead)
{
    // all *except* current head
    for (var i=1; i<g_snake.length; ++i)
    {
        if (_newHead.x == g_snake[i].x &&
            _newHead.y == g_snake[i].y)
        {
            //console.log(i);
            return true;
        }
    }
}

function checkVictory(_newHead)
{
    if (g_snake.length > 0)
    {
        if (_newHead.x == g_snake[0].x &&
            _newHead.y == g_snake[0].y)
        {
            return true;
        }
    }
}

function processTweet(_socket, _value)
{
    // TODO
    console.log("tweet");
    //move();
    g_pendingGrow = true;
}

function move()
{
    console.log("move!");

    var newHead;
    if (g_snake.length == 0)
    {
        // first tweet, spawn head in the middle
        console.log("spawn head");
        //g_snake.push();
        newHead = new vec2(10, 10);

        startGame();
    }
    else
    {
        // "remove" tail
        console.log("pending grow: " + g_pendingGrow);
        console.log("snake: " + g_snake);
        if (!g_pendingGrow)
        {
            g_snake.shift();
        }
        console.log("new snake: " + g_snake);

        // add head in current opinion's direction
        var head = g_snake[g_snake.length-1];
        var newHead = head.clone();
        //console.log(g_opinion.x +","+g_opinion.y);
        //var absX = Math.abs(g_opinion.x);
        //var absY = Math.abs(g_opinion.y);
        //console.log(absX +","+absY);

        // set new direction
        if (g_direction == "east")
        {
            if (g_opinion.current == "left") g_direction = "north";
            if (g_opinion.current == "right") g_direction = "south";
        }
        else if (g_direction == "west")
        {
            if (g_opinion.current == "left") g_direction = "south";
            if (g_opinion.current == "right") g_direction = "north";
        }
        else if (g_direction == "south")
        {
            if (g_opinion.current == "left") g_direction = "east";
            if (g_opinion.current == "right") g_direction = "west";
        }
        else // north
        {
            if (g_opinion.current == "left") g_direction = "west";
            if (g_opinion.current == "right") g_direction = "east";
        }

        // set new head position
        if (g_direction == "east")
        {
            ++newHead.x;
        }
        else if (g_direction == "west")
        {
            --newHead.x;
        }
        else if (g_direction == "south")
        {
            ++newHead.y;
        }
        else // north
        {
            --newHead.y;
        }
    }

    //console.log(newHead);

    // check area bounds
    if (newHead.x < 0 ||
        newHead.y < 0 ||
        newHead.x >= AREA_SIZE ||
        newHead.y >= AREA_SIZE)
    {
        // broadcast defeat
        var message = { name : "defeat", value : "out" };
        broadcast(message);
        g_state = message;

        // plan next game
        planNextGame();
    }
    // check self-hit
    else if (checkSelf(newHead))
    {
        // broadcast defeat
        var message = { name : "defeat", value : "self" };
        broadcast(message);
        g_state = message;

        // plan next game
        planNextGame();
    }
    // check victory
    else if (checkVictory(newHead))
    {
        // broadcast victory
        var message = { name : "victory", value : g_snake.length };
        broadcast(message);
        g_state = message;

        // plan next game
        planNextGame();
    }
    else
    {
        // broadcast move
        if (g_pendingGrow)
        {
            g_pendingGrow = false;
            var message = { name : "grow", value : newHead };
            broadcast(message);
        }
        else
        {
            var message = { name : "move", value : newHead };
            broadcast(message);
        }

        // reset opinion
        g_votes = new Array();
        g_opinion = {};
        g_opinion.current = "forward";
        g_opinion.numLeft = 0;
        g_opinion.numRight = 0;
        g_opinion.numForward = 0;
        
        // broadcast it
        var message = { name : "opinion", value : g_opinion };
        broadcast(message);

        // check for apples pickup
        for (var a=0; a<g_apples.length; ++a)
        {
            if (g_apples[a].x == newHead.x &&
                g_apples[a].y == newHead.y)
            {
                pickupApple(a);
                spawnApple(1, true);
                g_pendingGrow = true;
                break; // 2+ apples at the same spot shouln't not happen. normally.
            }
        }

        // plan next move
        planNextMove();
    }

    // push new head
    g_snake.push(newHead);
}

function processMoveDelayChange(_socket, _value)
{
    console.log("changed move delay: " + _value);
    g_moveDelay = _value;
}
function processPauseDelayChange(_socket, _value)
{
    console.log("changed pause delay: " + _value);
    g_pauseDelay = _value;
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
    //console.log(g_votes.length)
    var numLeft = 0;
    var numForward = 0;
    var numRight = 0;
    var total = 0;
    //g_opinion.x = 0.0;
    //g_opinion.y = 0.0;
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

    var max = Math.max(numLeft, numRight, numForward);
    if (max == numForward || numLeft == numRight)
    {
        g_opinion.current = "forward";
    }
    else if (max == numLeft)
    {
        g_opinion.current = "left";
    }
    else
    {
        g_opinion.current = "right";
    }

    // broadcast it
    var message = { name : "opinion", value : g_opinion };
    broadcast(message);
}

function spawnApple(_count, _broadcast)
{
    // collect available slots
    var slots = new Array();
    for (var x=0; x<AREA_SIZE; ++x)
    {
        for (var y=0; y<AREA_SIZE; ++y)
        {
            // snake here?
            var snakeStandsHere = false;
            for (var i=0; i<g_snake.length; ++i)
            {
                if (g_snake[i].x == x && g_snake[i].y == y)
                {
                    snakeStandsHere = true;
                    break;
                }
            }

            // apple here?
            var appleStandsHere = false;
            for (var i=0; i<g_apples.length; ++i)
            {
                if (g_apples[i].x == x && g_apples[i].y == y)
                {
                    appleStandsHere = true;
                    break;
                }
            }

            if (!(snakeStandsHere || appleStandsHere))
            {
                slots.push(new vec2(x, y));
            }
        }
    }

    // spawn _count apples
    for (var a=0; a<_count; ++a)
    {
        if (slots.length == 0)
        {
            break;
        }

        // pick a random slot
        var idx = Math.floor(Math.random()*(slots.length+1));
        g_apples.push(slots[idx]);
        
        // broadcast spawn
        if (_broadcast)
        {
            var message = { name : "spawn", value : "apple", position : slots[idx] };
            broadcast(message);
        }

        // remove slot from array
        slots.splice(idx, 1); 
    }
}

function pickupApple(_idx)
{
    // remove apple, broadcast
    g_apples.splice(_idx, 1);
    var message = { name : "pickup", value : "apple", idx : _idx };
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

