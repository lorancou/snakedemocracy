/*
 * server.js
 * -----------------------------------------------------------------------------
 * 
 * SnakeDemocracy
 * LEFT. RIGHT. VOTE.
 * Copyright © 2012 Christophe Zerr, Alexis Moroz, Laurent Couvidou.
 * Contact: snakedemocracy@gmail.com
 *
 * This program is free software - see README for details.
 */
 
// usage
if (process.argv.length != 4)
{
    console.error("Wrong number of arguments");
    console.log("Usage: node ./server.js username password");
    process.exit(1);
}

var username = process.argv[2];
var password = process.argv[3];

// requires
var http = require("http");
var app = require("express").createServer();
var io = require("socket.io").listen(app);
var twitter = require("./server_twitter.js");
var scores = require("./server_scores.js");
var mailer = require("./server_mailer.js");

// configure socket.io for production
io.configure("production", function(){
    io.disable("browser client");              // served via main server
    io.set("force new connection", false);     // no spam bots NO EFFECT :(
    io.disable("force new connection");        // no spam bots NO EFFECT :(
    io.set("log level", 0);                    // no logging
});

// configure socket.io for development
io.configure("development", function(){
    io.enable("browser client");               // served locally
    io.enable("browser client minification");  // send minified client
    io.enable("browser client etag");          // apply etag caching logic based on version number
    io.enable("browser client gzip");  
    io.set("force new connection", true);      // allow spam bots NO EFFECT :(
    io.enable("force new connection");         // allow spam bots NO EFFECT :(
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
var g_score = 0;
var g_turn = 0;
var g_move = 0;
var g_moveDelay = MOVE_DELAY;
var g_failDelay = FAIL_DELAY;
var g_victoryDelay = VICTORY_DELAY;
var g_pendingGrow = 0;
var g_moveTimeoutHandle = null;
var g_pauseTimeoutHandle = null;
var g_opinionTimeoutHandle = null;
var g_snakeLengthCache = -1;
var g_activePlayerCount = 0;
var g_spectatorCount = 0;
var g_sleepCount = 0;
var g_idleCount = 0;
var g_tweets = 0;
var g_test = (process.env.NODE_ENV == "development");
var g_lightBroadcastMarker = 0;
var g_lightBroadcastTimeoutHandle = null;
var g_highscores = { bestEver: 0, weeksBest: 0, todaysBest: 0 };

// global constants
var STARTUP_APPLE_COUNT = 5;
var GROW_PER_APPLE = 5;
var MEM_SEPPUKU = 300; // MB, set to 0 to disable
var SPECTATOR_THRESHOLD = 10; // in snake moves
var SLEEP_THRESHOLD = 100; // in snake moves
var CLIENT_TIMEOUT = 1000; // in snake moves

//app.listen(80);
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.vlog("Listening on " + port);
});

// init twitter module
var twitusername = username;
if (g_test)
{
    twitusername += "t";                       // use test account otherwise
                                               // this "disconnects" the prod
                                               // server and tweet for apples no
                                               // longer work!
}
twitter.run(twitusername, password, processTweet);

// init scores module
var conString = process.env.DATABASE_URL;      // Heroku sets this for us
if (typeof conString === "undefined") // TODO: helper function to determine whether a variable is null or undefined or...
{
    conString = "tcp://" +                     // access pg through TCP
                username + ":" + password +    // authentication
                "@localhost/snakedemocracy"    // assumes there's already a db
                                               // and that it's local
}
scores.run(conString, g_highscores);

// init mailer module
mailer.run(conString, username, password, g_highscores);

