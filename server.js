// usage
if (process.argv.length != 4)
{
    console.error("Wrong number of arguments");
    console.log("Usage: node ./server.js login password");
    process.exit(1);
}

// requires
var http = require("http");
var https = require("https");
var app = require("express").createServer();
var io = require("socket.io").listen(app);

// configure socket.io for production
io.configure("production", function(){
    io.enable("browser client minification");  // send minified client
    io.enable("browser client etag");          // apply etag caching logic based on version number
    io.enable("browser client gzip");          // gzip the file
    io.set("force new connection", false);     // no spam bots BULLSHIT: this just doesn't work :(
    io.set("log level", 0);                    // no logging
});

// configure socket.io for production
io.configure("development", function(){
    io.set("force new connection", true);      // allow spam bots
    io.set("log level", 0);                    // no logging
});
    
// DIRTY don't try this at home
var fs = require("fs");
eval(fs.readFileSync("vec2.js")+"");
eval(fs.readFileSync("common.js")+"");

// global variables
var g_sockets = null;
var g_votes = null;
var g_snake = null;
var g_apples = null;
var g_opinion = null;
var g_direction = null;
var g_state = null;
var g_turn = 0;
var g_move = 0;
var g_moveDelay = 2000;
var g_failDelay = 7000;
var g_victoryDelay = 15000;
var g_pendingGrow = false;
var g_moveTimeoutHandle = null;
var g_pauseTimeoutHandle = null;
var g_opinionTimeoutHandle = null;
var g_snakeLengthCache = -1;
var g_playerCountCache = null;
var g_tweets = 0;
var g_test = (process.env.NODE_ENV == "development");//(process.argv.length==5) && (process.argv[4]=="test");

// global constants
var STARTUP_APPLE_COUNT = 3;
var MEM_SEPUKU = 300; // MB, set to 0 to disable

//app.listen(80);
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.vlog("Listening on " + port);
});

// serve *.html
app.get("/", function (req, res)
{
    res.sendfile(__dirname + "/index.html");
});
app.get("/faq", function (req, res)
{
    res.sendfile(__dirname + "/faq.html");
});
/*app.get("/credits", function (req, res)
{
    res.sendfile(__dirname + "/credits.html");
});*/
    
// serve cheats page on test server only
if (g_test)
{
    app.get("/cheat", function (req, res)
    {
        res.sendfile(__dirname + "/cheat.html");
    });
}

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

// bytes to MB
function toMB(_bytes)
{
    if (!_bytes) return "N/A";
    return Math.floor(_bytes / (1024 * 1024));
}

// verbose log
console.vlog = function()
{
    var memUsage = process.memoryUsage();
    var rss = toMB(memUsage.rss);
    var heapTotal = toMB(memUsage.heapTotal);
    var heapUsed = toMB(memUsage.heapUsed);

    var newArgs = new Array();
    newArgs.push(
        "SD [rss:" + rss + "MB|" +
        "heap:" + heapUsed + "/" + heapTotal + "MB|" +
        "s:" + g_sockets.length + "]"
        );
    for (var i=0; i<arguments.length; ++i)
    {
        newArgs.push(arguments[i]);
    }
    this.log.apply(this, newArgs);
}

g_sockets = new Array(); // do NOT put in init

function init()
{
    if (g_test)
    {
        console.vlog("Init: development mode");
    }
    else
    {
        console.vlog("Init: production mode");
    }
    
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
    g_turn = 0;
    g_move = 0;
    g_pendingGrow = false;

    // clear timeouts
    clearMoveTimeout();
    clearPauseTimeout();
    clearOpinionBroadcast();
    
    // start first turn
    startTurn();
}

init();

function reportAbuse(_address, _message)
{
    if (g_test)
    {
        return;
    }
    
    console.warn("ABUSE: " + _address);
    console.dir(_message);
}

function setClientState(_socket, _newState)
{
    if (_socket.clientState == _newState)
    {
        return;
    }

    if (_socket.clientState == "idle")
    {
        // re-send ping
        _socket.emit("message", { name : "backping", snake : g_snake, apples : g_apples, state : g_state, move : g_move });
    }
    
    _socket.clientState = _newState;
}

