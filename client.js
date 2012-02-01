// global constants
var SERVER_ADDRESS = "/";
var SERVER_TEST_ADDRESS = "snakedemocracy.dyndns.org:3000";
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 480;
var SPRITE_SIZE = 24;
var SELECT_FRAMES = 3;
var MAX_VOTES_PER_MOVE = 10;
var SPECTATOR_THRESHOLD = 5; // in snake moves
var IDLE_CHECK_INTERVAL = 1000; // in ms
var IDLE_THRESHOLD = 10000; // in ms

// global variables
var g_context = null;
var g_canvas = null;
var g_socket = null;
var g_assets = null;
var g_snake = null;
var g_apples = null;
var g_opinion = null;
var g_state = null;
var g_move = 0;
var g_playerCount = 0;
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
var g_clientStateElement = null;
var g_moveElement = null;
var g_fpsElement = null;
var g_test = null;
var g_clientState = null;
var g_lastTime = null;
var g_lastVoteMove = 0;

// assets
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
var g_defeatPath = "files/defeat.png";

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
    _mgr.queueDownload(g_defeatPath);
}

function setClientState(_newState)
{
    if (_newState == g_clientState)
    {
        return;
    }
    
    // notify server about idle clients (spectators are detected on the
    // server to avoid extra traffic)
    if (g_socket)
    {
        if (_newState == "idle")
        {
            log("Idle.");
            g_socket.emit("idle");
        }
        else if (g_clientState == "idle")
        {
            log("Back!");
            g_socket.emit("back");
        }
    }

    g_clientState = _newState;
}

// client init, called with body's onload
function init(_test)
{
    g_test = _test;
    
    setClientState("active")

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
    if (!g_playerCountElement ||
        !g_numLeftElement ||
        !g_numForwardElement ||
        !g_numRightElement ||
        !g_scoreElement)
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
	g_canvas.oncontextmenu = function() { return false; };
    g_canvas.onselectstart = function() {return false;} // ie
    //g_canvas.onmousedown = function() {return false;} // mozilla
    document.onkeydown = keyDown;
    document.onkeyup = keyUp;

    log("Loading...");
    
    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g_context.fillStyle = "#000000";
    g_context.fillText(
        "Loading ballot paper... please be patient, citizen.",
        150, 240);
    
    // queue assets, download them, then connect socket
    g_assets = new AssetManager();
    queueAssets(g_assets);
    g_assets.downloadAll(connect);
}

function connect()
{
    log("Connecting...");

    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g_context.fillStyle = "#000000";
    g_context.fillText(
        "Connecting to polling station... please remain patient, citizen.",
        150, 240);

    // connect to node.js server
    g_socket = io.connect(g_test ? SERVER_TEST_ADDRESS : SERVER_ADDRESS);
    g_socket.on("ping", function (message)
    {
        log("Connected! Running!");
        processPing(message);
        
        g_lastTime = new Date().getTime();
        g_lastVoteMove = 0;
        update();
        idleCheck();
        
        if (g_test)
        {
            updateSpamBots();
        }
    });
}

// ping, first message, inits the snake
function processPing(message)
{
    // copy initial snake
    g_snake = new Array();
    for (var i=0; i<message.snake.length; ++i)
    {
        g_snake.push(new vec2(message.snake[i].x, message.snake[i].y));
    }

    // copy initial apples
    g_apples = new Array();
    for (var i=0; i<message.apples.length; ++i)
    {
        g_apples.push(new vec2(message.apples[i].x, message.apples[i].y));
    }

    // set game state
    g_state = message.state;
    if (!g_state.name)
    {
        log("ERROR: un-named state");
    }

    g_socket.on("message", function (message) { processMessage(message) });
    
    if (g_test)
    {
        g_socket.on("testmsg", function (message) { processTestmsg(message) });
    }
}

function mouseDown(e)
{
    return false;
}

