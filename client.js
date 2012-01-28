// global constants
var SERVER_ADDRESS = "kilopede.dyndns.org"; //"http://172.16.60.17"
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 480;
var SPRITE_SIZE = 24;

// global variables
var g_context = null;
var g_canvas = null;
var g_socket = null;
var g_assets = null;
var g_headPath = "files/head.png";
var g_bodyPath = "files/body.png";
var g_snake = null;
var g_opinion = null;
var g_state = false;

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

    // connect to node.js server
    g_socket = io.connect(SERVER_ADDRESS);
    g_socket.on("ping", function (message)
    {
        processPing(message)
    });
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

    g_socket.on("message", function (message) { processMessage(message) });

    // queue assets
    g_assets = new AssetManager();
    g_assets.queueDownload(g_headPath);
    g_assets.queueDownload(g_bodyPath);

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
        if (g_opinion)
        {
            var lastCoords = getScreenCoords(g_snake[g_snake.length-1], true);
            g_context.strokeStyle = "#FF00FF";
            g_context.beginPath();
            g_context.moveTo(lastCoords.x, lastCoords.y);
            g_context.lineTo(lastCoords.x + g_opinion.x*32, lastCoords.y + g_opinion.y*32);
            g_context.closePath();
            g_context.stroke();
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

function processMessage(_message)
{
    log("processing message:" + _message.name + " (" + _message.value + ")");
    if (_message.name == "opinion")
    {
        g_opinion = new vec2(_message.value.x, _message.value.y); // meh?
    }
    else if (_message.name == "head")
    {
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
        g_state = _message;
    }
}
