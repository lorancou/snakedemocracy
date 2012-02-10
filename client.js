// global constants
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 480;
var SPRITE_SIZE = 24;
var SELECT_FRAMES = 3;
var CONNECT_TIMEOUT = 30000; // in ms
var SERVER_DOWN_THRESHOLD = 30000; // in ms
var IDLE_CHECK_INTERVAL = 1000; // in ms
var IDLE_THRESHOLD = 10000; // in ms
var TAIL_HINT_TRIGGER = 13; // in snake length
var TAIL_HINT_TIME = 5000; // in ms
var TAIL_HINT_SWITCH_TIME = 250; // in ms
var MAX_SOCKET_ERROR = 3;

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
var g_mouseX = -1;
var g_mouseY = -1;
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
var g_test = null;
var g_pokki = null;
var g_clientState = null;
var g_lastTime = null;
var g_lastVoteMove = 0;
var g_pauseStartTime = null;
var g_seppukuStartTime = null;
var g_updateHandle = null;
var g_idleCheckTimeoutHandle = null;
var g_socketErrorCount = 0;
var g_lastMessageTime = null;
var g_stopped = false;
var g_connecting = false;
var g_connectionCount = 0;
var g_drawPaused = false;
var g_highscores = { bestEver: 0, weeksBest: 0, todaysBest: 0 };
var g_highscoreFlag = null;
var g_tailHintTriggered = false;
var g_tailHintStartTime = null;
var g_tailHint = false;
var g_tailHintSwitch = false;
var g_tailHintSwitchTime = null;
var g_backPingRequested = false;
var g_elector = false;

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
var g_arrowHoverPaths =
{
    east : "files/arrow_hover_e.png",
    west : "files/arrow_hover_w.png",
    north : "files/arrow_hover_n.png",
    south : "files/arrow_hover_s.png"
}
var g_applePath = "files/apple.png";
var g_fullgridPath = "files/fullgrid.png";
var g_victoryPath = "files/victory.png";
var g_failPath = "files/fail.png";
var g_sleepPath = "files/sleep.png";
var g_tailHintPath = "files/tailhint.png";
var g_highscoreFlags =
{
    bestEver : "files/highscores_bestever.png",
    weeksBest : "files/highscores_weeksbest.png",
    todaysBest : "files/highscores_todaysbest.png"
}

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
// NB: There's a good chance this doesn't work with Firefox (as of this writing)
// NB2: Yeah, just fixed so not yet in release version (10.0):
// -> https://bugzilla.mozilla.org/show_bug.cgi?id=647518
window.cancelRequestAnimFrame = (function() {
  return window.cancelRequestAnimationFrame ||
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
    _mgr.queueDownload(g_arrowHoverPaths.east);
    _mgr.queueDownload(g_arrowHoverPaths.west);
    _mgr.queueDownload(g_arrowHoverPaths.south);
    _mgr.queueDownload(g_arrowHoverPaths.north);
    _mgr.queueDownload(g_applePath);
    _mgr.queueDownload(g_fullgridPath);
    _mgr.queueDownload(g_victoryPath);
    _mgr.queueDownload(g_failPath);
    _mgr.queueDownload(g_sleepPath);
    _mgr.queueDownload(g_tailHintPath);
    _mgr.queueDownload(g_highscoreFlags.bestEver);
    _mgr.queueDownload(g_highscoreFlags.weeksBest);
    _mgr.queueDownload(g_highscoreFlags.todaysBest);
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
        src += "&hashtags=snake";
        src += "&count=none";
        src += "&text=I was there when we reached the score of " + g_score + " on ";
        if (!g_pokki)
        {
            window.open(src,"","width=550,height=450");
        }
        else
        {
            pokki.openURLInDefaultBrowser(src);
        }
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
function init(_serverAddress, _test, _pokki)
{
    g_test = _test;
    
    // Pokki-specific init
    g_pokki = _pokki;
    if (g_pokki)
    {
        log("I'm a Pokki");
    }
    
    // if no nodejs server is specified, use the current one
    if (!_serverAddress)
    {
        g_serverAddress = "/";
    }
    else
    {
        g_serverAddress = _serverAddress;
    }
    
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

    // show loading = clear canvas
    log("Loading...");
    g_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMessage("Loading ballot paper... please be patient, citizen.", false);
    
    // check if the user Likes us on Facebook
    if (!(typeof FB === "undefined"))
    {
        FB.getLoginStatus(processFBLoginStatus, true);
    }
    
    // queue assets, download them, then connect socket
    g_assets = new AssetManager();
    queueAssets(g_assets);
    g_assets.downloadAll(connect);
}

function processFBLoginStatus(response)
{
    log("Facebook: callback");
    
    if (response.status == 'connected')
    {
        var user_id = response.authResponse.userID;
        //var page_id = "40796308305"; //coca cola
        var page_id = "269406253129143"; // our page
        var fql_query = "SELECT uid FROM page_fan WHERE page_id =" + page_id + " and uid=" + user_id;
        var the_query = FB.Data.query(fql_query);

        the_query.wait(function(rows)
        {
            if (rows.length == 1 && rows[0].uid == user_id)
            {
                log("Facebook: liked");
                g_elector = true;
            }
            else
            {
                log("Facebook: not liked");
            }
        });
    }
    else
    {
        // user is not logged in
        log("Facebook: not logged in");
    }
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
}

function stop(_callback, _msg)
{
    g_stopped = true;
   
    // reset cursor
    g_canvas.style.cursor = "default";
    
    // stop
    log("Stop! " + _msg);
    hideVictoryTweet();
    cancelUpdates();
    _callback();
}

function drawServerDown()
{
    g_clientState = CS_DOWN;
    
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
    log("Disconnected :(");
    if (!g_pokki)
    {
        drawMessage("Connection with the server lost... Try to refresh your page in a moment.", false);
    }
    else
    {
        drawMessage("Connection issue... Wait a moment or come back later.", false);
    }
}

function drawServerUpgrade()
{
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
    if (!g_pokki)
    {
        drawMessage("The server was just upgraded. Refresh your page. If this doesn't work, try clearing your cache.", true);
    }
    else
    {
        drawMessage("The server was just upgraded. Your Pokki should update as well very soon, keep an eye on it!", true);
    }
}

function drawSleep()
{
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
    drawMessage("Sleeping. Move your mouse over the game, or press any key to reconnect with the server.", true);   
}

function connect()
{
    // if io isn't defined, this means we didn't receive socket.io.(min.)js, so the server is down
    if (typeof io === 'undefined') // http://stackoverflow.com/questions/519145/how-can-i-check-whether-a-variable-is-defined-in-javascript
    {
        // this should not happen in production, where all static content is served
        //  - for WWW: on a separate server
        //  - for Pokki: on the client HDD
        if (!g_test)
        {
            log("ERROR: io is undefined, is socket.io.min.js missing?");
        }
        
        // quit
        stop(drawServerDown, "Undefined io");
        return;
    }

    // show loading = clear canvas
    g_connecting = true;
    log("Connecting...");
    g_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMessage("Connecting to polling station... please stay patient, citizen.", false);

    // connect to node.js server
    // NB: after first attempt, forcing connection otherwise socket.io will
    // give us the same handle, that already failed
    if (g_connectionCount++ >= 1)
    {
        if (g_socket != null)
        {
            log("WARNING: we were still connected");
            disconnect();
        }
        g_socket = io.connect(g_serverAddress, {"force new connection": true});
    }
    else
    {
        g_socket = io.connect(g_serverAddress);
    }
    g_connectTimeoutHandle = setTimeout(connectTimeout, CONNECT_TIMEOUT);

    // error
    g_socket.on(MSG_ERROR, processError);

    // connection
    g_socket.on(MSG_CONNECT, processConnect);

    // disconnection
    g_socket.on(MSG_DISCONNECT, processDisconnect);

    // ping
    g_socket.on(MSG_PING, processPing);
}

function processError(_reason)
{
    // NB: some combinations of nodejs servers and browsers throw this
    // then works anyways, so we're giving it some tolerance
    if (!g_pokki)
    {
        g_socketErrorCount++;
        log("WARNING: socket.io reports an error (count: " + g_socketErrorCount + ") ", _reason);
        if (g_socketErrorCount > MAX_SOCKET_ERROR)
        {
            // quit
            disconnect();
            stop(drawServerDown, "Socket.io error");
        }
    }
    // for Pokki, the situation is much more stable, so report errors
    // immediately
    else
    {
        // quit
        log("ERROR: socket.io reports an error " + _reason);
        disconnect();
        stop(drawServerDown, "Socket.io error");
    }
}

function processDisconnect()
{
    disconnect(true);
    stop(drawServerDown, "Disconnect message");
}

function disconnect(_fromDisconnectMessage)
{
    if (g_socket == null)
    {
        log("Already disconnected");
        return;
    }

    log("Disconnect");
    g_connecting = false;
    g_backPingRequested = false;

    // we don't want a time out to occur as we're *already* reconnected, this
    // would disconnect us for no reason
    clearConnectTimeout();    

    // remove listeners, so nothing happen if the server sends anything to an
    // outdated socket
    g_socket.removeListener(MSG_ERROR, processError); 
    g_socket.removeListener(MSG_CONNECT, processConnect); 
    g_socket.removeListener(MSG_DISCONNECT, processDisconnect); 
    g_socket.removeListener(MSG_PING, processPing); 
    g_socket.removeListener(MSG_MESSAGE, processMessage); 
    g_socket.removeListener(MSG_CLIENTSTATE, processClientState);

    // disconnect socket, if that's not already done
    if (_fromDisconnectMessage)
    {
        g_socket.disconnect();
    }
    
    // clean reference
    g_socket = null;
}

// I'm back! send me the game state!
function requestBackPing()
{
    if (g_backPingRequested)
    {
        return;
    }
    g_backPingRequested = true;
    
    // show loading = clear canvas
    log("Reconnecting...");
    g_context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMessage("Reconnecting to polling station... please stay patient, citizen.", false);

    g_socket.emit(MSG_BACK);
}

// take action depending on what state the server tells us we are
function processClientState(_newState)
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

    if (_newState == CS_SLEEP)
    {
        log("Sleeping...");
        stop(drawSleep, "Sleep");
    }
    else if (_newState == CS_IDLE)
    {
        log("Idle...");
        // don't stop, as the next call to update will request a back ping
    }
    else
    {
        if (g_clientState == CS_SLEEP || g_clientState == CS_IDLE)
        {
            log("Back!");
        }

        if (_newState == CS_ACTIVE) log("Active!");
        else if (_newState == CS_SPECTATOR) log("Spectator.");
    }

    g_clientState = _newState;
    g_lastMessageTime = new Date().getTime();
}

// connect timeout
function connectTimeout()
{
    disconnect();
    stop(drawServerDown, "Timeout");   
}

function clearConnectTimeout()
{
    if (g_connectTimeoutHandle)
    {
        clearTimeout(g_connectTimeoutHandle);
        g_connectTimeoutHandle = null;
    }
}

// connect
function processConnect()
{
    log("Connected!");

    clearConnectTimeout();

    // messages
    g_socket.on(MSG_MESSAGE, processMessage);

    // client state
    g_socket.on(MSG_CLIENTSTATE, processClientState);

    // test messages
    if (g_test)
    {
        g_socket.on(MSG_TESTMSG, processTestmsg);
    }
    
    // if already connected, cancel updates, they'll restart when the ping
    // message is received
    if (g_connectionCount >= 1)
    {
        cancelUpdates();
    }
    
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
    log("Ping received...");

    // assume we (re)start active on server
    g_clientState = CS_ACTIVE;
    g_backPingRequested = false;

    // check revision
    if (!_ping.revision || _ping.revision != REVISION)
    {
        disconnect();
        stop(drawServerUpgrade, "Upgrade");
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

    log("Running :)");
    
    g_connecting = false;
    g_stopped = false;
    
    update();
    idleCheck();
    
    if (g_test)
    {
        updateSpamBots();
    }
}

function findPos(e, obj)
{
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

    // http://www.quirksmode.org/js/findpos.html
    if (obj.offsetParent)
    {
        do
        {
			posx -= obj.offsetLeft;
			posy -= obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return [posx,posy];
}

function mouseDown(e)
{
    return false;
}

function mouseUp(e)
{
    //log("mouseUp")

    // awaken
    if (g_clientState == CS_SLEEP)
    {
        requestBackPing();
        return;
    }

	var button = null;
    
    if (!e) var e = window.event;
	if (e.button) button = e.button;
	else button = e.which;
	if (button == null ) return;

    if (button==1)
    {
        //log("left click");

        var canvasPos = findPos(e, g_canvas);
        g_clickX = canvasPos[0];
        g_clickY = canvasPos[1];

        //log("clickx:" + g_clickX + " clicky:" + g_clickY);
    }

    return false;
}

function mouseMove(e)
{
    //log("mouseMove")

    // awaken
    if (g_clientState == CS_SLEEP)
    {
        requestBackPing();
        return;
    }
    
    var canvasPos = findPos(e, g_canvas);
    g_mouseX = canvasPos[0];
    g_mouseY = canvasPos[1];
}

function keyDown(e)
{
}

function keyUp(e)
{
    //log("keyUp")

    // awaken
    if (g_clientState == CS_SLEEP)
    {
        requestBackPing();
        return;
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
    // stop didn't work properly
    if (g_stopped)
    {
        log("WARNING: stopped but still updating, stopping now!");
        return;
    }
    
    // client stopped updating, went idle, but it's now updating again, tell the
    // server he's back with us, and request the new game state
    if (g_clientState == CS_IDLE)
    {
        stop(requestBackPing, "Back ping request");
        return;
    }

    // plan next update
    g_updateHandle = window.requestAnimFrame(update);

    var time = new Date().getTime();
    var dt = time - g_lastTime;
    
    // check if server is still online
    // NB: no need to update when draw is paused
    if (!g_drawPaused)
    {
        if (serverDownCheck(time))
        {
            return;
        }
    }

    // in test mode, request server memory footprint
    if (g_test)
    {
        g_socket.emit(MSG_TESTMSG, { name : TMSGN_MEM });
    }

    // draw
    if (!g_drawPaused)
    {
        draw(time);
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
    
    // stats
    // NB: no need to update when draw is paused
    if (!g_drawPaused)
    {
        updateStats(dt);
    }

    // tail hint
    // NB: no need to update when draw is paused, this has the additional
    // benefit of showing the hint to Pokki users that just came back and would
    // otherwise have missed it
    if (!g_drawPaused)
    {
        updateTailHint(time);
    }

    g_lastTime = time;
}

function updateStats(_dt)
{
    // mandatory
    if (g_playerCountElement)
    {
        if (g_totalPlayerCount == 0)
        {
            g_playerCountElement.innerHTML = "&#x2014;";
        }
        else
        {
            g_playerCountElement.innerHTML = g_activePlayerCount + " <small>/ " + g_totalPlayerCount + "</small>";
            
            // for WWW, notify of player count via title
            // NB: for Pokki, notify of player count via badge, cf. background.js
            if (!g_pokki)
            {
                if (g_clientState == CS_ACTIVE)
                {
                    document.title = g_initialTitle;
                }
                else
                {
                    document.title = "[" + g_activePlayerCount + "/" + g_totalPlayerCount + "] " + g_initialTitle;
                }
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

// draw
function draw(_time)
{
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

        // mouse hover
        // Pokki Requirement: Hover states
        var hover = -1;
        if (g_mouseX != -1 && g_mouseY != -1)
        {
            var x = Math.floor(g_mouseX / SPRITE_SIZE);
            var y = Math.floor(g_mouseY / SPRITE_SIZE);
            
            if (y == head.y)
            {
                if (x == head.x+1)
                {
                    hover = EAST;
                }
                else if (x == head.x-1)
                {
                    hover = WEST;
                }
            }
            else if (x == head.x)
            {
                if (y == head.y+1)
                {
                    hover = SOUTH;
                }
                else if (y == head.y-1)
                {
                    hover = NORTH;
                }
            }            
        }
        //if (hover != -1) log("hover " + hover);
        
        // update mouse pointer
        if (hover == -1)
        {
            g_canvas.style.cursor = "default";
        }
        else
        {
            g_canvas.style.cursor = "pointer";
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
            var hintDT = _time - g_tailHintSwitchTime;
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
            else if (drawEast && hover == EAST)
            {
                var point = new vec2(head.x+1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowHoverPaths.east],
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
            else if (drawWest && hover == WEST)
            {
                var point = new vec2(head.x-1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowHoverPaths.west],
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
            else if (drawSouth && hover == SOUTH)
            {
                var point = new vec2(head.x, head.y+1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowHoverPaths.south],
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
            else if (drawNorth && hover == NORTH)
            {
                var point = new vec2(head.x, head.y-1);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    g_assets.cache[g_arrowHoverPaths.north],
                    coords.x, coords.y,
                    SPRITE_SIZE, SPRITE_SIZE
                );
            }
        }
    }
    
    // draw overlays
    if (g_state == GS_VICTORY)
    {
        // img
        g_context.drawImage(
            g_assets.cache[g_victoryPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // score
        drawEndGameScore();
        
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
        
        // score
        drawEndGameScore();
        
        // draw countdown
        var message = "Starting a new game soon...";
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
    if (g_state == GS_VICTORY || g_state == GS_FAIL)
    {
        showVictoryTweet();
    }
    else
    {
        hideVictoryTweet();
        
        // + reset highscore flag
        g_highscoreFlag = null;
    }    
}

function applyScore()
{
    // new highscore
    if (g_score > g_highscores.todaysBest)
    {
        log("Today's best score!");
        g_highscores.todaysBest = g_score;
        g_highscoreFlag = g_highscoreFlags.todaysBest;

        // new weekly highscore
        if (g_score > g_highscores.weeksBest)
        {
            log("This week's best score!");
            g_highscores.weeksBest = g_score;
            g_highscoreFlag = g_highscoreFlags.weeksBest;
            
            // wow! new best score ever
            if (g_score > g_highscores.bestEver)
            {
                log("Best score ever!");
                g_highscores.bestEver = g_score;
                g_highscoreFlag = g_highscoreFlags.bestEver;            
            }
        }
    }
}

function drawEndGameScore()
{
    // backup font
    var bkpFont = g_context.font;
    var bkpAlign = g_context.textAlign;

    // draw score
    g_context.font = "30pt Arial Bold";
    g_context.textAlign = "center";
    g_context.fillStyle = "#000000";
    g_context.fillText(g_score, 240, 285);
    
    // restore font
    g_context.font = bkpFont;
    g_context.textAlign = bkpAlign;    
    
    // draw highscore flag
    if (g_highscoreFlag)
    {
        g_context.drawImage(
            g_assets.cache[g_highscoreFlag],
            100, 248);
    }
}

// detect idle client
// = not updating for too long, works only with browsers with a version
// requestAnimationFrame properly implemented
// NB: if IDLE_THRESHOLD > SLEEP_THRESHOLD*MOVE_DELAY, idle will be inoperant as
// the server will put us to sleep before we can go idle
function idleCheck()
{
    if (g_stopped)
    {
        // stop didn't work properly
        log("WARNING: stopped but still doing idle check, stopping now!");
        return;
    }
    
    var time = new Date().getTime();
    var dt = time - g_lastTime;
    if (dt > IDLE_THRESHOLD)
    {
        if (g_pokki)
        {
            // NB: at time of this writing, hidden Pokkis still call they're
            // requestAnimationFrame'ed callbacks when hidden, so they never go
            // idle. Putting a warning in case this ever changes.
            log("WARNING: Pokki went idle. This could cause trouble.");
        }
        g_socket.emit(MSG_IDLE);
    }
    else
    {
        g_idleCheckTimeoutHandle = setTimeout(idleCheck, IDLE_CHECK_INTERVAL);
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
        disconnect();
        stop(drawServerDown, "Server down");
        return true;
    }
    return false;
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
function cheatElector()
{
    g_elector = !g_elector;
    if (g_elector) log("Elector");
    else log("Not elector");
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
            spamSocket.removeListener(MSG_PING);
            spamSocket.disconnect();
            spamSocket = null;
        }
    }
}
function updateSpamBots()
{
    if (!g_stopped)
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
            spamSocket.emit(MSG_MESSAGE, { name : MSGN_VOTE, move : g_move, value : voteValue, elector : false });
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
    if (g_state == GS_PLAYING && g_votesThisMove < MAX_VOTES_PER_MOVE)
    {
        //log("vote: " + _value);
        g_socket.emit(MSG_MESSAGE, { name : MSGN_VOTE, move : g_move, value : _value, elector : g_elector });
        ++g_votesThisMove;

        // assume a vote sets us active on server
        g_clientState = CS_ACTIVE;
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

            applyScore();
        }
        else if (_message.state == GS_VICTORY)
        {
            g_state = GS_VICTORY;
            g_move = 0;
            g_votesThisMove = 0;
            g_lastVoteMove = 0;
            g_pauseStartTime = new Date().getTime();
            
            applyScore();
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
            g_activePlayerCount = _message.activePlayerCount;
            g_totalPlayerCount = _message.totalPlayerCount;

            // for WWW, notify of player count via title
            // NB: for Pokki, notify of player count via badge, cf. background.js
            if (!g_pokki)
            {
                document.title = "[" + g_activePlayerCount + "/" + g_totalPlayerCount + "] " + g_initialTitle;
            }
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
    src += "&hashtags=snake";
    src += "&count=none";
    src += "&text=Give me an apple!"
    window.open(src,"","width=550,height=450");
    return true;
}

// Pokki wrapper
function pokkiRestartIfStopped()
{
    if (!g_socket && !g_connecting)
    {
        log("Periodic reconnection attempt...");
        connect();
    }
}
function pokkiShowing()
{
    if (!g_pokki)
    {
        log("WARNING: called pokkiShowing but I'm no Pokki, thanks.");
        return;
    }
    
    // Pokki Guidelines: Network connection issues
    if (!g_socket && !g_connecting)
    {
        log("Reconnection attempt...");
        connect();
    }
    // awaken if was sleeping
    else if (g_clientState == CS_SLEEP && !g_backPingRequested)
    {
        requestBackPing();
    }
}
function pokkiShown()
{
    if (!g_pokki)
    {
        log("WARNING: called pokkiShown but I'm no Pokki, thanks.");
        return;
    }

    // (re)start drawing
    // Pokki Requirement: Pausing computationally intensive tasks
    g_drawPaused = false;
}
function pokkiHidden()
{
    if (!g_pokki)
    {
        log("WARNING: called pokkiHidden but I'm no Pokki, thanks.");
        return;
    }
    
    // stop drawing
    // Pokki Requirement: Pausing computationally intensive tasks
    g_drawPaused = true;
}
function pokkiUnload()
{
    if (!g_pokki)
    {
        log("WARNING: called pokkiUnload but I'm no Pokki, thanks.");
        return;
    }
    
    // disconnect when Pokki is unloaded
    if (g_socket)
    {
        disconnect();
    }
}
function pokkiGetActivePlayerCount()
{
    if (!g_pokki)
    {
        log("WARNING: called pokkiGetActivePlayerCount but I'm no Pokki, thanks.");
        return 0;
    }
    
    // so the pokki can display newly active players
    return g_activePlayerCount;
}