// serve redirect page in prod
if (!g_test)
{
    app.get("/", function (req, res)
    {
        res.sendfile(__dirname + "/redirect.html");
    });
}
// serve HTML and assets only on test server
else
{
    // serve *.html
    app.get("/", function (req, res)
    {
        res.sendfile(__dirname + "/index.html");
    });
    app.get("/index.html", function (req, res)
    {
        res.sendfile(__dirname + "/index.html");
    });
    app.get("/faq.html", function (req, res)
    {
        res.sendfile(__dirname + "/faq.html");
    });
    app.get("/about.html", function (req, res)
    {
        res.sendfile(__dirname + "/about.html");
    });
    app.get("/cheat.html", function (req, res)
    {
        res.sendfile(__dirname + "/cheat.html");
    });

    // serve scripts
    app.get("/client.js", function (req, res)
    {
        res.sendfile(__dirname + "/client.js");
    });
    app.get("/vec2.js", function (req, res)
    {
        res.sendfile(__dirname + "/vec2.js");
    });
    app.get("/common.js", function (req, res)
    {
        res.sendfile(__dirname + "/common.js");
    });

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
}

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
        "SD [rss:" + rss + "MB|" +                      // rss
        "heap:" + heapUsed + "/" + heapTotal + "MB|" +  // heap
        "a:" + g_activePlayerCount + "|" +              // active
        "s:" + g_spectatorCount + "|" +                 // spectators
        "b:" + g_sleepCount + "|" +                     // sleep (b for bed)
        "i:" + g_idleCount + "]"                        // idle
        );
    for (var i=0; i<arguments.length; ++i)
    {
        newArgs.push(arguments[i]);
    }
    this.log.apply(this, newArgs);
}

g_sockets = new Array(); // do NOT put in init

function initGame()
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
    g_opinion.current = OP_FORWARD;
    g_opinion.numLeft = 0;
    g_opinion.numRight = 0;
    g_opinion.numForward = 0;

    g_direction = SOUTH;
    g_state = GS_INIT;
    g_turn = 0;
    g_move = 0;
    g_pendingGrow = 0;

    // clear timeouts
    clearMoveTimeout();
    clearPauseTimeout();
    clearOpinionBroadcast();
    clearIdleBroadcast();
    
    // start first turn
    startTurn();
    
    // start broadcasting player count to sleeping & idle players
    lightBroadcast();
}

initGame();

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
    
    if (_newState == CS_SPECTATOR)
    {
        _socket.emit(MSG_CLIENTSTATE, CS_SPECTATOR);
    }
    else if (_newState == CS_SLEEP)
    {
        _socket.emit(MSG_CLIENTSTATE, CS_SLEEP);
    }
    else if (_newState == CS_IDLE)
    {
        _socket.emit(MSG_CLIENTSTATE, CS_IDLE);
    }
    
    if ((_socket.clientState == CS_IDLE && _newState != CS_SLEEP) ||
        (_socket.clientState == CS_SLEEP && _newState != CS_IDLE))
    {
        // back ping, the client will set itself as active when received
        console.log("Gnark: "+ mailer.subscribersCount);
        _socket.emit(MSG_PING, { revision: REVISION, state: g_state, score: g_score, snake: g_snake, apples: g_apples, move: g_move, highscores: g_highscores, subscribersCount: mailer.getSubscribersCount() });
        _socket.lastVoteMove = g_move;
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
        console.log("Gnirk: "+ mailer.subscribersCount);
        socket.emit(MSG_PING, { revision: REVISION, state: g_state, score: g_score, snake: g_snake, apples: g_apples, move: g_move, highscores: g_highscores, subscribersCount: mailer.getSubscribersCount() });
        socket.clientState = CS_ACTIVE;
        socket.votesThisMove = 0;
        socket.lastVoteMove = g_move;
    }

    // receive client message
    socket.on(MSG_MESSAGE, function (_message)
    {
        //console.vlog("MESSAGE: " + _message.name + " (" + _message.value + ")");
        if (_message.name == MSGN_VOTE)
        {
            // set client as active, remember vote move
            setClientState(socket, CS_ACTIVE);
            socket.lastVoteMove = g_move;
            
            if (_message.move == g_move) // ignore votes for previous move (net lag)
            {
                processVote(socket, _message.value, _message.elector);
            }
        }
        else
        {
            reportAbuse(address, _message);
        }
    });

    // idle/back
    socket.on(MSG_IDLE, function (_message)
    {
        console.vlog("Client idle: ", address);
        setClientState(socket, CS_IDLE);
    });
    socket.on(MSG_BACK, function (_message)
    {
        console.vlog("Client back: ", address);
        setClientState(socket, CS_ACTIVE);
    });

    // those messages are processed with a TEST server only -- you could
    // try sending those to a prod server but you don't want to get banned, do
    // you?
    socket.on(MSG_TESTMSG, function (_message)
    {
        if (!g_test)
        {
            reportAbuse(address, _message);
        }
        else if (_message.name == TMSGN_CHEATTWEET)
        {
            processTweet("cheat", "cheat");
        }
        else if (_message.name == TMSGN_RESTART)
        {
            processRestart(socket, _message.value);
        }
        else if (_message.name == TMSGN_KILL)
        {
            processKill();
        }
        else if (_message.name == TMSGN_MOVEDELAY)
        {
            processMoveDelayChange(socket, _message.value);
        }
        else if (_message.name == TMSGN_FAILDELAY)
        {
            processFailDelayChange(socket, _message.value);
        }
        else if (_message.name == TMSGN_VICTORYDELAY)
        {
            processVictoryDelayChange(socket, _message.value);
        }
        else if (_message.name == TMSGN_MEM)
        {
            var memUsage = process.memoryUsage();
            var text = "mem: <br/>";
            text += "rss: " + toMB(memUsage.rss) + "MB<br/>";
            text += "heap: " + toMB(memUsage.heapUsed) + "/" + toMB(memUsage.heapTotal) + "MB<br/>";
            socket.emit(MSG_TESTMSG, { name : TMSGN_MEM, text : text });
        }
    });
    
    // disconnecting clients
    socket.on(MSG_DISCONNECT, function()
    {
	    g_sockets = g_sockets.filter(function(s)
        {
	        return s != socket;
	    });
        console.vlog("Bye bye client: ", address);
    });
    
    // mailer registering
    socket.on(MSG_MAILER_REGISTER, function(_message)
    {
        mailer.register(_message.f, _message.e, _message.t);
    });
});

