/*
 * server_twitter.js
 * -----------------------------------------------------------------------------
 * 
 * SnakeDemocracy
 * LEFT. RIGHT. VOTE.
 * Copyright © 2012 Christophe Zerr, Alexis Moroz, Laurent Couvidou.
 * Contact: snakedemocracy@gmail.com
 *
 * This program is free software - see README for details.
 */

(function()
{
    
    var https = require("https");
 
    //--------------------------------------------------------------------------
    // Twitter "thread", keeps running and receives tweets
    module.exports.run = function(_username, _password, _processTweetCallback)
    {
        console.log("SD_TWITTER Twitter username: " + _username);
        var auth = "Basic " + new Buffer(_username + ":" + _password).toString("base64");

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
            console.log("SD_TWITTER Twitter request status: " + res.statusCode);
            console.log("SD_TWITTER Twitter request headers: " + JSON.stringify(res.headers));
            
            res.setEncoding("utf8");
            res.on("data", function (chunk)
            {
                console.log("SD_TWITTER Twitter request status: " + res.statusCode);

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
                            console.log("SD_TWITTER Tweet: " + json.text);
                            _processTweetCallback(json.user.screen_name, json.text);
                        }
                        catch (e)
                        {
                            console.log("SD_TWITTER ERROR: invalid Twitter data");
                        }
                    }
                }
            });
        });

        console.log("SD_TWITTER Writing request");
        req.write("track=#EuroclubPetaTwitter\n\n");

        console.log("SD_TWITTER Sending request?");
        req.end();
    }

}());
