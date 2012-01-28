// global constants
var SERVER_ADDRESS = "snakedemocracy.dyndns.org";
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 480;
var SPRITE_SIZE = 24;

// global variables
var g_context = null;
var g_canvas = null;
var g_socket = null;
var g_assets = null;
var g_snake = null;
var g_opinion = null;
var g_state = null;
var g_clickX = -1;
var g_clickY = -1;

// assets
var g_headPath = "files/head.png";
var g_bodyPath = "files/body.png";
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

function log(msg)
{
    //alert(msg);
    if (window.console)
    {
        window.console.log(msg);
    }
}

// client init, called with body's onload
function init()
{
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

    // plug mouse inputs
	g_canvas.onmouseup = mouseUp;
	g_canvas.oncontextmenu = function() { return false; };

    // connect to node.js server
    g_socket = io.connect(SERVER_ADDRESS);
    g_socket.on("ping", function (message)
    {
        processPing(message)
    });
}

function mouseUp(e)
{
	var button = null;	
	if (e.button) button = e.button;
	else button = e.which;
	if (button == null ) return;

    if (button==1)
    {
        var x, y;
	    /*if (e.clientX && e.clientY) // IE?
        {
            x = clientX;
            y = clientY;
        }
        else
        {*/
		    x = e.layerX - g_canvas.offsetLeft;
		    y = e.layerY - g_canvas.offsetTop;
        //}
        g_clickX = x;
        g_clickY = y;
        log("click " + x + "," + y);
    }
}