// start one turn
function startTurn()
{
    ++g_turn;
    
    console.vlog("Starting game!");

    // start with 3 elements
    g_snake = new Array();
    var startX = 0;
    for (var y=0; y<10; ++y)
    {
        g_snake.push(new vec2(startX, y));
    }

    // start with some random apples
    g_apples = new Array();
    spawnApple(STARTUP_APPLE_COUNT, null);
    
    g_pendingGrow = 0;

    // fix that infinite victory loop. so long!
    g_direction = SOUTH;

    // reset opinion
    g_opinion = {};
    g_opinion.current = OP_FORWARD;
    g_opinion.numLeft = 0;
    g_opinion.numRight = 0;
    g_opinion.numForward = 0;

    // "unlock" clients, time to play and vote!!
    g_state = GS_PLAYING;
    var message = { name: MSGN_NEWSTATE, state : g_state, snake : g_snake, apples : g_apples };
    broadcast(message);
    
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

    // clear vote counts + detect spectators + count active players
    g_activePlayerCount = 0;
    g_spectatorCount = 0;
    g_sleepCount = 0;
    g_idleCount = 0;
    for (var i=0; i<g_sockets.length; i++)
    {
        var s = g_sockets[i];
        s.votesThisMove = 0;
        
        // spectator check
        var dmove = g_move - s.lastVoteMove;
        if (s.clientState == CS_ACTIVE)
        {
            if (dmove > SPECTATOR_THRESHOLD)
            {
                console.vlog("Client spectates: ", s.handshake.address.address);
                setClientState(s, CS_SPECTATOR);
            }
        }
        else if (s.clientState == CS_SPECTATOR)
        {
            if (dmove > SLEEP_THRESHOLD)
            {
                console.vlog("Client sleeps: ", s.handshake.address.address);
                setClientState(s, CS_SLEEP);
            }
        }
        else if (s.clientState == CS_SLEEP || s.clientState == CS_IDLE)
        {
            if (dmove > CLIENT_TIMEOUT)
            {
                console.vlog("Client timeout: ", s.handshake.address.address);
                s.disconnect();
                s.clientState = CS_DOWN;
            }
        }
        
        // count active players & spectators
        if (s.clientState == CS_ACTIVE) ++g_activePlayerCount;
        else if (s.clientState == CS_SPECTATOR) ++g_spectatorCount;
        else if (s.clientState == CS_SLEEP) ++g_sleepCount;
        else if (s.clientState == CS_IDLE) ++g_idleCount;
    }
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
    var message = { name : MSGN_OPINION, value : g_opinion };
    broadcast(message);
    planNextOpinionBroadcast();
}

