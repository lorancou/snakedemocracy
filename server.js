var app = require("express").createServer();
var io = require("socket.io").listen(app);

app.listen(80);

// serve index.html
app.get("/", function (req, res)
{
    res.sendfile(__dirname + "/index.html");
});

// serve client.js
app.get("/client.js", function (req, res)
{
    res.sendfile(__dirname + "/client.js");
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

// client connection sockets
var g_sockets = [];
var g_head = false;
var g_body = false;
io.sockets.on("connection", function (socket)
{
    // push new socket
    g_sockets.push(socket);

    // log connection
    console.log("new client");
    socket.emit("ping", "pong");

    // receive client message
    socket.on("message", function (data)
    {
        console.log(data);
        if (data == "popHead")
        {
            g_head = true;
            for (var i=0; i<g_sockets.length; i++)
            {
                var s = g_sockets[i];
                console.log("resend popHead");
                s.emit("message", "popHead");
            }
        }
        else if (data == "popBody")
        {
            g_body = true;
            for (var i=0; i<g_sockets.length; i++)
            {
                var s = g_sockets[i];
                console.log("resend popBody");
                s.emit("message", "popBody");
            }
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