// ping, first message, inits the snake
function processPing(message)
{
    g_snake = new Array();
    for (var i=0; i<message.snake.length; ++i)
    {
        g_snake.push(new vec2(message.snake[i].x, message.snake[i].y));
    }
    g_state = message.state;
    if (!g_state.name)
    {
        log("ERROR: un-named state");
    }

    g_socket.on("message", function (message) { processMessage(message) });

    // queue assets
    g_assets = new AssetManager();
    g_assets.queueDownload(g_headPath);
    g_assets.queueDownload(g_bodyPath);
    g_assets.queueDownload(g_arrowPaths.east);
    g_assets.queueDownload(g_arrowPaths.west);
    g_assets.queueDownload(g_arrowPaths.south);
    g_assets.queueDownload(g_arrowPaths.north);
    g_assets.queueDownload(g_arrowGoldPaths.east);
    g_assets.queueDownload(g_arrowGoldPaths.west);
    g_assets.queueDownload(g_arrowGoldPaths.south);
    g_assets.queueDownload(g_arrowGoldPaths.north);

    // download assets and run
    g_assets.downloadAll(update);
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
    setTimeout("update()", 0.0);

    // clear canvas
    g_context.fillStyle = "#000000";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (g_snake.length > 0)
    {
        // draw all snake body elements
        for (var i=0; i<g_snake.length-1; i++)
        {
            var screenCoords = getScreenCoords(g_snake[i]);
            g_context.drawImage(
                g_assets.cache[g_bodyPath],
                screenCoords.x, screenCoords.y,
                SPRITE_SIZE, SPRITE_SIZE
            );
        }
        
        // draw head
        var headCoords = getScreenCoords(g_snake[g_snake.length-1]);
        g_context.drawImage(
            g_assets.cache[g_headPath],
            headCoords.x, headCoords.y,
            SPRITE_SIZE, SPRITE_SIZE
        );
        
        // draw opinion
        if (g_opinion && g_snake && g_snake.length>=2)
        {
            var head = g_snake[g_snake.length-1].clone();
            var neck = g_snake[g_snake.length-2].clone();
            var drawEast = true;
            var drawWest = true;
            var drawSouth = true;
            var drawNorth = true;
            var direction = null;
            if (head.x != neck.x)
            {
                // east
                if (head.x > neck.x)
                {
                    direction = "east";
                    drawWest = false;
                    if (g_opinion.current == "forward") drawGold = "east";
                    else if (g_opinion.current == "left") drawGold = "north";
                    else if (g_opinion.current == "right") drawGold = "south";
                }
                // west
                else
                {
                    direction = "west";
                    drawEast = false;
                    if (g_opinion.current == "forward") drawGold = "west";
                    else if (g_opinion.current == "left") drawGold = "south";
                    else if (g_opinion.current == "right") drawGold = "north";
                }
            }
            else
            {
                // south
                if (head.y > neck.y)
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
            
            /*var lastCoords = getScreenCoords(g_snake[g_snake.length-1], true);
            g_context.strokeStyle = "#FF00FF";
            g_context.beginPath();
            g_context.moveTo(lastCoords.x, lastCoords.y);
            g_context.lineTo(lastCoords.x + g_opinion.x*32, lastCoords.y + g_opinion.y*32);
            g_context.closePath();
            g_context.stroke();*/

            // apply mouse input
            // getting tired... 4h of sleep... updating inputs inside a draw thing, yep.
            if (g_clickX != -1 && g_clickY != -1)
            {
                var headPos = g_snake[g_snake.length-1];
                var x = Math.floor(g_clickX / SPRITE_SIZE);
                var y = Math.floor(g_clickY / SPRITE_SIZE);

                log(headPos.x + "," + headPos.y);
                log(x + "," + y);
                
                if (y == headPos.y)
                {
                    if (x == headPos.x+1)
                    {
                        if (direction == "north") vote("right");
                        if (direction == "east") vote("forward");
                        if (direction == "south") vote("left");
                    }
                    else if (x == headPos.x-1)
                    {
                        if (direction == "south") vote("right");
                        if (direction == "west") vote("forward");
                        if (direction == "north") vote("left");
                    }
                }
                else if (x == headPos.x)
                {
                    if (y == headPos.y+1)
                    {
                        if (direction == "east") vote("right");
                        if (direction == "south") vote("forward");
                        if (direction == "west") vote("left");
                    }
                    else if (y == headPos.y-1)
                    {
                        if (direction == "west") vote("right");
                        if (direction == "north") vote("forward");
                        if (direction == "east") vote("left");
                    }
                }
            }
        }
    }

    // draw msg
    if (g_state.name != "playing")
    {
        g_context.fillStyle = "#FFFFFF";
        //g_context.font = ;
        g_context.fillText(
            g_state.name + ": " + g_state.value,
            10, 40);
    }

    // reset input
    g_clickX = -1;
    g_clickY = -1;
}

function cheatTweet()
{
    g_socket.emit("message", { name : "cheatTweet" });
}
function cheatClear()
{
    g_socket.emit("message", { name : "cheatClear" });
}
function vote(_value)
{
    if (g_state.name == "playing")
    {
        g_socket.emit("message", { name : "vote", value : _value });
    }
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
    g_socket.emit("message", { name : "moveDelayChange" , value : element.value });

    element = document.getElementById("pauseDelay");
    if (!element)
    {
        log("ERROR: can't get pause delay element");
        return false;
    }
    log("TWEAK: pause delay change to " + element.innerHTML);
    g_socket.emit("message", { name : "pauseDelayChange" , value : element.value });

    return true;
}

function processMessage(_message)
{
    log("processing message:" + _message.name + " (" + _message.value + ")");
    if (_message.name == "opinion")
    {
        g_opinion = {};
        g_opinion.current = _message.value.current;
        g_opinion.numLeft = _message.value.numLeft;
        g_opinion.numRight = _message.value.numRight;
        g_opinion.numForward = _message.value.numForward;
        log(g_opinion);
    }
    else if (_message.name == "grow")
    {
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
    }
    else if (_message.name == "move")
    {
        g_snake.shift();
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
    }
    else if (_message.name == "clear")
    {
        g_snake = new Array();
        g_state = _message;
    }
    else if (_message.name == "defeat")
    {
        g_state = _message;
    }
    else if (_message.name == "victory")
    {
        g_state = _message;
    }
    else if (_message.name == "playing")
    {
        g_state = { name : _message.name  };
        g_snake = new Array();
        for (var i=0; i<_message.snake.length; ++i)
        {
            g_snake.push(new vec2(_message.snake[i].x, _message.snake[i].y)); // meh??
        }
    }
    if (!g_state.name)
    {
        log("ERROR: un-named state");
    }
}
