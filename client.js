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
var g_headImg = "files/head.png";
var g_bodyImg = "files/body.png";
var g_snake = null;
var g_opinion = new vec2(0.0, -1.0);

// client init, called with body's onload
function init()
{
    // get canvas element
    g_canvas =  document.getElementById("canvas");
    if (!g_canvas)
    {
        console.log("ERROR: missing canvas element");
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
    for (var i=0; i<message.length; ++i)
    {
        g_snake.push(new vec2(message[i].x, message[i].y));
    }

    g_socket.on("message", function (message) { processMessage(message) });

    // queue assets
    g_assets = new AssetManager();
    g_assets.queueDownload(g_headImg);
    g_assets.queueDownload(g_bodyImg);

    // download assets and run
    g_assets.downloadAll(update);
}

// assets manager
// http://io-2011-html5-games-hr.appspot.com/#22
function AssetManager() {
  this.successCount = 0;
  this.errorCount = 0;
  this.cache = {};
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
      var that = this;
      img.addEventListener("load", function() {
          that.successCount += 1;
          if (that.isDone()) { callback(); }
      });
      img.addEventListener("error", function() {
          that.errorCount += 1;
          if (that.isDone()) { callback(); }
      });
      img.src = path;
      this.cache[path] = img;
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
    // clear canvas
    g_context.fillStyle = "#000000";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw all snake body elements
    for (var i=0; i<g_snake.length-1; i++)
    {
        var screenCoords = getScreenCoords(g_snake[i]);
        g_context.drawImage(
            g_assets.cache[g_bodyImg],
            screenCoords.x, screenCoords.y,
            SPRITE_SIZE, SPRITE_SIZE
        );
    }

    // draw head
    var headCoords = getScreenCoords(g_snake[g_snake.length-1]);
    g_context.drawImage(
        g_assets.cache[g_headImg],
        headCoords.x, headCoords.y,
        SPRITE_SIZE, SPRITE_SIZE
    );

    // draw opinion
    var lastCoords = getScreenCoords(g_snake[g_snake.length-1], true);
    g_context.strokeStyle = "#FF00FF";
    g_context.beginPath();
    g_context.moveTo(lastCoords.x, lastCoords.y);
    g_context.lineTo(lastCoords.x + g_opinion.x*32, lastCoords.y + g_opinion.y*32);
    g_context.closePath();
    g_context.stroke();

    // plan next update
    setTimeout("update()", 0.0);
}

function cheatTweet()
{
    g_socket.emit("message", { name : "cheatTweet" });
}

function vote(_value)
{
    g_socket.emit("message", { name : "vote", value : _value });
}

function processMessage(_message)
{
    console.log("processing message:" + _message.name + " (" + _message.value + ")");
    if (_message.name == "opinion")
    {
        g_opinion = new vec2(_message.value.x, _message.value.y); // meh?
        console.log(g_opinion);
    }
    else if (_message.name == "head")
    {
        g_snake.push(new vec2(_message.value.x, _message.value.y)); // meh??
    }
}
