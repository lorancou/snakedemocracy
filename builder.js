// dev only
if (process.env.NODE_ENV != "development")
{
    console.log("Use in development mode only");
    process.exit(1);
}

// requires
var http = require("http");
var https = require("https");
var app = require("express").createServer();
var io = require("socket.io").listen(app);
var fs = require("fs");
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

// serve minified socket.io.js
io.configure("development", function(){
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file    io.disable("browser client");              // served via main server
    io.set("log level", 0);                    // no logging
});
    
// serve minified client.js
var port = 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
app.get("/client.js", function (req, res)
{
    var vec2Script = fs.readFileSync("vec2.js");
    var commonScript = fs.readFileSync("common.js");
    var clientScript = fs.readFileSync("client.js");
    var orig_code = "\n" + clientScript;
    var ast = jsp.parse(orig_code); // parse code and get the initial AST
    ast = pro.ast_mangle(ast, { toplevel: false} ); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
    var final_code = pro.gen_code(ast); // compressed code here
    res.send(final_code);
});