function mouseUp(e)
{
	var button = null;	
	if (e.button) button = e.button;
	else button = e.which;
	if (button == null ) return;

    if (button==1)
    {
        g_clickX = e.layerX - g_canvas.offsetLeft;
        g_clickY = e.layerY - g_canvas.offsetTop;
    }

    return false;
}

function keyDown(e)
{
}

function keyUp(e)
{
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
      /*img.addEventListener("load", function() {
          that.successCount += 1;
          if (that.isDone()) { callback(); }
      });*/
      img.onload = function() 
      {
          that.successCount += 1;
          //that.cache[path] = this; // yeah...
          if (that.isDone()) { callback(); }
      };          
      /*img.addEventListener("error", function() {
          that.errorCount += 1;
          if (that.isDone()) { callback(); }
      });*/
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
    requestAnimFrame(update);

    // yey! back with us
    if (g_clientState == "idle")
    {
        setClientState("spectator");
        return; // TODO: wait for backping before updating, just skip one frame for now
    }
    
    var time = new Date().getTime();
    var dt = time - g_lastTime;
    
    if (g_test)
    {
        g_socket.emit("testmsg", { name : "mem" });
    }

    // clear canvas
    //g_context.fillStyle = "#000000";
    //g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g_context.drawImage(
        g_assets.cache[g_fullgridPath],
        0, 0,
        CANVAS_WIDTH, CANVAS_HEIGHT);

    if (g_snake.length > 1 && g_state.name == "playing")
    {
        // determine head direction...
        var head = g_snake[g_snake.length-1].clone();
        var neck = g_snake[g_snake.length-2].clone();
        var direction = null;
        if (head.x != neck.x)
        {
            if (head.x > neck.x) direction = "east";
            else direction = "west";
        }
        else
        {
            if (head.y > neck.y) direction = "south";
            else direction = "north";
        }

        // .. and tail direction
        var pretail = g_snake[1].clone();
        var tail = g_snake[0].clone();
        var tailDirection = null;
        if (pretail.x != tail.x)
        {
            if (pretail.x > tail.x) tailDirection = "east";
            else tailDirection = "west";
        }
        else
        {
            if (pretail.y > tail.y) tailDirection = "south";
            else tailDirection = "north";
        }

        // apply mouse input
        if (g_clickX != -1 && g_clickY != -1)
        {
            var headPos = g_snake[g_snake.length-1];
            var x = Math.floor(g_clickX / SPRITE_SIZE);
            var y = Math.floor(g_clickY / SPRITE_SIZE);
            
            //log(headPos.x + "," + headPos.y);
            //log(x + "," + y);
            
            if (y == headPos.y)
            {
                if (x == headPos.x+1)
                {
                    if (direction == "north") vote("right");
                    if (direction == "east") vote("forward");
                    if (direction == "south") vote("left");
                    g_selectEast = SELECT_FRAMES;
                }
                else if (x == headPos.x-1)
                {
                    if (direction == "south") vote("right");
                    if (direction == "west") vote("forward");
                    if (direction == "north") vote("left");
                    g_selectWest = SELECT_FRAMES;
                }
            }
            else if (x == headPos.x)
            {
                if (y == headPos.y+1)
                {
                    if (direction == "east") vote("right");
                    if (direction == "south") vote("forward");
                    if (direction == "west") vote("left");
                    g_selectSouth = SELECT_FRAMES;
                }
                else if (y == headPos.y-1)
                {
                    if (direction == "west") vote("right");
                    if (direction == "north") vote("forward");
                    if (direction == "east") vote("left");
                    g_selectNorth = SELECT_FRAMES;
                }
            }
        }

        // apply keyboard input
        if (g_keyLeft)
        {
            if (direction == "west") vote("forward");
            else if (direction == "south") vote("right");
            else if (direction == "north") vote("left");
            if (direction != "east") g_selectWest = SELECT_FRAMES;
        }
        else if (g_keyUp)
        {
            if (direction == "north") vote("forward");
            else if (direction == "east") vote("left");
            else if (direction == "west") vote("right");
            if (direction != "south") g_selectNorth = SELECT_FRAMES;
        }
        else if (g_keyRight)
        {
            if (direction == "south") vote("left");
            else if (direction == "east") vote("forward");
            else if (direction == "north") vote("right");
            if (direction != "west") g_selectEast = SELECT_FRAMES;
        }
        else if (g_keyDown)
        {
            if (direction == "south") vote("forward");
            else if (direction == "east") vote("right");
            else if (direction == "west") vote("left");
            if (direction != "north") g_selectSouth = SELECT_FRAMES;
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
        var tailCoords = getScreenCoords(tail);
        var tailImg = null;
        if (tailDirection == "east") tailImg = g_assets.cache[g_tailPaths.east];
        else if (tailDirection == "west") tailImg = g_assets.cache[g_tailPaths.west];
        else if (tailDirection == "south") tailImg = g_assets.cache[g_tailPaths.south];
        else /*(tailDirection == "north")*/ tailImg = g_assets.cache[g_tailPaths.north];
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
                if (previous.x > current.x) prevDir = "east";
                else prevDir = "west";
            }
            else
            {
                if (previous.y > current.y) prevDir = "south";
                else prevDir = "north";
            }
            if (current.x != next.x)
            {
                if (current.x > next.x) nextDir = "west";
                else nextDir = "east";
            }
            else
            {
                if (current.y > next.y) nextDir = "north";
                else nextDir = "south";
            }

            var bodyCoords = getScreenCoords(g_snake[i]);
            var bodyImg = null;
            if (prevDir == "east" && nextDir == "west") bodyImg = g_assets.cache[g_bodyPaths.hz];
            else if (nextDir == "east" && prevDir == "west") bodyImg = g_assets.cache[g_bodyPaths.hz];
            else if (prevDir == "south" && nextDir == "north") bodyImg = g_assets.cache[g_bodyPaths.vt];
            else if (nextDir == "south" && prevDir == "north") bodyImg = g_assets.cache[g_bodyPaths.vt];
            else if (prevDir == "east" && nextDir == "south") bodyImg = g_assets.cache[g_bodyPaths.es];
            else if (nextDir == "east" && prevDir == "south") bodyImg = g_assets.cache[g_bodyPaths.es];
            else if (prevDir == "south" && nextDir == "west") bodyImg = g_assets.cache[g_bodyPaths.sw];
            else if (nextDir == "south" && prevDir == "west") bodyImg = g_assets.cache[g_bodyPaths.sw];
            else if (prevDir == "west" && nextDir == "north") bodyImg = g_assets.cache[g_bodyPaths.wn];
            else if (nextDir == "west" && prevDir == "north") bodyImg = g_assets.cache[g_bodyPaths.wn];
            else if (prevDir == "north" && nextDir == "east") bodyImg = g_assets.cache[g_bodyPaths.ne];
            else /*(nextDir == "north" && prevDir == "east")*/ bodyImg = g_assets.cache[g_bodyPaths.ne];
            g_context.drawImage(
                bodyImg,
                bodyCoords.x, bodyCoords.y,
                SPRITE_SIZE, SPRITE_SIZE
            );
        }
        
        // draw head
        var headCoords = getScreenCoords(head);
        var headImg = null;
        if (direction == "east") headImg = g_assets.cache[g_headPaths.east];
        else if (direction == "west") headImg = g_assets.cache[g_headPaths.west];
        else if (direction == "south") headImg = g_assets.cache[g_headPaths.south];
        else /*(direction == "north")*/ headImg = g_assets.cache[g_headPaths.north];
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
            if (direction == "east")
            {
                drawWest = false;
                if (g_opinion.current == "forward") drawGold = "east";
                else if (g_opinion.current == "left") drawGold = "north";
                else if (g_opinion.current == "right") drawGold = "south";
            }
            // west
            else if (direction == "west")
            {
                direction = "west";
                drawEast = false;
                if (g_opinion.current == "forward") drawGold = "west";
                else if (g_opinion.current == "left") drawGold = "south";
                else if (g_opinion.current == "right") drawGold = "north";
            }
            // south
            else if (direction == "south")
            {
                direction = "south";
                drawNorth = false;
                if (g_opinion.current == "forward") drawGold = "south";
                else if (g_opinion.current == "left") drawGold = "east";
                else if (g_opinion.current == "right") drawGold = "west";
            }
            // north
            else
            {
                direction = "north";
                drawSouth = false;
                if (g_opinion.current == "forward") drawGold = "north";
                else if (g_opinion.current == "left") drawGold = "west";
                else if (g_opinion.current == "right") drawGold = "east";
            }

            if (drawEast)
            {
                var point = new vec2(head.x+1, head.y);
                var coords = getScreenCoords(point);
                g_context.drawImage(
                    (drawGold == "east")
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
                    (drawGold == "west")
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
                    (drawGold == "south")
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
                    (drawGold == "north")
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

    // draw end game overlay
    if (g_state.name == "victory")
    {
        g_context.drawImage(
            g_assets.cache[g_victoryPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // TODO: draw score
        // TODO: draw countdown
    }
    else if (g_state.name == "defeat")
    {
        g_context.drawImage(
            g_assets.cache[g_defeatPath],
            0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // TODO: draw countdown
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
    
    // chek if not voting
    spectatorCheck(time);

    // stats
    updateStats(dt);
    g_lastTime = time;
}

function updateStats(_dt)
{
    // mandatory
    if (g_playerCountElement)
    {
        if (g_playerCount == 0)
        {
            g_playerCountElement.innerHTML = " :(";
        }
        else
        {
            g_playerCountElement.innerHTML = g_playerCount;
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
        g_scoreElement.innerHTML = g_score;
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

// detect spectator client
function spectatorCheck(_time)
{
    var dmove = g_move - g_lastVoteMove;
    if (dmove > SPECTATOR_THRESHOLD)
    {
        setClientState("spectator")
    }
}

// detect idle client
function idleCheck()
{
    var time = new Date().getTime();
    var dt = time - g_lastTime;
    if (dt > IDLE_THRESHOLD)
    {
        setClientState("idle")
    }
    setTimeout("idleCheck()", IDLE_CHECK_INTERVAL);
}

// test/cheat/tweaks
function cheatKill()
{
    g_socket.emit("testmsg", { name : "cheatKill" });
}
function cheatRestart()
{
    g_socket.emit("testmsg", { name : "cheatRestart" });
}
function cheatTweet()
{
    g_socket.emit("testmsg", { name : "cheatTweet" });
}
var g_spamBots = new Array();
function addSpamBot(_count)
{
    for (var i=0; i<_count; ++i)
    {
        var spamSocket = io.connect(SERVER_TEST_ADDRESS, {"force new connection": true});
        spamSocket.on("ping", function (message)
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
    for (var i=0; i<g_spamBots.length; ++i)
    {
        var spamSocket = g_spamBots[i];

        // couldn't connect, remove from array
        if (!spamSocket)
        {
            g_spamBots.splice(i, 1); 
        }
        
        // cast random vote
        if (g_state.name == "playing")
        {
            var pick = Math.floor(Math.random()*3);
            var voteValue = null;
            if (pick==0) voteValue = "left";
            else if (pick==1) voteValue = "forward";
            else if (pick==2) voteValue = "right";
            else log("ERROR: Math.random went mad?");
            //log("SPAM: " + voteValue);
            spamSocket.emit("message", { name : "vote", move : g_move, value : voteValue });
        }
    }
    
    setTimeout("updateSpamBots()", 200); // vote 10 times in 2s
}
function submitTweaks()
{
    var element = document.getElementById("moveDelay");
    if (!element)
    {
        log("ERROR: can't get move delay element");
        return false;
    }
    log("TWEAK: move delay change to " + element.innerHTML);
    g_socket.emit("testmsg", { name : "moveDelayChange" , value : element.value });

    element = document.getElementById("pauseDelay");
    if (!element)
    {
        log("ERROR: can't get pause delay element");
        return false;
    }
    log("TWEAK: pause delay change to " + element.innerHTML);
    g_socket.emit("testmsg", { name : "pauseDelayChange" , value : element.value });

    return true;
}

// VOTE
function vote(_value)
{
    g_lastVoteMove = g_move;
    setClientState("active");
    if (g_state.name == "playing" && g_votesThisMove < MAX_VOTES_PER_MOVE)
    {
        //log("vote: " + _value);
        g_socket.emit("message", { name : "vote", move : g_move, value : _value });
        ++g_votesThisMove;
    }
}

function processMessage(_message)
{
    //log("MESSAGE:" + _message.name + " (" + _message.value + ")");

    // update player count & score
    g_playerCount = _message.playerCount;
    g_score = _message.score;

    if (_message.name == "opinion")
    {
        g_opinion = {};
        g_opinion.current = _message.value.current;
        g_opinion.numLeft = _message.value.numLeft;
        g_opinion.numRight = _message.value.numRight;
        g_opinion.numForward = _message.value.numForward;
        //log(g_opinion.numLeft);
    }
    else if (_message.name == "grow")
    {
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
            
        g_move = _message.move;
        g_votesThisMove = 0;

        // reset opinion
        g_opinion = {};
        g_opinion.current = "forward";
        g_opinion.numLeft = 0;
        g_opinion.numRight = 0;
        g_opinion.numForward = 0;
    }
    else if (_message.name == "move")
    {
        g_snake.shift();
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??

        g_move = _message.move;
        g_votesThisMove = 0;

        // reset opinion
        g_opinion = {};
        g_opinion.current = "forward";
        g_opinion.numLeft = 0;
        g_opinion.numRight = 0;
        g_opinion.numForward = 0;
    }
    else if (_message.name == "defeat")
    {
        g_state = _message;
        g_move = 0;
        g_votesThisMove = 0;
        g_lastVoteMove = 0;
    }
    else if (_message.name == "victory")
    {
        g_state = _message;
        g_move = 0;
        g_votesThisMove = 0;
        g_lastVoteMove = 0;
    }
    else if (_message.name == "playing")
    {
        g_state = { name : _message.name  };
        g_move = 0;
        g_votesThisMove = 0;
        g_lastVoteMove = 0;

        // copy snakes
        g_snake = new Array();
        for (var i=0; i<_message.snake.length; ++i)
        {
            g_snake.push(new vec2(_message.snake[i].x, _message.snake[i].y)); // meh??
        }

        // copy apples
        g_apples = new Array();
        for (var i=0; i<_message.apples.length; ++i)
        {
            if (_message.apples[i]) // CRASH fix
            {
                g_apples.push(new vec2(_message.apples[i].x, _message.apples[i].y)); // meh??
            }
        }
    }
    else if (_message.name == "spawn")
    {
        if (_message.value == "apple")
        {
            g_apples.push(new vec2(_message.position.x, _message.position.y));
        }
    }
    else if (_message.name == "pickup")
    {
        if (_message.value == "apple")
        {
            g_apples.splice(_message.idx, 1);
        }
    }
    else if (_message.name == "backping")
    {
        // copy snakes
        g_snake = new Array();
        for (var i=0; i<_message.snake.length; ++i)
        {
            g_snake.push(new vec2(_message.snake[i].x, _message.snake[i].y)); // meh??
        }

        // copy apples
        g_apples = new Array();
        for (var i=0; i<_message.apples.length; ++i)
        {
            if (_message.apples[i]) // CRASH fix
            {
                g_apples.push(new vec2(_message.apples[i].x, _message.apples[i].y)); // meh??
            }
        }
        
        g_state = _message.state;
        g_move = _message.move;
        g_votesThisMove = 0;
        g_lastVoteMove = g_move;
    }
    if (!g_state.name)
    {
        log("ERROR: un-named state");
    }
}

function processTestmsg(_message)
{
    if (_message.name == "mem")
    {
        var memUsageElement = document.getElementById("memUsage");
        if (memUsageElement)
        {
            memUsageElement.innerHTML = _message.text;
        }
    }    
}
