var REVISION = 32;
var VERSION = "1.3"
var AREA_SIZE = 16;
var MAX_VOTES_PER_MOVE = 10;
var MOVE_DELAY = 850;
var FAIL_DELAY = 4000;
var VICTORY_DELAY = 20000;
var MEM_SEPPUKU_DELAY = 5000;

// game states
var GS_INIT = 1;
var GS_PLAYING = 2;
var GS_FAIL = 3;
var GS_VICTORY = 4;
var GS_SEPPUKU = 4;

// client states
var CS_ACTIVE = 1;
var CS_SPECTATOR = 2;
var CS_SLEEP = 3;
var CS_IDLE = 4;
var CS_DOWN = 5;

// opinion
var OP_LEFT = 1;
var OP_FORWARD = 2;
var OP_RIGHT = 3;

// cardinal point
var EAST = 0;
var WEST = 1;
var SOUTH = 2;
var NORTH = 3;

// message types
var MSG_CONNECT = "connect"; // unfortunately, can't be shorter
var MSG_DISCONNECT = "disconnect"; // ibid.
var MSG_ERROR = "error"; // ibid.
var MSG_PING = "p";
var MSG_MESSAGE = "m";
var MSG_TESTMSG = "t";
var MSG_IDLE = "i";
var MSG_BACK = "b";
var MSG_CLIENTSTATE = "c";
var MSG_MAILER_REGISTER = "r";

// message names
var MSGN_VOTE = 1;
var MSGN_OPINION = 2;
var MSGN_GROW = 3;
var MSGN_MOVE = 4;
var MSGN_NEWSTATE = 5;
var MSGN_LIGHTBROADCAST = 6;

// test/dev message names
var TMSGN_MEM = 1;
var TMSGN_KILL = 2;
var TMSGN_RESTART = 3;
var TMSGN_CHEATTWEET = 4;
var TMSGN_MOVEDELAY = 5;
var TMSGN_FAILDELAY = 6;
var TMSGN_VICTORYDELAY = 7;

// utility String function
// http://stackoverflow.com/a/1978419/1005455
if (typeof String.prototype.contains === "undefined")
{
    String.prototype.contains = function(it)
    {
        return this.indexOf(it) != -1;
    };
}