// client connection sockets
io.sockets.on("connection", function (socket)
{
    var address = socket.handshake.address.address;
    
    // push new socket
    if (g_sockets.indexOf(socket) == -1)
    {
        g_sockets.push(socket);

        // log connection, send current state
        console.vlog("New client: ", address);
        socket.emit("ping", { snake : g_snake, apples : g_apples, state : g_state });
        socket.clientState = "active";
        socket.votesThisMove = 0;
        socket.lastVoteMove = 0;
    }

    // receive client message
    socket.on("message", function (_message)
    {
        //console.vlog("MESSAGE:" + _message.name + " (" + _message.value + ")");
        if (_message.name == "vote")
        {
            // set client as active, remember vote move
            setClientState(socket, "active");
            socket.lastVoteMove = g_move;
            
            if (_message.move == g_move) // ignore votes for previous move (net lag)
            {
                processVote(socket, _message.value);
            }
        }
    });

    // receive idle on / off messages
    socket.on("idle", function (_message)
    {
        console.vlog("IDLE: ", address);
        setClientState(socket, "idle");
    });
    socket.on("back", function (_message)
    {
        console.vlog("BACK: ", address);
        setClientState(socket, "spectator");
    });

    // those messages are processed with a TEST server only -- you could
    // try sending those to a prod server but you don't want to get banned, do
    // you?
    socket.on("testmsg", function (_message)
    {
        if (!g_test)
        {
            reportAbuse(address, _message);
        }
        else if (_message.name == "cheatTweet")
        {
            processTweet("cheat", "cheat");
        }
        else if (_message.name == "cheatRestart")
        {
            processRestart(socket, _message.value);
        }
        else if (_message.name == "cheatKill")
        {
            processKill();
        }
        else if (_message.name == "moveDelayChange")
        {
            processMoveDelayChange(socket, _message.value);
        }
        else if (_message.name == "failDelayChange")
        {
            processFailDelayChange(socket, _message.value);
        }
        else if (_message.name == "victoryDelayChange")
        {
            processVictoryDelayChange(socket, _message.value);
        }
        else if (_message.name == "mem")
        {
            var memUsage = process.memoryUsage();
            var text = "mem: <br/>";
            text += "rss: " + toMB(memUsage.rss) + "MB<br/>";
            text += "heap: " + toMB(memUsage.heapUsed) + "/" + toMB(memUsage.heapTotal) + "MB<br/>";
            socket.emit("testmsg", { name : "mem", text : text });
        }
    });
    
    // disconnecting clients
    socket.on("disconnect", function()
    {
	    g_sockets = g_sockets.filter(function(s)
        {
	        return s != socket;
	    });
        console.vlog("Bye bye client: ", address);
    });
});

// start one turn
function startTurn()
{
    ++g_turn;
    
    console.vlog("Starting game!");

    // start with 3 elements
    g_snake = new Array();
    g_snake.push(new vec2(10, 10));
    g_snake.push(new vec2(10, 11));
    g_snake.push(new vec2(10, 12));

    // start with some random apples
    g_apples = new Array();
    spawnApple(STARTUP_APPLE_COUNT, false);

    // fix that infinite victory loop. so long!
    g_direction = "south";

    // "unlock" clients, time to play and vote!!
    g_state = { name : "playing", snake : g_snake, apples : g_apples };
    broadcast(g_state);
    
    // plan next move
    planNextMove();
    
    // plan next opinion broadcast
    planNextOpinionBroadcast();
}

function clearMoveTimeout()
{
    if (g_moveTimeoutHandle)
    {
        clearTimeout(g_moveTimeoutHandle);
        g_moveTimeoutHandle = null;
    }
}

function planNextMove()
{
    console.vlog("Planning next move, delay: " + g_moveDelay);

    if (g_moveDelay > 0)
    {
        clearMoveTimeout();
        g_moveTimeoutHandle = setTimeout(move, g_moveDelay);
    }

    var activePlayerCount = 0;
    var playerCOunt = g_sockets.length;
    
    // clear vote counts + detect spectators
    for (var i=0; i<g_sockets.length; i++)
    {
        var s = g_sockets[i];
        s.votesThisMove = 0;
        
        // spectator check
        var dmove = g_move - s.lastVoteMove;
        if (dmove > SPECTATOR_THRESHOLD)
        {
            setClientState(s, "spectator");
        }
        
        // count active players
        if (s.clientState == "active")
        {
            ++activePlayerCount;
        }
    }

    // player counter:
    // - active clients in big letters
    // - spectators + idle clients in small letters
    g_playerCountCache = activePlayerCount + " <small>/ " + playerCOunt + "</small>";
}

