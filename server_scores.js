/*
 * server_scores.js
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

    var HIGHSCORES_REFRESH_DELAY = 900000; // re-get highscores from the db every 15mn
    
    //--------------------------------------------------------------------------
    // Highscores init
    module.exports.run = function(_conString, _highscores)
    {
        console.log("SD_SCORES Connecting with string: " + _conString);
        var client = new pg.Client(_conString);
        client.connect();
        
        cachedConString = _conString;

        // best ever
        var queryBest = function ()
        {
            var query = client.query("SELECT * FROM scores ORDER BY score DESC LIMIT 1");
            query.on("error", function(error) {
                console.log("SD_SCORES ERROR (querying best ever): " + error);
            });
            query.on("row", function(row) {
                console.log("SD_SCORES Best ever: " + row["score"]);
                _highscores.bestEver = row["score"];
            });
            query.on("end", queryWeek);
        };

        // week's best
        var queryWeek = function ()
        {
            var query = client.query("SELECT * FROM scores WHERE created > DATE_TRUNC('week', CURRENT_DATE) ORDER BY score DESC LIMIT 1");
            query.on("error", function(error) {
                console.log("SD_SCORES ERROR (querying week's best): " + error);
            });
            query.on("row", function(row) {
                console.log("SD_SCORES Week's best: " + row["score"]);
                _highscores.weeksBest = row["score"];
            });
            query.on("end", queryToday);
        };

        // today's best
        var queryToday = function ()
        {
            var query = client.query("SELECT * FROM scores WHERE created > DATE_TRUNC('day', CURRENT_DATE) ORDER BY score DESC LIMIT 1");
            query.on("error", function(error) {
                console.log("SD_SCORES ERROR (querying today's best): " + error);
            });
            query.on("row", function(row) {
                console.log("SD_SCORES Todays's best: " + row["score"]);
                _highscores.todaysBest = row["score"];
            });
            query.on("end", function(result) {
                client.end();
                console.log("SD_SCORES Done.");
            });
        }
        
        // clear highscores
        _highscores.bestEver = 0;
        _highscores.weeksBest = 0;
        _highscores.todaysBest = 0;
        
        // this will perform the 3 queries sequentially
        console.log("SD_SCORES Querying highscores...");
        queryBest();

        // refresh highscores once in a while
        // (for them to change when the day changes)
        setTimeout(function(){module.exports.run(_conString, _highscores)}, HIGHSCORES_REFRESH_DELAY);
    }

    //--------------------------------------------------------------------------
    // Send score
    module.exports.send = function(_score, _highscores)
    {
        // new highscore!
        // TODO: here a highscore could be missed if the _highscores table is
        // out of date... that's something to fix
        if (_score > _highscores.todaysBest)
        {
            _highscores.todaysBest = _score;
            console.vlog("Today's best score! ", _score);
            
            // new weekly highscore
            if (_score > _highscores.weeksBest)
            {
                _highscores.weeksBest = _score;
                console.vlog("This weeks's best score! ", _score);
                
                // wow! new best score ever
                if (_score > _highscores.bestEver)
                {
                    _highscores.bestEver = _score;
                    console.vlog("Best score ever! ", _score);
                }
            }
            
            var client = new pg.Client(cachedConString);
            client.connect();
            
            console.log("SD_SCORES Sending new highscore...");
            var query = client.query(
                "INSERT INTO scores (score, created) values " +
                "(" + _score + ", CURRENT_TIMESTAMP)"
                );
            query.on("error", function(error) {
                console.log("SD_SCORES ERROR (sending score): " + error);
            });
            query.on("end", function(result) {
                client.end();
                console.log("SD_SCORES Done.");
            });
        }
    }

}());
