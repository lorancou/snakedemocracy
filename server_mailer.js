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
    
    var text = ""
        + "Once again, the time has come to vote for a better Snake direction. "
        + "Join us right NOW on snakedemocracy.com.\n"
        + "This alert has been sent to you and $COUNT concerned citizens. "
        + "Together, you'll have to try and beat the all-time high-score of "
        + "$HIGHSCORE!\n";

    var textOneTime = ""
        + "(This mail is a one time only alert)";
    
    var textUnsuscribe = ""
        + "(Reply to this e-mail with a subject of \"Unsubscribe\" to "
        + "unsuscribe from this weekly alert)";

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
        + "<p><em>(Reply to this e-mail with a subject of \"Unsubscribe\" to "
        + "unsuscribe from this weekly alert)</em></p>";
    
    //--------------------------------------------------------------------------
    // Mailing list init
    module.exports.run = function(_conString, _username, _password)
    {
        // remember connection settings
        cachedConString = _conString;
        cachedUsername = _username;
        cachedPassword = _password;
        
        // get server time
        var serverNow = new Date();
        var serverOffset = serverNow.getTimezoneOffset();

        // next call is Tuesday at 5PM
        var callMoment = moment().day(2).hours(17).minutes(0).seconds(0);
        var msToCall = callMoment.toDate().getTime() - serverNow.getTime();
        //msToCall = 0;
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
            parisTimeout += 7 * 24 * 60 * 60 * 1000;
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
            laTimeout += 7 * 24 * 60 * 60 * 1000;
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
            tokyoTimeout += 7 * 24 * 60 * 60 * 1000;
        }
        console.log("SD_MAILER Tokyo call in: " + tokyoTimeout + " ms");
        setTimeout(function(){send("Asia/Tokyo", tokyoTimeout)}, tokyoTimeout);
    }
    
    send = function(_timezone, _timeout)
    {
        console.log("SD_MAILER Sending call to " + _timezone);
        
        var client = new pg.Client(cachedConString);
        client.connect();
        
        // TODO query subscribers

        // create reusable transport method (opens pool of SMTP connections)
        var gmail_username = cachedUsername + "@gmail.com";
        var gmail_sender = "SnakeDemocracy <snakedemocracy@gmail.com>";
        var smtpTransport = nodemailer.createTransport("SMTP",{
            service: "Gmail",
            auth: {
                user: gmail_username,
                pass: cachedPassword
            }
        });
        
        var destCount = 1; // TODO count subscribers
        for (var i=0; i<destCount; ++i)
        {
            var fullText = text;
            var fullHtml = html;
            
            // add footer
            var isOneTime = true;
            if (isOneTime)
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
            fullText = fullText.replace("$HIGHSCORE", 1234);
            fullHtml = fullHtml.replace("$COUNT", destCount);
            fullHtml = fullHtml.replace("$HIGHSCORE", 1234);

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: gmail_sender, // sender address
                to: "lorancou@free.fr", // "receiver1@example.com, receiver2@example.com", // list of receivers
                subject: "Call to democracy", // Subject line
                text: fullText, // plaintext body
                html: fullHtml // html body
            }

            // send mail with defined transport object
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log("SD_MAILER ERROR: " + error);
                }else{
                    console.log("SD_MAILER: Message sent: " + response.message);
                }
                if (i == (destCount-1))
                {
                    smtpTransport.close(); // shut down the connection pool, no more messages
                }
            });
        }
        
        // next call for this time zone in one week
        var newTimeout = _timeout + 7 * 24 * 60 * 60 * 1000;
        setTimeout(function(){send(_timezone, newTimeout)}, newTimeout);
    }
    
    module.exports.add = function(_subscriber)
    {
        // TODO
    }

}());
