// global constants
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 480;
var SPRITE_SIZE = 24;
var SELECT_FRAMES = 3;
var SERVER_DOWN_THRESHOLD = 30000; // in ms
var SPECTATOR_THRESHOLD = 5; // in snake moves
var SLEEP_THRESHOLD = 30000; // in ms
var IDLE_CHECK_INTERVAL = 1000; // in ms
var IDLE_CHECK_INTERVAL = 1000; // in ms
var IDLE_THRESHOLD = 10000; // in ms
var TAIL_HINT_TRIGGER = 13; // in snake length
var TAIL_HINT_TIME = 5000; // in ms
var TAIL_HINT_SWITCH_TIME = 250; // in ms
var MAX_SOCKET_ERROR = 666;

// global variables
var g_serverAddress = null;
var g_context = null;
var g_canvas = null;
var g_socket = null;
var g_assets = null;
var g_snake = null;
var g_apples = null;
var g_opinion = null;
var g_state = null;
var g_move = 0;
var g_activePlayerCount = 0;
var g_totalPlayerCount = 0;
var g_initialTitle = document.title;
var g_score = 0;
var g_clickX = -1;
var g_clickY = -1;
var g_keyLeft = false;
var g_keyUp = false;
var g_keyRight = false;
var g_keyDown = false;
var g_selectEast = -1;
var g_selectWest = -1;
var g_selectSouth = -1;
var g_selectNorth = -1;
var g_votesThisMove = 0;
var g_playerCountElement = null;
var g_numLeftElement = null;
var g_numForwardElement = null;
var g_numRightElement = null;
var g_scoreElement = null;
var g_bestEverElement = null;
var g_weeksBestElement = null;
var g_todaysBestElement = null;
var g_clientStateElement = null;
var g_moveElement = null;
var g_fpsElement = null;
var g_victoryTweet = null;
var g_highscoreMsg = null;
var g_test = null;
var g_clientState = null;
var g_lastTime = null;
var g_lastVoteMove = 0;
var g_pauseStartTime = null;
var g_seppukuStartTime = null;
var g_updateHandle = null;
var g_idleCheckTimeoutHandle = null;
var g_connected = false;
var g_socketErrorCount = 0;
var g_lastMessageTime = null;
var g_updating = false;
var g_down = false;
var g_highscores = { bestEver: 0, weeksBest: 0, todaysBest: 0 };
var g_tailHintTriggered = false;
var g_tailHintStartTime = null;
var g_tailHint = false;
var g_tailHintSwitch = false;
var g_tailHintSwitchTime = null;
var g_lastActivityTime = null;

// assets
var g_serverupgradePath = "files/serverupgrade.png";
var g_serverdownPath = "files/serverdown.png";
var g_serverfloodPath = "files/serverflood.png";
var g_headPaths =
{
    east : "files/snake_head_e.png",
    west : "files/snake_head_w.png",
    north : "files/snake_head_n.png",
    south : "files/snake_head_s.png"
}
var g_bodyPaths =
{
    hz : "files/snake_h.png",
    vt : "files/snake_v.png",
    es : "files/snake_es.png",
    sw : "files/snake_sw.png",
    wn : "files/snake_wn.png",
    ne : "files/snake_ne.png"
}
var g_tailPaths =
{
    east : "files/snake_tails_e.png",
    west : "files/snake_tails_w.png",
    north : "files/snake_tails_n.png",
    south : "files/snake_tails_s.png"
}
var g_tailBlinkPaths =
{
    east : "files/snake_tails_blink_e.png",
    west : "files/snake_tails_blink_w.png",
    north : "files/snake_tails_blink_n.png",
    south : "files/snake_tails_blink_s.png"
}
var g_arrowPaths =
{
    east : "files/arrow_e.png",
    west : "files/arrow_w.png",
    north : "files/arrow_n.png",
    south : "files/arrow_s.png"
}
var g_arrowGoldPaths =
{
    east : "files/arrow_gold_e.png",
    west : "files/arrow_gold_w.png",
    north : "files/arrow_gold_n.png",
    south : "files/arrow_gold_s.png"
}
var g_arrowSelectPaths =
{
    east : "files/arrow_select_e.png",
    west : "files/arrow_select_w.png",
    north : "files/arrow_select_n.png",
    south : "files/arrow_select_s.png"
}
var g_applePath = "files/apple.png";
var g_fullgridPath = "files/fullgrid.png";
var g_victoryPath = "files/victory.png";
var g_failPath = "files/fail.png";
var g_sleepPath = "files/sleep.png";
var g_tailHintPath = "files/tailhint.png";

function log(msg)
{
    //alert(msg);
    if (window.console)
    {
        window.console.log(msg);
    }
}

/**
 * Provides requestAnimationFrame in a cross browser way.
 * Copyright 2010, Google Inc.
 * https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/demos/common/webgl-utils.js
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           return window.setTimeout(callback, 1000/60);
         };
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 * Copyright 2010, Google Inc.
 * https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/demos/common/webgl-utils.js
 */