function clearIdleBroadcast()
{
    g_lightBroadcastMarker = 0;
    if (g_lightBroadcastTimeoutHandle)
    {
        clearTimeout(g_lightBroadcastTimeoutHandle);
        g_lightBroadcastTimeoutHandle = null
    }
}

function lightBroadcast()
{
    if (g_lightBroadcastMarker < g_sockets.length)
    {
        var cs = g_sockets[g_lightBroadcastMarker].clientState;
        if (cs == CS_SLEEP || cs == CS_IDLE)
        {
            g_sockets[g_lightBroadcastMarker].emit(
                MSG_MESSAGE,
                {
                    name : MSGN_LIGHTBROADCAST,
                    activePlayerCount : g_activePlayerCount,
                    totalPlayerCount : g_sockets.length
                }
            );
        }
    }
    
    if (g_sockets.length > 0)
    {
        g_lightBroadcastMarker = (g_lightBroadcastMarker+1) % g_sockets.length;
    }
    g_lightBroadcastTimeoutHandle = setTimeout(lightBroadcast, 666.667);
}

function processKill()
{
    console.vlog("Dying.");
    process.exit(0);
}

function processRestart(_socket, _value)
{
    console.vlog("Restart!");
    initGame();
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
    
    g_score = computeScore(false);

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
        if (g_pendingGrow == 0)
        {
            g_snake.shift();
        }

        // add head in current opinion's direction
        var head = g_snake[g_snake.length-1];
        var newHead = head.clone();
        //console.log(g_opinion.x +","+g_opinion.y);
        //var absX = Math.abs(g_opinion.x);
        //var absY = Math.abs(g_opinion.y);
        //console.log(absX +","+absY);

        // set new direction
        if (g_direction == EAST)
        {
            if (g_opinion.current == OP_LEFT) g_direction = NORTH;
            if (g_opinion.current == OP_RIGHT) g_direction = SOUTH;
        }
        else if (g_direction == WEST)
        {
            if (g_opinion.current == OP_LEFT) g_direction = SOUTH;
            if (g_opinion.current == OP_RIGHT) g_direction = NORTH;
        }
        else if (g_direction == SOUTH)
        {
            if (g_opinion.current == OP_LEFT) g_direction = EAST;
            if (g_opinion.current == OP_RIGHT) g_direction = WEST;
        }
        else // north
        {
            if (g_opinion.current == OP_LEFT) g_direction = WEST;
            if (g_opinion.current == OP_RIGHT) g_direction = EAST;
        }

        // set new head position
        if (g_direction == EAST)
        {
            ++newHead.x;
        }
        else if (g_direction == WEST)
        {
            --newHead.x;
        }
        else if (g_direction == SOUTH)
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
        // send score to database
        g_score = computeScore(false);
        scores.send(g_score, g_highscores);

        // broadcast fail
        g_state = GS_FAIL;
        broadcast({ name: MSGN_NEWSTATE, state: g_state });

        // plan next turn
        planNextTurn(false);
    }
    // check self-hit
    else if (checkSelf(newHead))
    {
        // send score to database
        g_score = computeScore(false);
        scores.send(g_score, g_highscores);

        // broadcast fail
        g_state = GS_FAIL;
        broadcast({ name: MSGN_NEWSTATE, state: g_state });

        // plan next turn
        planNextTurn(false);
    }
    // check victory
    else if (checkVictory(newHead))
    {
        // send score to database
        g_score = computeScore(true);
        scores.send(g_score, g_highscores);

        // broadcast victory
        g_state = GS_VICTORY;
        broadcast({ name: MSGN_NEWSTATE, state: g_state });

        // plan next turn
        planNextTurn(true);
    }
    else
    {
        var previousPendingGrow = g_pendingGrow;

        // check for apples pickup
        var pickup = -1;
        var newApples = new Array();
        for (var a=0; a<g_apples.length; ++a)
        {
            if (g_apples[a]) // CRASHFIX? callback hell?
            {
                if (g_apples[a].x == newHead.x &&
                    g_apples[a].y == newHead.y)
                {
                    pickup = a;
                    pickupApple(a);
                    spawnApple(1, newApples);
                    g_pendingGrow += GROW_PER_APPLE;
                    break; // 2+ apples at the same spot shouln't not happen. normally.
                }
            }
        }

        if (pickup != -1)
        {
            console.vlog("Apple picked up: " + pickup);
        }

        // check for apples from Twitter (+broadcast)
        if (g_tweets > 0)
        {
            spawnApple(g_tweets, newApples);
            g_tweets = 0;
        }

        // broadcast grow/move
        if (previousPendingGrow > 0)
        {
            console.vlog("Grow " + g_move + ". Current score: " + g_score);
            --g_pendingGrow;
            var message = { name : MSGN_GROW, move : g_move, value : newHead, pickup: pickup, newApples: newApples };
            broadcast(message);
        }
        else
        {
            console.vlog("Move "+ g_move + ". Current score: " + g_score);
            var message = { name : MSGN_MOVE, move : g_move, value : newHead, pickup: pickup, newApples: newApples };
            broadcast(message);
        }

        // reset opinion
        g_votes = new Array();
        g_opinion = {};
        g_opinion.current = OP_FORWARD;
        g_opinion.numLeft = 0;
        g_opinion.numRight = 0;
        g_opinion.numForward = 0;

        // plan next move
        planNextMove();
    }

    // push new head
    g_snake.push(newHead);

    g_snakeLengthCache = -1;
    
    // check memory, seppuku if taking too much (Heroku won't kill the server by
    // itself but il will *restart* it, yey!)
    if (MEM_SEPPUKU > 0)
    {
        var rssMB = toMB(process.memoryUsage().rss);
        if (rssMB > MEM_SEPPUKU)
        {
            // clear timeouts
            clearMoveTimeout();
            clearPauseTimeout();
            clearOpinionBroadcast();

            // broadcast (pending) seppuku
            g_state = GS_SEPPUKU;
            broadcast({ name: MSGN_NEWSTATE, state: g_state });

            setTimeout(performSeppuku, MEM_SEPPUKU_DELAY);
        }
    }
}