function clearPauseTimeout()
{
    if (g_pauseTimeoutHandle)
    {
        clearTimeout(g_pauseTimeoutHandle);
        g_pauseTimeoutHandle = null
    }
}

function planNextTurn(_victory)
{
    var delay = _victory ? g_victoryDelay : g_failDelay;
     
    console.vlog("Planning next turn, delay: " + delay);

    // cancel upcoming move & opinion broadcast
    clearMoveTimeout();
    clearOpinionBroadcast();
    
    if (delay > 0)
    {
        clearPauseTimeout();
        g_pauseTimeoutHandle = setTimeout(startTurn, delay);
    }

    // clear vote markers
    for (var i=0; i<g_sockets.length; i++)
    {
        var s = g_sockets[i];
        s.lastVoteMove = 0;
    }
}

function clearOpinionBroadcast()
{
    if (g_opinionTimeoutHandle)
    {
        clearTimeout(g_opinionTimeoutHandle);
        g_opinionTimeoutHandle = null
    }
}

function planNextOpinionBroadcast()
{
    g_opinionTimeoutHandle = setTimeout(opinionBroadcast, 400);
}

// TODO: this should probably go in a worker thread or a separate process to
// reduce server load. Maybe.
function opinionBroadcast()
{
    var message = { name : "opinion", value : g_opinion };
    broadcast(message);
    planNextOpinionBroadcast();
}

function processKill()
{
    console.vlog("Dying.");
    process.exit(0);
}