window.cancelRequestAnimFrame = (function() {
  return window.cancelCancelRequestAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();

function queueAssets(_mgr)
{
    _mgr.queueDownload(g_serverupgradePath);
    _mgr.queueDownload(g_serverdownPath);
    _mgr.queueDownload(g_serverfloodPath);
    _mgr.queueDownload(g_headPaths.east);
    _mgr.queueDownload(g_headPaths.west);
    _mgr.queueDownload(g_headPaths.south);
    _mgr.queueDownload(g_headPaths.north);
    _mgr.queueDownload(g_bodyPaths.hz);
    _mgr.queueDownload(g_bodyPaths.vt);
    _mgr.queueDownload(g_bodyPaths.es);
    _mgr.queueDownload(g_bodyPaths.sw);
    _mgr.queueDownload(g_bodyPaths.wn);
    _mgr.queueDownload(g_bodyPaths.ne);
    _mgr.queueDownload(g_tailPaths.east);
    _mgr.queueDownload(g_tailPaths.west);
    _mgr.queueDownload(g_tailPaths.south);
    _mgr.queueDownload(g_tailPaths.north);
    _mgr.queueDownload(g_tailBlinkPaths.east);
    _mgr.queueDownload(g_tailBlinkPaths.west);
    _mgr.queueDownload(g_tailBlinkPaths.south);
    _mgr.queueDownload(g_tailBlinkPaths.north);
    _mgr.queueDownload(g_arrowPaths.east);
    _mgr.queueDownload(g_arrowPaths.west);
    _mgr.queueDownload(g_arrowPaths.south);
    _mgr.queueDownload(g_arrowPaths.north);
    _mgr.queueDownload(g_arrowGoldPaths.east);
    _mgr.queueDownload(g_arrowGoldPaths.west);
    _mgr.queueDownload(g_arrowGoldPaths.south);
    _mgr.queueDownload(g_arrowGoldPaths.north);
    _mgr.queueDownload(g_arrowSelectPaths.east);
    _mgr.queueDownload(g_arrowSelectPaths.west);
    _mgr.queueDownload(g_arrowSelectPaths.south);
    _mgr.queueDownload(g_arrowSelectPaths.north);
    _mgr.queueDownload(g_applePath);
    _mgr.queueDownload(g_fullgridPath);
    _mgr.queueDownload(g_victoryPath);
    _mgr.queueDownload(g_failPath);
    _mgr.queueDownload(g_sleepPath);
    _mgr.queueDownload(g_tailHintPath);
}

function setClientState(_newState)
{
    if (_newState == g_clientState)
    {
        return;
    }

    /*switch (_newState)
    {
    case CS_ACTIVE: log("ACTIVE"); break;
    case CS_SPECTATOR: log("SPECTATOR"); break;
    case CS_SLEEP: log("SLEEP"); break;
    case CS_IDLE: log("IDLE"); break;
    }*/
    
    // notify server about idle clients (spectators are detected on the
    // server to avoid extra traffic)
    if (g_socket)
    {
        if (_newState == CS_IDLE)
        {
            log("Idle.");
        }
        else if (_newState == CS_SLEEP)
        {
            sleep();
        }
        else if (g_clientState == CS_SLEEP)
        {
            log("Back from sleep!");

            g_lastMessageTime = new Date().getTime();
            g_lastActivityTime = new Date().getTime();

            g_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // show loading = clear canvas
            drawMessage("Reconnecting to polling station... please stay patient, citizen.", true);
        }
        else if (g_clientState == CS_IDLE)
        {
            log("Back from idle!");
            cancelUpdates(); // wait for ping back before updating again

            g_lastMessageTime = new Date().getTime();
            g_lastActivityTime = new Date().getTime();

            g_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // show loading = clear canvas
            drawMessage("Reconnecting to polling station... please stay patient, citizen.", true);
        }

        // server infers active players from vote messages
        if (_newState != CS_ACTIVE)
        {
            g_socket.emit(MSG_MESSAGE, { name: MSGN_CLIENTSTATE, state: _newState});
        }
    }

    g_clientState = _newState;
}

// VICTORY TWEET!
function showVictoryTweet()
{
    // already shown, do nothing
    if (g_victoryTweet)
    {
        return;
    }

    // create DOM element
    g_victoryTweet = document.createElement("input");
    if (!g_victoryTweet)
    {
        log("WARNING: can't create button ");
        return;
    }
    
    // basic config
    g_victoryTweet.type = "button";
    g_victoryTweet.id = "victoryTweet";
    g_victoryTweet.name = "victoryTweet";
    g_victoryTweet.value = "Tweet";

    // onclick popup
    g_victoryTweet.onclick = function()
    {
        var src = "https://twitter.com/share"
        src += "?url=http://snakedemocracy.com";
        src += "&hashtags=snakedemocracy";
        src += "&count=none";
        src += "&text=I was there when we reached the score of " + g_score + " on "
        window.open(src,"","width=550,height=450");
    };

    // add to DOM, last in the div, so on top of everything
    g_canvas.parentNode.insertBefore(g_victoryTweet, null);
}
function hideVictoryTweet()
{
    // already hidden, do nothing
    if (!g_victoryTweet)
    {
        return;
    }

    // remove from DOM
    g_canvas.parentNode.removeChild(g_victoryTweet);
    g_victoryTweet = null;
}

function drawMessage(_msg, _clear)
{
    if (_clear)
    {
        g_context.fillStyle = "#FFFFFF";
        g_context.fillRect(0, 0, CANVAS_WIDTH, 25);
    }

    g_context.fillStyle = "#000000";
    g_context.fillText(_msg, 10, 15);
}

// client init, called with body's onload
function init(_serverAddress, _test)
{
    g_test = _test;
    
    // if no nodejs server is specified, use the current one
    if (!_serverAddress)
    {
        g_serverAddress = "/";
    }
    else
    {
        g_serverAddress = _serverAddress;
    }
    
    setClientState(CS_ACTIVE);
    
    // get canvas element
    g_canvas =  document.getElementById("canvas");
    if (!g_canvas)
    {
        log("ERROR: missing canvas element");
        return;
    }

    // get canvas context
    g_context = g_canvas.getContext("2d");
    if (!g_context)
    {
        log("ERROR: can't get canvas 2d context");
        return;
    }

    // get mandatory stats elements
    g_playerCountElement = document.getElementById("playerCount");
    g_numLeftElement = document.getElementById("numLeft");
    g_numForwardElement = document.getElementById("numForward");
    g_numRightElement = document.getElementById("numRight");
    g_scoreElement = document.getElementById("score");
    g_bestEverElement = document.getElementById("bestEver");
    g_weeksBestElement = document.getElementById("weeksBest");
    g_todaysBestElement = document.getElementById("todaysBest");
    if (!g_playerCountElement ||
        !g_numLeftElement ||
        !g_numForwardElement ||
        !g_numRightElement ||
        !g_bestEverElement ||
        !g_weeksBestElement ||
        !g_todaysBestElement)
    {
        log("WARNING: missing some stats elements");
    }

    // get optional stats elements
    g_clientStateElement = document.getElementById("clientState");
    g_moveElement = document.getElementById("move");
    g_fpsElement = document.getElementById("fps");

    // plug inputs
	g_canvas.onmousedown = mouseDown;
	g_canvas.onmouseup = mouseUp;
	g_canvas.onmousemove = mouseMove;
	g_canvas.oncontextmenu = function() { return false; };
    g_canvas.onselectstart = function() {return false;} 
    document.onkeydown = keyDown;
    document.onkeyup = keyUp;

    log("Loading...");
    drawMessage("Loading ballot paper... please be patient, citizen.", true);
    
    // queue assets, download them, then connect socket
    g_assets = new AssetManager();
    queueAssets(g_assets);
    g_assets.downloadAll(connect);
}

function cancelUpdates()
{
    if (g_updateHandle)
    {
        window.cancelRequestAnimFrame(g_updateHandle);
        g_updateHandle = null;
    }

    if (g_idleCheckTimeoutHandle)
    {
        clearTimeout(g_idleCheckTimeoutHandle);
        g_idleCheckTimeoutHandle = null;
    }
    
    g_updating = false;
}

function serverDown()
{
    var wasUpdating = g_updating;
    
    // exit
    hideVictoryTweet();
    cancelUpdates();
    if (!(typeof io === 'undefined') && g_socket)
    {
        g_socket.disconnect();
    }
    g_down = true;
    
    if (!wasUpdating)
    {
        drawServerDown();
    }
}

function drawServerDown()
{
    // clear canvas
    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw server down image, if available
    if (g_assets.cache[g_serverdownPath])
    {
        g_context.drawImage(
            g_assets.cache[g_serverdownPath],
            0, 0,
            CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // message
    log("Server down :/");
    drawMessage("The server seems to be down... Try to refresh your page in a moment.", false);
}

function serverUpgrade()
{
    // exit
    hideVictoryTweet();
    cancelUpdates();
    if (!(typeof io === 'undefined') && g_socket)
    {
        g_socket.disconnect();
    }
    g_down = true;

    // clear canvas
    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw server upgrade image, if available
    if (g_assets.cache[g_serverupgradePath])
    {
        g_context.drawImage(
            g_assets.cache[g_serverupgradePath],
            0, 0,
            CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // message
    log("Server upgrade!");
    drawMessage("The server was just upgraded. Refresh your page. If this doesn't work, try clearing your cache.", true);
}

function connect()
{
    // if io isn't defined, this means we didn't receive socker.io.js, so the server is down
    if (typeof io === 'undefined') // http://stackoverflow.com/questions/519145/how-can-i-check-whether-a-variable-is-defined-in-javascript
    {
        // quit
        serverDown();
        return;
    }

    log("Connecting...");
    drawMessage("Connecting to polling station... please stay patient, citizen.", true);

    // connect to node.js server
    g_socket = io.connect(g_serverAddress);

    // error
    g_socket.on(MSG_ERROR, function (reason)
    {
        if (!g_down)
        {
            g_socketErrorCount++;
            log("WARNING: socket.io reports an error: ", reason, " (count: ", g_socketErrorCount, ")");
            if (g_socketErrorCount > MAX_SOCKET_ERROR)
            {
                // quit
                // NB: sometimes Firefox throws this then works anyways, so
                // we're giving it some tolerance :/
                serverDown();
            }
        }
    });

    // connection
    g_socket.on(MSG_CONNECT, function ()
    {
        if (!g_down)
        {
            log("Connected!");
            processConnect();
        }
    });    

    // ping
    g_socket.on(MSG_PING, function (message)
    {
        if (!g_down)
        {
            log("Running :)");
            processPing(message);
        }
    });
}

// connect
function processConnect()
{
    // if not connected, plug the messages callbacks
    // NB: this has to be done only *one time* otherwise the callbacks get
    // called once per reconnection, which just brings weird, weird issues
    if (!g_connected)
    {
        // messages
        g_socket.on(MSG_MESSAGE, function (_message)
        {
            if (!g_down)
            {
                processMessage(_message)
            }
        });

        // test messages
        if (g_test && !g_down)
        {
            g_socket.on(MSG_TESTMSG, function (_testmsg)
            {
                processTestmsg(_testmsg)
            });
        }        
    }
    // if already connected, cancel updates
    else
    {
        cancelUpdates();
    }
    
    g_connected = true;
    g_socketErrorCount = 0;
}

function logVec2Array(_name, _array)
{
    log(_name);
    for (var i=0; i<_array.length; ++i)
    {
        log(_array[i].x, ",", _array[i].y);
    }
}

// ping, first message, inits the snake
function processPing(_ping)
{
    // check revision
    if (!_ping.revision || _ping.revision != REVISION)
    {
        serverUpgrade();
        return;
    }
    
    // copy initial snake
    //logVec2Array("PING SNAKE", _ping.snake);
    g_snake = new Array();
    for (var i=0; i<_ping.snake.length; ++i)
    {
        g_snake.push(new vec2(_ping.snake[i].x, _ping.snake[i].y));
    }
    //logVec2Array("CLIENT SNAKE", g_snake);

    // copy initial apples
    g_apples = new Array();
    for (var i=0; i<_ping.apples.length; ++i)
    {
        g_apples.push(new vec2(_ping.apples[i].x, _ping.apples[i].y));
    }

    // set game state
    g_state = _ping.state;

    // copy score
    g_score = _ping.score;
    
    // copy highscores
    g_highscores = _ping.highscores;

    g_lastTime = new Date().getTime();
    //g_lastVoteMove = 0;
    
    g_move = _ping.move;
    g_votesThisMove = 0;
    g_lastVoteMove = g_move;
    g_lastMessageTime = new Date().getTime();
    g_lastActivityTime = new Date().getTime();
    
    g_updating = true;
    
    update();
    idleCheck();
    
    if (g_test)
    {
        updateSpamBots();
    }
}

// http://www.quirksmode.org/js/findpos.html
function findPos(obj)
{
	var curleft = curtop = 0;
    if (obj.offsetParent)
    {
        do
        {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return [curleft,curtop];
}

function mouseDown(e)
{
    return false;
}

function mouseUp(e)
{
    //log("mouseUp")

    // record activity
    g_lastActivityTime = new Date().getTime();
    if (g_clientState == CS_SLEEP)
    {
        setClientState(CS_SPECTATOR);
    }

	var button = null;
    
    if (!e) var e = window.event;
	if (e.button) button = e.button;
	else button = e.which;
	if (button == null ) return;

    if (button==1)
    {
        //log("left click");

        // http://www.quirksmode.org/js/events_properties.html
        var posx = 0;
	    var posy = 0;
	    if (e.pageX || e.pageY)
        {
		    posx = e.pageX;
		    posy = e.pageY;
	    }
	    else if (e.clientX || e.clientY)
        {
		    posx = e.clientX + document.body.scrollLeft
			    + document.documentElement.scrollLeft;
		    posy = e.clientY + document.body.scrollTop
			    + document.documentElement.scrollTop;
	    }

        //log("posx:" + posx + " posy:" + posy);

        var canvasPos = findPos(g_canvas);
        g_clickX = posx - canvasPos[0];
        g_clickY = posy - canvasPos[1];

        //log("clickx:" + g_clickX + " clicky:" + g_clickY);
    }

    return false;
}

function mouseMove(e)
{
    //log("mouseMove")

    // record activity
    g_lastActivityTime = new Date().getTime();
    if (g_clientState == CS_SLEEP)
    {
        setClientState(CS_SPECTATOR);
    }
}

function keyDown(e)
{
}

function keyUp(e)
{
    //log("keyUp")

    // record activity
    g_lastActivityTime = new Date().getTime();
    if (g_clientState == CS_SLEEP)
    {
        setClientState(CS_SPECTATOR);
    }

    switch (e.keyCode)
    {
    case 37: case 81: case 65: g_keyLeft = true; break;
    case 38: case 90: case 87: g_keyUp = true; break;
    case 39: case 68: g_keyRight = true; break;
    case 40: case 83: g_keyDown = true; break;
    }
}

// assets manager
// http://io-2011-html5-games-hr.appspot.com/#22
function AssetManager() {
  this.successCount = 0;
  this.errorCount = 0;
  this.cache = [];
  this.downloadQueue = [];
}
AssetManager.prototype.queueDownload = function(path) {
  this.downloadQueue.push(path);
}
AssetManager.prototype.isDone = function() {
  return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function(callback) {
  for (var i = 0; i < this.downloadQueue.length; i++) {
      var path = this.downloadQueue[i];
      var img = new Image();
      img.src = path;
      this.cache[path] = img;
      var that = this;
      img.onload = function() 
      {
          that.successCount += 1;
          if (that.isDone()) { callback(); }
      };          
  }
}

function getScreenCoords(_coords, _middle)
{
    var topLeft = new vec2(_coords.x*SPRITE_SIZE, _coords.y*SPRITE_SIZE);
    if (!_middle)
    {
        return topLeft;
    }
    var middle = new vec2(topLeft.x + 0.5*SPRITE_SIZE, topLeft.y + 0.5*SPRITE_SIZE);
    return middle;
}

// client update
function update()
{
    // plan next update
    if (!g_down)
    {
        g_updateHandle = window.requestAnimFrame(update);
    }
    else
    {
        drawServerDown();
        return;
    }

    // yey! back with us, default to spectator
    if (g_clientState == CS_IDLE)
    {
        setClientState(CS_SPECTATOR);
        return;
    }
    
    var time = new Date().getTime();
    var dt = time - g_lastTime;
    
    if (g_test)
    {
        g_socket.emit(MSG_TESTMSG, { name : TMSGN_MEM });
    }

    // clear canvas
    //g_context.fillStyle = "#000000";
    //g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g_context.drawImage(
        g_assets.cache[g_fullgridPath],
        0, 0,
        CANVAS_WIDTH, CANVAS_HEIGHT);

    if (g_snake.length > 1 && g_state == GS_PLAYING)
    {
        // determine head direction...
        var head = g_snake[g_snake.length-1].clone();
        var neck = g_snake[g_snake.length-2].clone();
        var direction = null;
        if (head.x != neck.x)
        {
            if (head.x > neck.x) direction = EAST;
            else direction = WEST;
        }
        else
        {
            if (head.y > neck.y) direction = SOUTH;
            else direction = NORTH;
        }

        // .. and tail direction
        var pretail = g_snake[1].clone();
        var tail = g_snake[0].clone();
        var tailDirection = null;
        if (pretail.x != tail.x)
        {
            if (pretail.x > tail.x) tailDirection = EAST;
            else tailDirection = WEST;
        }
        else
        {
            if (pretail.y > tail.y) tailDirection = SOUTH;
            else tailDirection = NORTH;
        }

        // apply mouse input
        if (g_clickX != -1 && g_clickY != -1)
        {
            var x = Math.floor(g_clickX / SPRITE_SIZE);
            var y = Math.floor(g_clickY / SPRITE_SIZE);
            
            //log(head.x + "," + head.y);
            //log(x + "," + y);
            
            if (y == head.y)
            {
                if (x == head.x+1)
                {
                    if (direction == NORTH) vote(OP_RIGHT);
                    if (direction == EAST) vote(OP_FORWARD);
                    if (direction == SOUTH) vote(OP_LEFT);
                    g_selectEast = SELECT_FRAMES;
                }
                else if (x == head.x-1)
                {
                    if (direction == SOUTH) vote(OP_RIGHT);
                    if (direction == WEST) vote(OP_FORWARD);
                    if (direction == NORTH) vote(OP_LEFT);
                    g_selectWest = SELECT_FRAMES;
                }
            }
            else if (x == head.x)
            {
                if (y == head.y+1)
                {
                    if (direction == EAST) vote(OP_RIGHT);
                    if (direction == SOUTH) vote(OP_FORWARD);
                    if (direction == WEST) vote(OP_LEFT);
                    g_selectSouth = SELECT_FRAMES;
                }
                else if (y == head.y-1)
                {
                    if (direction == WEST) vote(OP_RIGHT);
                    if (direction == NORTH) vote(OP_FORWARD);
                    if (direction == EAST) vote(OP_LEFT);
                    g_selectNorth = SELECT_FRAMES;
                }
            }
        }

        // apply keyboard input
        if (g_keyLeft)
        {
            if (direction == WEST) vote(OP_FORWARD);
            else if (direction == SOUTH) vote(OP_RIGHT);
            else if (direction == NORTH) vote(OP_LEFT);
            if (direction != EAST) g_selectWest = SELECT_FRAMES;
        }
        else if (g_keyUp)
        {
            if (direction == NORTH) vote(OP_FORWARD);
            else if (direction == EAST) vote(OP_LEFT);
            else if (direction == WEST) vote(OP_RIGHT);
            if (direction != SOUTH) g_selectNorth = SELECT_FRAMES;
        }
        else if (g_keyRight)
        {
            if (direction == SOUTH) vote(OP_LEFT);
            else if (direction == EAST) vote(OP_FORWARD);
            else if (direction == NORTH) vote(OP_RIGHT);
            if (direction != WEST) g_selectEast = SELECT_FRAMES;
        }
        else if (g_keyDown)
        {
            if (direction == SOUTH) vote(OP_FORWARD);
            else if (direction == EAST) vote(OP_RIGHT);
            else if (direction == WEST) vote(OP_LEFT);
            if (direction != NORTH) g_selectSouth = SELECT_FRAMES;
        }

        // draw apples
        for (var i=0; i<g_apples.length; ++i)
        {
            var appleCoords = getScreenCoords(g_apples[i]);
            g_context.drawImage(
                g_assets.cache[g_applePath],
                appleCoords.x, appleCoords.y,
                SPRITE_SIZE, SPRITE_SIZE
            );
        }

        // draw tail tip
        var tailPath = g_tailPaths;
        if (g_tailHint)
        {
            var hintDT = time - g_tailHintSwitchTime;
            if (hintDT > TAIL_HINT_SWITCH_TIME)
            {
                g_tailHintSwitchTime += TAIL_HINT_SWITCH_TIME;
                g_tailHintSwitch = !g_tailHintSwitch;
            }
            tailPath = g_tailHintSwitch ? g_tailBlinkPaths : g_tailPaths;
        }
        var tailCoords = getScreenCoords(tail);
        var tailImg = null;
        if (tailDirection == EAST) tailImg = g_assets.cache[tailPath.east];
        else if (tailDirection == WEST) tailImg = g_assets.cache[tailPath.west];
        else if (tailDirection == SOUTH) tailImg = g_assets.cache[tailPath.south];
        else /*(tailDirection == NORTH)*/ tailImg = g_assets.cache[tailPath.north];
        g_context.drawImage(
            tailImg,
            tailCoords.x, tailCoords.y,
            SPRITE_SIZE, SPRITE_SIZE
        );

        // draw all snake body elements
        for (var i=1; i<g_snake.length-1; i++)
        {
            var previous = g_snake[i+1].clone();
            var current = g_snake[i].clone();
            var next = g_snake[i-1].clone();
            var prevDir = null;
            var nextDir = null;
            if (previous.x != current.x)
            {
                if (previous.x > current.x) prevDir = EAST;
                else prevDir = WEST;
            }
            else
            {
                if (previous.y > current.y) prevDir = SOUTH;
                else prevDir = NORTH;
            }
            if (current.x != next.x)
            {
                if (current.x > next.x) nextDir = WEST;
                else nextDir = EAST;
            }
            else
            {
                if (current.y > next.y) nextDir = NORTH;
                else nextDir = SOUTH;
            }

            var bodyCoords = getScreenCoords(current);
            var bodyImg = null;
            if (prevDir == EAST && nextDir == WEST) bodyImg = g_assets.cache[g_bodyPaths.hz];
            else if (nextDir == EAST && prevDir == WEST) bodyImg = g_assets.cache[g_bodyPaths.hz];
            else if (prevDir == SOUTH && nextDir == NORTH) bodyImg = g_assets.cache[g_bodyPaths.vt];
            else if (nextDir == SOUTH && prevDir == NORTH) bodyImg = g_assets.cache[g_bodyPaths.vt];
            else if (prevDir == EAST && nextDir == SOUTH) bodyImg = g_assets.cache[g_bodyPaths.es];
            else if (nextDir == EAST && prevDir == SOUTH) bodyImg = g_assets.cache[g_bodyPaths.es];
            else if (prevDir == SOUTH && nextDir == WEST) bodyImg = g_assets.cache[g_bodyPaths.sw];
            else if (nextDir == SOUTH && prevDir == WEST) bodyImg = g_assets.cache[g_bodyPaths.sw];
            else if (prevDir == WEST && nextDir == NORTH) bodyImg = g_assets.cache[g_bodyPaths.wn];
            else if (nextDir == WEST && prevDir == NORTH) bodyImg = g_assets.cache[g_bodyPaths.wn];
            else if (prevDir == NORTH && nextDir == EAST) bodyImg = g_assets.cache[g_bodyPaths.ne];
            else /*(nextDir == NORTH && prevDir == EAST)*/ bodyImg = g_assets.cache[g_bodyPaths.ne];
            g_context.drawImage(
                bodyImg,
                bodyCoords.x, bodyCoords.y,
                SPRITE_SIZE, SPRITE_SIZE
            );
        }
        
        // draw head
        var headCoords = getScreenCoords(head);
        var headImg = null;
        if (direction == EAST) headImg = g_assets.cache[g_headPaths.east];
        else if (direction == WEST) headImg = g_assets.cache[g_headPaths.west];
        else if (direction == SOUTH) headImg = g_assets.cache[g_headPaths.south];
        else /*(direction == NORTH)*/ headImg = g_assets.cache[g_headPaths.north];
        g_context.drawImage(
            headImg,
            headCoords.x, headCoords.y,
            SPRITE_SIZE, SPRITE_SIZE
        );
        
        // draw opinion
        if (g_opinion)
        {
            var drawEast = true;
            var drawWest = true;
            var drawSouth = true;
            var drawNorth = true;

            // east
            if (direction == EAST)
            {
                drawWest = false;
                if (g_opinion.current == OP_FORWARD) drawGold = EAST;
                else if (g_opinion.current == OP_LEFT) drawGold = NORTH;
                else if (g_opinion.current == OP_RIGHT) drawGold = SOUTH;
            }
            // west
            else if (direction == WEST)
            {
                direction = WEST;
                drawEast = false;
                if (g_opinion.current == OP_FORWARD) drawGold = WEST;
                else if (g_opinion.current == OP_LEFT) drawGold = SOUTH;
                else if (g_opinion.current == OP_RIGHT) drawGold = NORTH;
            }
            // south
            else if (direction == SOUTH)
            {
                direction = SOUTH;
                drawNorth = false;
                if (g_opinion.current == OP_FORWARD) drawGold = SOUTH;
                else if (g_opinion.current == OP_LEFT) drawGold = EAST;
                else if (g_opinion.current == OP_RIGHT) drawGold = WEST;
            }
            // north
            else
            {
                direction = NORTH;
                drawSouth = false;
                if (g_opinion.current == OP_FORWARD) drawGold = NORTH;
                else if (g_opinion.current == OP_LEFT) drawGold = WEST;
                else if (g_opinion.current == OP_RIGHT) drawGold = EAST;
            }

            if (drawEast)
            {
                var point = new vec2(head.x+1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    (drawGold == EAST)
                        ? g_assets.cache[g_arrowGoldPaths.east]
                        : g_assets.cache[g_arrowPaths.east],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (g_selectEast>0)
            {
                var point = new vec2(head.x+1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowSelectPaths.east],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (drawWest)
            {
                var point = new vec2(head.x-1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    (drawGold == WEST)
                        ? g_assets.cache[g_arrowGoldPaths.west]
                        : g_assets.cache[g_arrowPaths.west],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (g_selectWest>0)
            {
                var point = new vec2(head.x-1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowSelectPaths.west],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (drawSouth)
            {
                var point = new vec2(head.x, head.y+1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    (drawGold == SOUTH)
                        ? g_assets.cache[g_arrowGoldPaths.south]
                        : g_assets.cache[g_arrowPaths.south],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (g_selectSouth>0)
            {
                var point = new vec2(head.x, head.y+1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowSelectPaths.south],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (drawNorth)
            {
                var point = new vec2(head.x, head.y-1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    (drawGold == NORTH)
                        ? g_assets.cache[g_arrowGoldPaths.north]
                        : g_assets.cache[g_arrowPaths.north],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
            if (g_selectNorth>0)
            {
                var point = new vec2(head.x, head.y-1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowSelectPaths.north],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
        }
    }
    
    // clear highscore message
    if (g_state != GS_VICTORY)
    {
        g_highscoreMsg = null;
    }

    // draw overlays
    if (g_state == GS_VICTORY)
    {
        // img
        g_context.drawImage(
            g_assets.cache[g_victoryPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        var bkpFont = g_context.font;
        var bkpAlign = g_context.textAlign;

        // draw score
        g_context.font = "30pt Arial Bold";
        g_context.textAlign = "center";
        g_context.fillStyle = "#000000";
        g_context.fillText(g_score, 240, 285);
        
        // draw highscore message
        if (g_highscoreMsg)
        {
            g_context.font = "30pt Arial Bold";
            g_context.textAlign = "center";
            g_context.fillStyle = "#000000";
            g_context.fillText(g_highscoreMsg, 240, 230);
        }
        
        g_context.font = bkpFont;
        g_context.textAlign = bkpAlign;

        // draw countdown
        var message = "Starting a new game soon...";
        if (g_pauseStartTime)
        {
            var dt = g_lastTime - g_pauseStartTime;
            var countdown = Math.max(0.0, VICTORY_DELAY - dt);
            if (countdown > 0.0)
            {
                message = "Restarting game in " + Math.floor(countdown/1000) + " seconds...";
            }
        }
        drawMessage(message, false);
    }
    else if (g_state == GS_FAIL)
    {
        // img
        g_context.drawImage(
            g_assets.cache[g_failPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // draw countdown
        var message = "Your fellow citizens failed but the game will restart soon...";
        if (g_pauseStartTime)
        {
            var dt = g_lastTime - g_pauseStartTime;
            var countdown = Math.max(0.0, FAIL_DELAY - dt);
            if (countdown > 0.0)
            {
                message = "Restarting game in " + Math.floor(countdown/1000) + " seconds...";
            }
        }
        drawMessage(message, false);
    }
    else if (g_state == GS_SEPPUKU)
    {
        // img
        g_context.drawImage(
            g_assets.cache[g_serverfloodPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // draw countdown
        var message = "Server seppuku!";
        if (g_seppukuStartTime)
        {
            var dt = g_lastTime - g_seppukuStartTime;
            var countdown = Math.max(0.0, FAIL_DELAY - dt);
            message = "Server seppuku! Attempting a restart in " + Math.floor(countdown/1000) + " seconds...";
        }
        drawMessage(message, false);
    }
    else if (g_tailHint)
    {
        var head = new vec2(0, 0);
        if (g_snake && g_snake.length>0)
        {
            head = g_snake[g_snake.length-1].clone();
        }

        if (head.x > AREA_SIZE*0.5)
        {
            if (head.y > AREA_SIZE*0.5)
            {
                // top left
                g_context.drawImage(
                    g_assets.cache[g_tailHintPath],
                    0, 0, CANVAS_WIDTH*0.5, CANVAS_HEIGHT*0.5);
            }
            else
            {
                // bottom left
                g_context.drawImage(
                    g_assets.cache[g_tailHintPath],
                    0, CANVAS_HEIGHT*0.5, CANVAS_WIDTH*0.5, CANVAS_HEIGHT*0.5);
            }
        }
        else
        {
            if (head.y > AREA_SIZE*0.5)
            {
                // top right
                g_context.drawImage(
                    g_assets.cache[g_tailHintPath],
                    CANVAS_WIDTH*0.5, 0, CANVAS_WIDTH*0.5, CANVAS_HEIGHT*0.5);
            }
            else
            {
                // bottom right
                g_context.drawImage(
                    g_assets.cache[g_tailHintPath],
                    CANVAS_WIDTH*0.5, CANVAS_HEIGHT*0.5, CANVAS_WIDTH*0.5, CANVAS_HEIGHT*0.5);
            }
        }
    }
    
    // show/hide victory tweet
    if (g_state == GS_VICTORY)
    {
        showVictoryTweet();
    }
    else
    {
        hideVictoryTweet();
    }

    // reset input
    g_clickX = -1;
    g_clickY = -1;
    g_keyLeft = false;
    g_keyUp = false;
    g_keyRight = false;
    g_keyDown = false;
    if (g_selectEast > 0) --g_selectEast;
    if (g_selectWest > 0) --g_selectWest;
    if (g_selectSouth > 0) --g_selectSouth;
    if (g_selectNorth > 0) --g_selectNorth;
    
    // check if not voting
    spectatorCheck(time);
    
    // check if doing nothing for too long
    sleepCheck(time);

    // check if server is still online
    serverDownCheck(time);

    // stats
    updateStats(dt);

    // tail hint
    updateTailHint(time);

    g_lastTime = time;
}

function updateStats(_dt)
{
    // mandatory
    if (g_playerCountElement)
    {
        if (g_totalPlayerCount == 0)
        {
            g_playerCountElement.innerHTML = " :(";
        }
        else
        {
            g_playerCountElement.innerHTML = g_activePlayerCount + " <small>/ " + g_totalPlayerCount + "</small>";
            if (g_clientState == CS_ACTIVE)
            {
                document.title = g_initialTitle;
            }
            else if (g_clientState == CS_SPECTATOR)
            {
                document.title = "[" + g_activePlayerCount + "/" + g_totalPlayerCount + "] " + g_initialTitle;
            }
        }
    }
    if (g_numLeftElement)
    {
        if (g_opinion)
        {
            g_numLeftElement.innerHTML = g_opinion.numLeft;
        }
    }
    if (g_numForwardElement)
    {
        if (g_opinion)
        {
            g_numForwardElement.innerHTML = g_opinion.numForward;
        }
    }
    if (g_numRightElement)
    {
        if (g_opinion)
        {
            g_numRightElement.innerHTML = g_opinion.numRight;
        }
    }
    if (g_scoreElement)
    {
        if (g_state == GS_PLAYING || g_state == GS_VICTORY)
        {
            g_scoreElement.innerHTML = g_score;
        }
        else
        {
            g_scoreElement.innerHTML = "&#x2014;";
        }
    }
    if (g_bestEverElement)
    {
        g_bestEverElement.innerHTML = g_highscores.bestEver>0 ? g_highscores.bestEver : "&#x2014;";
    }
    if (g_weeksBestElement)
    {
        g_weeksBestElement.innerHTML = g_highscores.weeksBest>0 ? g_highscores.weeksBest : "&#x2014;";
    }
    if (g_todaysBestElement)
    {
        g_todaysBestElement.innerHTML = g_highscores.todaysBest>0 ? g_highscores.todaysBest : "&#x2014;";
    }

    // optional (test)
    if (g_clientStateElement)
    {
        g_clientStateElement.innerHTML = g_clientState;
    }
    if (g_moveElement)
    {
        g_moveElement.innerHTML = g_move;
    }
    if (g_fpsElement)
    {
        g_fpsElement.innerHTML = Math.floor(1000.0 / _dt);
    }
}

function updateTailHint(_time)
{
    if (!g_tailHintTriggered)
    {
        if (g_snake.length >= TAIL_HINT_TRIGGER)
        {
            g_tailHintTriggered = true;
            g_tailHintStartTime = _time;
            g_tailHint = true;
            g_tailHintSwitch = true;
            g_tailHintSwitchTime = _time;
        }
    }
    else if (g_tailHint)
    {
        var dt = _time - g_tailHintStartTime;
        if (dt > TAIL_HINT_TIME)
        {
            g_tailHintStartTime = null;
            g_tailHint = false;
            g_tailHintSwitch = false;
            g_tailHintSwitchTime = null;
        }
    }
}

// detect spectator client
// = no vote for too long
function spectatorCheck(_time)
{
    if (g_clientState != CS_ACTIVE)
    {
        return;
    }

    var dmove = g_move - g_lastVoteMove;
    if (dmove > SPECTATOR_THRESHOLD)
    {
        setClientState(CS_SPECTATOR);
    }
}

// detect sleeping client
// = no activity for too long
function sleepCheck(_time)
{
    if (g_clientState != CS_SPECTATOR)
    {
        return;
    }

    var dt = _time - g_lastActivityTime;
    if (dt > SLEEP_THRESHOLD)
    {
        setClientState(CS_SLEEP);
    }
}

// detect idle client
// = not updating for too long, works only with browsers with a version
// requestAnimationFrame properly implemented
function idleCheck()
{
    if (!g_down)
    {
        g_idleCheckTimeoutHandle = setTimeout(idleCheck, IDLE_CHECK_INTERVAL);
    }

    var time = new Date().getTime();
    var dt = time - g_lastTime;
    if (dt > IDLE_THRESHOLD)
    {
        setClientState(CS_IDLE);
    }
}

// detect down server
function serverDownCheck(_time)
{
    var threshold = SERVER_DOWN_THRESHOLD;
    if (g_state == GS_VICTORY)
    {
        threshold += VICTORY_DELAY;
    }
    else if (g_state == GS_FAIL)
    {
        threshold += FAIL_DELAY;
    }
    
    var dmsg = _time - g_lastMessageTime;
    if (dmsg > threshold)
    {
        // quit
        serverDown();
    }
}

// test/cheat/tweaks
function cheatKill()
{
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_KILL });
}
function cheatRestart()
{
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_RESTART });
}
function cheatTweet()
{
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_CHEATTWEET });
}
var g_spamBots = new Array();
function addSpamBot(_count)
{
    for (var i=0; i<_count; ++i)
    {
        var spamSocket = io.connect(g_serverAddress, {"force new connection": true});
        spamSocket.on(MSG_PING, function (message)
        {
            //log("SPAM: ping");
            g_spamBots.push(spamSocket);
        });
    }
}
function rmSpamBot(_count)
{
    for (var i=0; i<_count; ++i)
    {
        var spamSocket = g_spamBots.pop();
        if (spamSocket)
        {
            spamSocket.disconnect();
        }
    }
}
function updateSpamBots()
{
    if (!g_down)
    {
        setTimeout(updateSpamBots, 200); // vote 10 times in 2s
    }
    
    for (var i=0; i<g_spamBots.length; ++i)
    {
        var spamSocket = g_spamBots[i];

        // couldn't connect, remove from array
        if (!spamSocket)
        {
            g_spamBots.splice(i, 1); 
        }
        
        // cast random vote
        if (g_state == GS_PLAYING)
        {
            var pick = Math.floor(Math.random()*3);
            var voteValue = null;
            if (pick==0) voteValue = OP_LEFT;
            else if (pick==1) voteValue = OP_FORWARD;
            else if (pick==2) voteValue = OP_RIGHT;
            else log("ERROR: Math.random went mad?");
            //log("SPAM: " + voteValue);
            spamSocket.emit(MSG_MESSAGE, { name : MSGN_VOTE, move : g_move, value : voteValue });
        }
    }
}

// tweaks
function submitMoveDelay()
{
    var element = document.getElementById("moveDelay");
    if (!element)
    {
        log("ERROR: can't get move delay element");
        return false;
    }
    log("TWEAK: move delay change to " + element.value);
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_MOVEDELAY , value : element.value });
}
function submitFailDelay()
{
    element = document.getElementById("failDelay");
    if (!element)
    {
        log("ERROR: can't get fail delay element");
        return false;
    }
    log("TWEAK: fail delay change to " + element.value);
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_FAILDELAY , value : element.value });
}
function submitVictoryDelay()
{
    element = document.getElementById("victoryDelay");
    if (!element)
    {
        log("ERROR: can't get victory delay element");
        return false;
    }
    log("TWEAK: victory delay change to " + element.value);
    g_socket.emit(MSG_TESTMSG, { name : TMSGN_VICTORYDELAY , value : element.value });
}

// VOTE
function vote(_value)
{
    g_lastVoteMove = g_move;
    setClientState(CS_ACTIVE);
    if (g_state == GS_PLAYING && g_votesThisMove < MAX_VOTES_PER_MOVE)
    {
        //log("vote: " + _value);
        g_socket.emit(MSG_MESSAGE, { name : MSGN_VOTE, move : g_move, value : _value });
        ++g_votesThisMove;
    }
}

function processMessage(_message)
{
    //log("MESSAGE:" + _message.name + " (" + _message.value + ")");

    // remember message time
    g_lastMessageTime = new Date().getTime();
    
    // update player count & score
    g_totalPlayerCount = _message.totalPlayerCount;
    g_activePlayerCount = _message.activePlayerCount;
    g_score = _message.score;

    if (_message.name == MSGN_OPINION)
    {
        g_opinion = {};
        g_opinion.current = _message.value.current;
        g_opinion.numLeft = _message.value.numLeft;
        g_opinion.numRight = _message.value.numRight;
        g_opinion.numForward = _message.value.numForward;
        //log(g_opinion.numLeft);
    }
    else if (_message.name == MSGN_GROW)
    {
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
        //logVec2Array("CLIENT SNAKE", g_snake);
        
        processMoveGrow(_message);
    }
    else if (_message.name == MSGN_MOVE)
    {
        g_snake.shift();
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
        //logVec2Array("CLIENT SNAKE", g_snake);
        
        processMoveGrow(_message);
    }
    else if (_message.name == MSGN_NEWSTATE)
    {
        if (_message.state == GS_FAIL)
        {
            g_state = GS_FAIL;
            g_move = 0;
            g_votesThisMove = 0;
            g_lastVoteMove = 0;
            g_pauseStartTime = new Date().getTime();
        }
        else if (_message.state == GS_VICTORY)
        {
            g_state = GS_VICTORY;
            g_move = 0;
            g_votesThisMove = 0;
            g_lastVoteMove = 0;
            g_pauseStartTime = new Date().getTime();
            
            // show new highscore message
            if (g_score > g_highscores.todaysBest)
            {
                g_highscores.todaysBest = g_score;
                g_highscoreMsg = "Today's best score!"
                log(g_highscoreMsg + " " + g_score);
                
                // new weekly highscore
                if (g_score > g_highscores.weeksBest)
                {
                    g_highscores.weeksBest = g_score;
                    g_highscoreMsg = "This week's best score!"
                    log(g_highscoreMsg + " " + g_score);
                    
                    // wow! new best score ever
                    if (g_score > g_highscores.bestEver)
                    {
                        g_highscores.bestEver = g_score;
                        g_highscoreMsg = "Best score ever!"
                        log(g_highscoreMsg + " " + g_score);
                    }
                }
            }
        }
        else if (_message.state == GS_PLAYING)
        {
            g_state = GS_PLAYING;
            g_move = 0;
            g_votesThisMove = 0;
            g_lastVoteMove = 0;
            
            // copy snakes
            g_snake = new Array();
            for (var i=0; i<_message.snake.length; ++i)
            {
                g_snake.push(new vec2(_message.snake[i].x, _message.snake[i].y)); // meh??
            }
            //logVec2Array("CLIENT SNAKE", g_snake);
            
            // copy apples
            g_apples = new Array();
            for (var i=0; i<_message.apples.length; ++i)
            {
                if (_message.apples[i]) // CRASH fix
                {
                    g_apples.push(new vec2(_message.apples[i].x, _message.apples[i].y)); // meh??
                }
            }
            
            // reset tail hint
            g_tailHintTriggered = false;
            g_tailHintStartTime = null;
            g_tailHint = false;
            g_tailHintSwitch = false;
            g_tailHintSwitchTime = null;
        }
        else if (_message.state == GS_SEPPUKU)
        {
            g_state = GS_SEPPUKU;
            g_seppukuStartTime = new Date().getTime();
        }
    }
    else if (_message.name == MSGN_LIGHTBROADCAST)
    {
        if (g_clientState != CS_SLEEP && g_clientState != CS_IDLE)
        {
            log("WARNING: received light broadcast with client state= " + g_clientState);
        }
        else
        {
            document.title = "[" + _message.activePlayerCount + "/" + _message.totalPlayerCount + "] " + g_initialTitle;
        }
    }
    else
    {
        log("ERROR: unkown message: ", _message.name);
    }
}

function processMoveGrow(_message)
{
    g_move = _message.move;
    g_votesThisMove = 0;
    
    // reset opinion
    g_opinion = {};
    g_opinion.current = OP_FORWARD;
    g_opinion.numLeft = 0;
    g_opinion.numRight = 0;
    g_opinion.numForward = 0;

    // apple pickup
    if (_message.pickup != -1)
    {
        g_apples.splice(_message.pickup, 1);
    }

    // apple spawn
    for (var i=0; i<_message.newApples.length; ++i)
    {
        g_apples.push(new vec2(_message.newApples[i].x, _message.newApples[i].y));
    }
}

function processTestmsg(_message)
{
    if (_message.name == TMSGN_MEM)
    {
        var memUsageElement = document.getElementById("memUsage");
        if (memUsageElement)
        {
            memUsageElement.innerHTML = _message.text;
        }
    }    
}

function appleTweetClick()
{
    var src = "https://twitter.com/share"
    src += "?url=http://snakedemocracy.com";
    src += "&hashtags=snakedemocracy";
    src += "&count=none";
    src += "&text=Give me an apple!"
    window.open(src,"","width=550,height=450");
    return true;
}

function sleep()
{
    // exit
    hideVictoryTweet();
    cancelUpdates();

    // clear canvas
    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw sleep image, if available
    if (g_assets.cache[g_sleepPath])
    {
        g_context.drawImage(
            g_assets.cache[g_sleepPath],
            0, 0,
            CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // message
    log("Sleep.");
    drawMessage("Sleeping. Move your mouse over the game, or press any key to reconnect with the server.", true);   
}