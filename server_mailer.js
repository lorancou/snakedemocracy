/*
 * server_mailer.js
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
    var pg = require("pg"); 
    var cachedConString = null;
    var moment = require("moment");
    var nodemailer = require("nodemailer");
    var time = require("time");
    
    var cachedConString = null;
    var cachedUsername = null;
    var cachedPassword = null;
    
    var cachedHighscores = null; // a cached reference actually, internals will
                                 // update: stackoverflow.com/a/3638034/1005455
    
    var confirmOnce = ""
        + "Hi, Citizen!\nYou will receive the next Call to Democracy.";

    var confirmAlways = ""
        + "Hi, Citizen!\nYou will now receive the Call to Democracy every week.";

    var confirmNever = ""
        + "Goodbye, Citizen!\nYou won't receive the Call to Democracy anymore.";

    var htmlOnce = ""
        + "<p>Hi, Citizen!</p><p>You will receive the next <strong>Call to "
        + "Democracy</strong>.</p>";

    var htmlAlways = ""
        + "<p>Hi, Citizen!</p><p>You will now receive the <strong>Call to "
        + "Democracy</strong> every week.</p>";

    var htmlNever = ""
        + "<p>Goodbye, Citizen!</p><p>You won't receive the <strong>Call to "
        + "Democracy</strong> anymore.</p>";

    var text = ""
        + "Once again, the time has come to vote for a better Snake direction. "
        + "Join us right NOW on snakedemocracy.com.\n"
        + "This alert has been sent to you and $COUNT concerned citizens. "
        + "Together, you'll have to try and beat the all-time high-score of "
        + "$HIGHSCORE!\n";

    var textOneTime = ""
        + "(This mail is a one time only alert)";
    
    var textUnsuscribe = ""
        + "(Go to snakedemocracy.com, fill in your e-mail in the bottom form "
        + "and choose \"never again\" in the drop-down list to unsuscribe)";

    var html = ""
        + "<p>Once again, the time has come to vote for a better Snake "
        + "direction. Join us right <strong>NOW</strong> on <a href="
        + "\"http://www.snakedemocracy.com\">snakedemocracy.com</a>.</p>"
        + "<p>This alert has been sent to you and <strong>$COUNT concerned "
        + "citizens</strong>. Together, you'll have to try and beat the "
        + "<strong>all-time high-score of $HIGHSCORE</strong>!</p>";

    var htmlOneTime = ""
        + "<p><em>(This mail is a one time only alert)</em></p>";
    
    var htmlUnsuscribe = ""
        + "<p><em>(Go to <a href=\"http://www.snakedemocracy.com\">"
        + "snakedemocracy.com</a>, fill in your e-mail in the bottom form and "
        + "choose \"never again\" in the drop-down list to unsuscribe)</em></p>";
    
    var MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
    
    var subscribersCount = 0;
   
    //--------------------------------------------------------------------------
    // Mailing list init
    module.exports.run = function(_conString, _username, _password, _highscores)
    {
        // remember connection settings
        cachedConString = _conString;
        cachedUsername = _username;
        cachedPassword = _password;
        
        // remember highscores reference
        cachedHighscores = _highscores;
        
        // init subscribers count
        var client = new pg.Client(cachedConString);
        client.connect();
        var queryString = "SELECT COUNT (*) FROM subscribers";
        console.log("SD_MAILER Query: " + queryString);
        var query = client.query(queryString);
        query.on("error", function(error) {
            console.log("SD_MAILER ERROR (init): " + error);
        });
        query.on("row", function(row) {
            subscribersCount = row.count;
            console.log("SD_MAILER subscribers count: " + subscribersCount);
        });
        query.on("end", function(result) {
            client.end();
        });            
        
        // get server time
        var serverNow = new Date();
        var serverOffset = serverNow.getTimezoneOffset();

        // next call is Tuesday at 5PM
        var callMoment = moment().day(2).hours(17).minutes(0).seconds(0);
        var msToCall = callMoment.toDate().getTime() - serverNow.getTime();
        //msToCall = 10000;
        console.log("msToCall " + msToCall);

        // get Paris timezone offset
        var parisNow = new time.Date();
        parisNow.setTimezone("Europe/Paris");
        var parisOffset = parisNow.getTimezoneOffset() - serverOffset;
        console.log("SD_MAILER Paris offset: " + parisOffset);
        var parisTimeout = msToCall + (parisOffset * 60 * 1000);
        if (parisTimeout < 0)
        {
            // already occured, add a week
            parisTimeout += MS_PER_WEEK;
        }
        console.log("SD_MAILER Paris call in: " + parisTimeout + " ms");
        setTimeout(function(){send("Europe/Paris", parisTimeout)}, parisTimeout);
        
        // get LA timezone offset
        var laNow = new time.Date();
        laNow.setTimezone("America/Los_Angeles");
        var laOffset = laNow.getTimezoneOffset() - serverOffset;
        console.log("SD_MAILER LA offset: " + laOffset);
        var laTimeout = msToCall + (laOffset * 60 * 1000);
        if (laTimeout < 0)
        {
            // already occured, add a week
            laTimeout += MS_PER_WEEK;
        }
        console.log("SD_MAILER LA call in: " + laTimeout + " ms");
        setTimeout(function(){send("America/Los_Angeles", laTimeout)}, laTimeout);
        
        // get Tokyo timezone offset
        var tokyoNow = new time.Date();
        tokyoNow.setTimezone("Asia/Tokyo");
        var tokyoOffset = tokyoNow.getTimezoneOffset() - serverOffset;
        console.log("SD_MAILER Tokyo offset: " + tokyoOffset);
        var tokyoTimeout = msToCall + (tokyoOffset * 60 * 1000);
        if (tokyoTimeout < 0)
        {
            // already occured, add a week
            tokyoTimeout += MS_PER_WEEK;
        }
        console.log("SD_MAILER Tokyo call in: " + tokyoTimeout + " ms");
        setTimeout(function(){send("Asia/Tokyo", tokyoTimeout)}, tokyoTimeout);
    }
    
    send = function(_timezone, _timeout)
    {
        console.log("SD_MAILER Sending call to " + _timezone);
        
        var client = new pg.Client(cachedConString);
        client.connect();
        
        var subscribers = new Array();;
        
        // query subscribers for this timezone
        var querySubscribers = function()
        {
            var queryString = "SELECT email,freq FROM subscribers "
                + "WHERE timezone = '" + _timezone + "'";
            console.log("SD_MAILER Query: " + queryString);
            var query = client.query(queryString);
            query.on("error", function(error) {
                console.log("SD_MAILER ERROR (querying subscribers): " + error);
            });
            query.on("row", function(row) {
                console.log("SD_MAILER Row: " + row.toString());
                subscribers.push({email: row["email"], freq: row["freq"]});
            });
            query.on("end", function(result) {
                //subscribers = result.rows;
                console.log("SD_MAILER OK. " + subscribers.length);
                clearOneTimeSubscribers();
                //sendCall();
            });
        };
        
        var clearOneTimeSubscribers = function()
        {
            var queryString = "DELETE FROM subscribers "
                + "WHERE timezone = '" + _timezone + "' AND "
                + "freq = 'once'";
            console.log("SD_MAILER Query: " + queryString);
            var query = client.query(queryString);
            query.on("error", function(error) {
                console.log("SD_MAILER ERROR (querying subscribers): " + error);
            });
            query.on("end", function(result) {
                client.end();
                console.log("SD_MAILER OK.");
                sendCall();
            });
        };
        
        var sendCall = function()
        {
            // create reusable transport method (opens pool of SMTP connections)
            var gmail_username = "snakedemocracy@gmail.com";
            var gmail_sender = "SnakeDemocracy <snakedemocracy@gmail.com>";
            var smtpTransport = nodemailer.createTransport("SMTP",{
                service: "Gmail",
                auth: {
                    user: gmail_username,
                    pass: "appletweetISART12"
                }
            });
            
            var destCount = subscribers.length;
            console.log("Sending call to " + destCount + " subscribers!");
            for (var i=0; i<destCount; ++i)
            {
                var fullText = text;
                var fullHtml = html;
                
                // add footer
                console.log("freq: " + subscribers[i].freq);
                if (subscribers[i].freq == "once")
                {
                    fullText += textOneTime;
                    fullHtml += htmlOneTime;
                }
                else
                {
                    fullText += textUnsuscribe;
                    fullHtml += htmlUnsuscribe;
                }
                
                // set variables
                fullText = fullText.replace("$COUNT", destCount);
                fullText = fullText.replace("$HIGHSCORE", cachedHighscores.bestEver);
                fullHtml = fullHtml.replace("$COUNT", destCount);
                fullHtml = fullHtml.replace("$HIGHSCORE", cachedHighscores.bestEver);

                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: gmail_sender, // sender address
                    to: subscribers[i].email,// receiver
                    subject: "Call to Democracy", // Subject line
                    text: fullText, // plaintext body
                    html: fullHtml // html body
                }

                // send mail with defined transport object
                smtpTransport.sendMail(mailOptions, function(error, response){
                    if(error){
                        console.log("SD_MAILER ERROR: " + error);
                    }else{
                        console.log("SD_MAILER: Call sent: " + response.message);
                    }
                    if (i == (destCount-1))
                    {
                        smtpTransport.close(); // shut down the connection pool, no more messages
                        console.log("SD_MAILER Done.");
                    }
                });
            }
        };
        
        // next call for this time zone in one week
        // TODO: this will fail with DST, fix that
        var newTimeout = /*_timeout +*/ MS_PER_WEEK;
        setTimeout(function(){send(_timezone, newTimeout)}, newTimeout);

        // this will query subscribers send send the call;
        querySubscribers();
    }
    
    module.exports.register = function(_freq, _email, _timezone)
    {
        console.log("SD_MAILER Register " + _email
                    + " (freq: " + _freq
                    + ", timezone: " + _timezone +")");
                
        var client = new pg.Client(cachedConString);
        client.connect();
        
        // PostgreSQL "upsert":
        // http://stackoverflow.com/a/6527838/1005455
        // UPDATE table SET field='C', field2='Z' WHERE id=3;
        // INSERT INTO table (id, field, field2)
        //     SELECT 3, 'C', 'Z'
        //     WHERE NOT EXISTS (SELECT 1 FROM table WHERE id=3);

        var updateSubscriber = function ()
        {
            var queryString = "UPDATE subscribers set (timezone, created, freq) = (" +
                "'" + _timezone + "'," +
                "CURRENT_TIMESTAMP," +
                "'" + _freq + "'" +
                ") WHERE email = '" + _email + "'";
            console.log("SD_MAILER Query: " + queryString);
            var query = client.query(queryString);
            query.on("error", function(error) {
                console.log("SD_MAILER ERROR (registering): " + error);
            });
            query.on("end", function(result) {
                insertSubscriber();
            });
        };

        var insertSubscriber = function ()
        {
            var queryString = "INSERT INTO subscribers (email, timezone, created, freq) SELECT " +
                "'" + _email + "'," +
                "'" + _timezone + "'," +
                "CURRENT_TIMESTAMP," +
                "'" + _freq + "'" +
                " WHERE NOT EXISTS (SELECT 1 FROM subscribers WHERE email = '" + _email + "')";
            console.log("SD_MAILER Query: " + queryString);
            var query = client.query(queryString);
            query.on("error", function(error) {
                console.log("SD_MAILER ERROR (registering): " + error);
            });
            query.on("end", function(result) {
                updateSubscribersCount();
            });
        };
        
        var updateSubscribersCount = function()
        {
            var queryString = "SELECT COUNT (*) FROM subscribers";
            console.log("SD_MAILER Query: " + queryString);
            var query = client.query(queryString);
            query.on("error", function(error) {
                console.log("SD_MAILER ERROR (registering): " + error);
            });
            query.on("row", function(row) {
                subscribersCount = row.count;
                console.log("SD_MAILER subscribers count: " + subscribersCount);
            });
            query.on("end", function(result) {
                client.end();
                sendConfirmation();
            });            
        };
        
        var sendConfirmation = function ()
        {
            // create reusable transport method (opens pool of SMTP connections)
            var gmail_username = "snakedemocracy@gmail.com";
            var gmail_sender = "SnakeDemocracy <snakedemocracy@gmail.com>";
            var smtpTransport = nodemailer.createTransport("SMTP",{
                service: "Gmail",
                auth: {
                    user: gmail_username,
                    pass: "appletweetISART12"
                }
            });
            
            var fullText;
            var fullHtml;
            if (_freq == "once")
            {
                fullText = confirmOnce;
                fullHtml = htmlOnce;
            }
            else if (_freq == "always")
            {
                fullText = confirmAlways;
                fullHtml = htmlAlways;
            }
            else // if (_freq == "never")
            {
                fullText = confirmNever;
                fullHtml = htmlNever;
            }
            
            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: gmail_sender, // sender address
                to: _email,
                subject: "Call to Democracy - Subscription", // Subject line
                text: fullText, // plaintext body
                html: fullHtml // html body
            }
            
            // send mail with defined transport object
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log("SD_MAILER ERROR: " + error);
                }else{
                    console.log("SD_MAILER: Confirmation sent: " + response.message);
                }
                smtpTransport.close(); // shut down the connection pool, no more messages
                console.log("SD_MAILER Done.");
            });
        };

        // this will "upsert" the subscriber then send a confirmation e-mail
        updateSubscriber();
    }
    
    module.exports.getSubscribersCount = function()
    {
        return subscribersCount;
    }

}());
