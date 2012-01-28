// global constants
var SERVER_ADDRESS = "http://172.16.60.17"
var CANVAS_WIDTH = 400;
var CANVAS_HEIGHT = 400;

// global variables
var g_context = null;
var g_canvas = null;
var g_socket = null;
var g_assets = null;
var g_headImg = "files/head.png";
var g_bodyImg = "files/body.png";

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

    // clear canvas
    g_context.fillStyle = "#000000";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // connect to node.js server
    g_socket = io.connect(SERVER_ADDRESS);
    g_socket.on("ping", function (data) { console.log(data); });
    g_socket.on("message", function (data) { processMessage(data) });

    console.log("hello");

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

// client update
function update()
{
}

function popHead()
{
    g_socket.emit("message", "popHead");
}

function popBody()
{
    g_socket.emit("message", "popBody");
}

function processMessage(data)
{
    console.log("processing message:" + data);
    if (data == "popHead")
    {
        //g_head = true;
        //socket.emit("message", "popHead");
        g_context.drawImage(g_assets.cache[g_headImg], 0, 0);
    }
    else if (data == "popBody")
    {
        //g_body = true;
        //socket.emit("message", "popBody");
        g_context.drawImage(g_assets.cache[g_bodyImg], 64, 0);
    }
}
