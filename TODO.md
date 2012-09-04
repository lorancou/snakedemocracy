SnakeDemocracy
================================================================================

TODO list
--------------------------------------------------------------------------------

Server
 - Kick cheaters?
 - Bots if too few players?
 - Find a better way to include vec2.js / common.js etc.? Eval is evil. => maybe requirejs?
 - Time zones, at least 3
    // playing with time zones...
    //select CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris';
    //select CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York';
    //select CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles';
    //select CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'; (curiously Asia/Beijing doesn't work.. strange)
    //select CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo';
    /*client.query("SELECT TIMESTAMP CURRENT_TIMESTAMP AT TIME ZONE 'CEST';", function(err, result) {
        console.log("Row count: %d",result.rows.length);  // 1
        console.log("Current time (CEST): " + JSON.stringify(result.rows[0]));
    });*/
 - Find a better way to upload a new highscore - for now there's a 15 minutes
   grey zone where a new highscore could be missed :/
 - Fix arrow click (area offset not applied)
 
Common
 - Better vec2, ready for socket transport?
 - Compress those messages (BiSON)?
 
Publishing
 - WWW
  * Better layout?
  * Elector notification somewhere?
  * Refresh page on clicking FB Like?
 - Pokki
  * Facebook => https://github.com/blakemachado/Pokki/blob/master/lib/OAuthManager-nolib.js
 - Kongregate?