function performSeppuku()
{
    console.error("Eating too much memory. Seppuku!");
    process.exit(2);
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

function processVote(_socket, _value, _elector)
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
    
    // elector vote count double
    if (_elector)
    {
        g_votes.push(vote);
    }

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
        if (ivote.value == OP_LEFT) { ++g_opinion.numLeft; }
        else if (ivote.value == OP_FORWARD) { ++g_opinion.numForward; }
        else if (ivote.value == OP_RIGHT) { ++g_opinion.numRight; }
        else console.vlog("ERROR: invalid vote: " + ivote.value);
    }
    //console.log("left votes: " + g_opinion.numLeft);
    //console.log("right votes: " + g_opinion.numRight);
    //console.log("forward votes: " + g_opinion.numForward);

    var max = Math.max(g_opinion.numLeft, g_opinion.numRight, g_opinion.numForward);
    if (max == g_opinion.numForward || g_opinion.numLeft == g_opinion.numRight)
    {
        g_opinion.current = OP_FORWARD;
    }
    else if (max == g_opinion.numLeft)
    {
        g_opinion.current = OP_LEFT;
    }
    else // max == g_opinion.numRight
    {
        g_opinion.current = OP_RIGHT;
    }
}

function spawnApple(_count, _newApples)
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

        if (_newApples)
        {
            _newApples.push(slots[idx]);
        }
        
        // remove slot from array
        slots.splice(idx, 1); 
    }
}

function pickupApple(_idx)
{
    // remove apple
    g_apples.splice(_idx, 1);
}

function computeScore(_doubleScore)
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
    if (_doubleScore)
    {
        score = score * 2;
    }
    
    return score;
}

function broadcast(_message)
{
    // any time a message is broadcasted, append the number of players...
    // - active clients in big letters
    // - spectators + idle clients in small letters
    _message.activePlayerCount = g_activePlayerCount;
    _message.totalPlayerCount = g_sockets.length;

    // and the current score
    _message.score = g_score;

    // actually broadcast
    //console.log("BROADCAST: " + _message.name);
    for (var i=0; i<g_sockets.length; i++)
    {
        // *NEVER* spoil bandwidth for idle or sleeping clients (except for
        // updating their page title once in a while)
        var s = g_sockets[i];
        if (s.clientState != CS_SLEEP && s.clientState != CS_IDLE)
        {
            s.emit(MSG_MESSAGE, _message);
        }
    }
}
