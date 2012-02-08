var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var fs = require("fs");

// do not mangle this
var g_except =
[
    "init",
    "appleTweetClick",
    "pokkiLinkClick",
    "pokkiShowing",
    "pokkiShown",
    "pokkiHidden",
    "pokkiUnload",
    "pokkiBadgesInit",
    "pokkiBadges"
];

var orig_code = fs.readFileSync("build/client.temp.js")+"";
var ast = jsp.parse(orig_code); // parse code and get the initial AST
ast = pro.ast_lift_variables(ast); // --lift-vars
ast = pro.ast_mangle(ast, {toplevel: "true", except: g_except}); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
ast = pro.ast_squeeze_more(ast); // --unsafe
var final_code = pro.gen_code(ast); // compressed code here

var out = fs.createWriteStream("build/client.min.js", {
    flags: "w",
    encoding: "utf8",
    mode: 0644
});
out.write(final_code);
out.end();