function processRestart(_socket, _value)
{
    console.vlog("Restart!");
    init();
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

function processTweet(_screenName, _text)
{
    console.vlog("Tweet from " + _screenName, ": ", _text)
	g_tweets++;
}

function move()
{
    ++g_move;
    
    var score = computeScore();
    console.vlog("Move! Current score: " + score);

    // cache this, as it's "wrong" when broadcasting
    g_snakeLengthCache = g_snake.length;

    var newHead;
    if (g_snake.length == 0)
    {
        // first tweet, spawn head in the middle
        //console.log("spawn head");
        //g_snake.push();
        newHead = new vec2(10, 10);

        startTurn();
    }
    else
    {
        // "remove" tail
        //console.log("pending grow: " + g_pendingGrow);
        //console.log("snake: " + g_snake);
        if (!g_pendingGrow)
        {
            g_snake.shift();
        }
        //console.log("new snake: " + g_snake);

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
        // broadcast fail
        var message = { name : "fail", value : "out" };
        broadcast(message);
        g_state = message;

        // plan next turn
        planNextTurn(false);
    }
    // check self-hit
    else if (checkSelf(newHead))
    {
        // broadcast fail
        var message = { name : "fail", value : "self" };
        broadcast(message);
        g_state = message;

        // plan next turn
        planNextTurn(false);
    }
    // check victory
    else if (checkVictory(newHead))
    {
        // broadcast victory
        var message = { name : "victory", value : g_snake.length };
        broadcast(message);
        g_state = message;

        // plan next turn
        planNextTurn(true);
    }
    else
    {
        // broadcast move
        if (g_pendingGrow)
        {
            g_pendingGrow = false;
            var message = { name : "grow", move : g_move, value : newHead };
            broadcast(message);
        }
        else
        {
            var message = { name : "move", move : g_move, value : newHead };
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
        //var message = { name : "opinion", value : g_opinion };
        //broadcast(message);
        // => done when the "move" or "grow" event is received

        // check for apples pickup
        for (var a=0; a<g_apples.length; ++a)
        {
            if (g_apples[a]) // CRASHFIX? callback hell?
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
        }

        // check for apples from Twitter (+broadcast)
        if (g_tweets > 0)
        {
            spawnApple(g_tweets, true);
            g_tweets = 0;
        }

        // plan next move
        planNextMove();
    }

    // push new head
    g_snake.push(newHead);

    g_snakeLengthCache = -1;
    
    // check memory, sepuku if taking too much (Heroku won't kill the server by
    // itself but il will *restart* it, yey!)
    if (MEM_SEPUKU > 0)
    {
        var rssMB = toMB(process.memoryUsage().rss);
        if (rssMB > MEM_SEPUKU)
        {
            console.error("Eating too much memory. Sepuku!");
            process.exit(2);
        }
    }
}

function processMoveDelayChange(_socket, _value)
{
    console.vlog("Changed move delay: " + _value);
    g_moveDelay = _value;
}
function processFailDelayChange(_socket, _value)
{
    console.vlog("Changed fail delay: " + _value);
    g_failDelay = _value;
}
function processVictoryDelayChange(_socket, _value)
{
    console.vlog("Changed victory delay: " + _value);
    g_victoryDelay = _value;
}

function processVote(_socket, _value)
{
    ++_socket.votesThisMove;
    if (_socket.votesThisMove > MAX_VOTES_PER_MOVE)
    {
        var address = _socket.handshake.address.address;
        reportAbuse(address, "Extra vote, total " + _socket.votesThisMove);
        return;
    }
    
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
    g_opinion.numLeft = 0;
    g_opinion.numForward = 0;
    g_opinion.numRight = 0;
    //var total = 0;
    //g_opinion.x = 0.0;
    //g_opinion.y = 0.0;
    for (var i=0; i<g_votes.length; i++)
    {
        var ivote = g_votes[i];
        if (ivote.value == "left") { ++g_opinion.numLeft; }
        else if (ivote.value == "forward") { ++g_opinion.numForward; }
        else if (ivote.value == "right") { ++g_opinion.numRight; }
        else console.vlog("ERROR: invalid vote: " + ivote.value);
    }
    //console.log("left votes: " + g_opinion.numLeft);
    //console.log("right votes: " + g_opinion.numRight);
    //console.log("forward votes: " + g_opinion.numForward);

    var max = Math.max(g_opinion.numLeft, g_opinion.numRight, g_opinion.numForward);
    if (max == g_opinion.numForward || g_opinion.numLeft == g_opinion.numRight)
    {
        g_opinion.current = "forward";
    }
    else if (max == g_opinion.numLeft)
    {
        g_opinion.current = "left";
    }
    else // max == g_opinion.numRight
    {
        g_opinion.current = "right";
    }

    // broadcast opinion
    //var message = { name : "opinion", value : g_opinion };
    //broadcast(message);
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
                if (g_apples[i]) // CRASH FIX :/
                {
                    if (g_apples[i].x == x && g_apples[i].y == y)
                    {
                        appleStandsHere = true;
                        break;
                    }
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
        var idx = Math.floor(Math.random()*slots.length);
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

function computeScore()
{
    var snakeLength = 3;
    if (g_snake)
    {
        if (g_snakeLengthCache != -1)
        {
            snakeLength = g_snakeLengthCache;
        }
        else
        {
            snakeLength = g_snake.length;
        }
    }
    else
    {
        console.vlog("ERROR: computing score without a snake");
    }

    var playerCount = 0;
    if (g_sockets)
    {
        playerCount = g_sockets.length;
    }
    else
    {
        console.vlog("ERROR: computing score without sockets table");
    }

    var score = snakeLength * playerCount;
    //console.log("Score: " + score + "(snake: " + snakeLength + " * " + playerCount + ")");
    return score;
}

function broadcast(_message)
{
    // any time a message is broadcasted, append the number of players...
    _message.playerCount = g_playerCountCache;

    // and the current score
    _message.score = computeScore();

    // actually broadcast
    //console.log("BROADCAST: " + _message.name);
    for (var i=0; i<g_sockets.length; i++)
    {
        // *NEVER* spoil bandwidth for idle clients
        var s = g_sockets[i];
        if (s.clientState != "idle")
        {
            s.emit("message", _message);
        }
    }
}

// TWITTER

var username = process.argv[2];
var password = process.argv[3];

var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");


var options = {
    host: "stream.twitter.com",
    port: 443,
    path: "/1/statuses/filter.json",
    headers : {"Host": "stream.twitter.com", 
	       "Authorization": auth,
	       "Content-type": "application/x-www-form-urlencoded"},
    method: "POST"
};

// start receiving tweets
var buf = "";
var req = https.request(options, function(res) {
    //  console.log("STATUS: " + res.statusCode);
    //  console.log("HEADERS: " + JSON.stringify(res.headers));
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
	buf += chunk;
	var a = buf.split("\r\n");
	buf = a[a.length-1];

	for(var i=0; i < a.length-1; i++) {
	    if (a[i] != "") {
		    var json = JSON.parse(a[i]);
		    if (json.user && json.text) {
                processTweet(json.user.screen_name, json.text);
		    }
	    }
	}
    });
});
req.write("track=#snakedemocracy\n\n");
req.end();
