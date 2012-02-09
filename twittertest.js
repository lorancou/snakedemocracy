var https = require("https");

var username = process.argv[2];
var password = process.argv[3];
var stream = process.argv[4];

console.log("Twitter username: " + username);
console.log("Twitter stream: " + stream);

var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

var options =
{
    host: "stream.twitter.com",
    port: 443,
    path: "/1/statuses/filter.json",
    headers :
    {
        "Host": "stream.twitter.com", 
        "Authorization": auth,
        "Content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
};

// start receiving tweets
var buf = "";
var req = https.request(options, function(res)
{
    console.log("Twitter request status: " + res.statusCode);
    console.log("Twitter request headers: " + JSON.stringify(res.headers));
    
    res.setEncoding("utf8");
    res.on("data", function (chunk)
    {
        console.log("Twitter request status: " + res.statusCode);

        buf += chunk;
        var a = buf.split("\r\n");
        buf = a[a.length-1];

        for(var i=0; i < a.length-1; i++)
        {
            if (a[i] != "")
            {
                try
                {
                    var json = JSON.parse(a[i]);
                    console.log("Tweet: " + json.text);
                    //processTweet(json.user.screen_name, json.text);
                }
                catch (e)
                {
                    console.log("ERROR: invalid Twitter data");
                }
            }
        }
    });
});

console.log("Writing request");
req.write("track="+stream+"\n\n");

console.log("Sending request?");
req.end();
