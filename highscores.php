<?php

// helpers
function customDie($msg)
{
    if (isset($con))
    {
        mysql_close($con);
    }
    die($msg);
}
function debugLog($msg)
{
    if (isset($_GET["debug"]))
    {
        echo($msg . "<br/>");
    }
}
function customLog($msg)
{
    echo($msg . "<br/>");
}

// get username
debugLog("Getting username...");
if (!isset($_GET["username"]))
{
    customDie("ERROR: missing username.");
}
$username = $_GET["username"];

// get password
debugLog("Getting password...");
if (!isset($_GET["password"]))
{
    customDie("ERROR: missing password.");
}
$password = $_GET["password"];

// get action
debugLog("Getting action...");
if (!isset($_GET["action"]))
{
    customDie("ERROR: missing action.");
}
$action = $_GET["action"];

// connect
debugLog("Connecting...");
if (!$con = mysql_connect("localhost",$username,$password))
{
    customDie("ERROR: can't connect.");
}

// select DB
debugLog("Selecting database...");
if (!$db = mysql_select_db("snakedemocracy", $con))
{
    customDie("ERROR: can't select database.");
}

// create table
debugLog("Creating table if missing...");
if (!$create = mysql_query(
        "CREATE TABLE IF NOT EXISTS scores(" .
        "id INT AUTO_INCREMENT, " .
        "score INT, " .
        "addr TEXT, " .
        "host TEXT, " .
        "port TEXT, " .
        "week INT, " .
        "day DATETIME, " .
        "created DATETIME, " .
        "PRIMARY KEY (id))"))
{
    customDie("ERROR: can't create table.");
}

// take action
switch ($action)
{
    case "add":
    {
        // get score
        debugLog("Getting score...");
        if (!isset($_GET["score"]))
        {
            customDie("ERROR: missing score.");
        }
        $score = $_GET["score"];
        
        // get remote host
        $remoteHost = $_SERVER["REMOTE_HOST"] ?: gethostbyaddr($_SERVER["REMOTE_ADDR"]);

        // add it
        debugLog("Adding score...");
        if (!$add = mysql_query(
            "INSERT INTO scores SET " .
            "score = '"   . $score                  . "'," .
            "addr = '"    . $_SERVER['REMOTE_ADDR'] . "'," .
            "host = '"    . $remoteHost              . "'," .
            "port = '"    . $_SERVER['REMOTE_PORT'] . "'," .
            "week = '"    . date("W")               . "'," .
            "day = '"     . date("Y-m-d")           . "'," .
            "created = '" . date("Y-m-d H:i:s")     . "'"))
        {
            customDie("ERROR: can't add score.");
        }
        
        echo("OK");
    }
    break;
    case "best":
    {
        debugLog("Fetching best scores...");

        // best ever
        if (!$view = mysql_query("SELECT * FROM scores ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get best score ever");
        }
        if ($row = mysql_fetch_array($view))
        {
            $bestEver = $row["score"];
        }
        else 
        {
            $bestEver = 0;
        }

        // weeks's best
        $week = date("W");
        if (!$view = mysql_query("SELECT * FROM scores WHERE week='" . $week . "' ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get week's best score");
        }
        if ($row = mysql_fetch_array($view))
        {
            $weeksBest = $row["score"];
        }
        else 
        {
            $weeksBest = 0;
        }
        
        // today's best
        $day = date("Y-m-d");
        if (!$view = mysql_query("SELECT * FROM scores WHERE day='" . $day . "' ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get today's best score");
        }
        if ($row = mysql_fetch_array($view))
        {
            $todaysBest = $row["score"];
        }
        else 
        {
            $todaysBest = 0;
        }
        
        echo('{ "bestEver":' . $bestEver . ', "weeksBest":' . $weeksBest . ', "todaysBest":' . $todaysBest . ' }');
    }
    break;
    case "view":
    {
        // just list all times scores
        debugLog("Fetching scores...");
        if (!$view = mysql_query("SELECT * FROM scores ORDER BY score DESC"))
        {
            customDie("ERROR: can't view scores.");
        }
        while($row = mysql_fetch_array($view))
        {
            customLog($row["id"] . " " . $row["score"] . " " . $row["created"]);
        }
    }
    break;
    default:
    {
        customDie("ERROR: unknown action: " . $action);
    }
}

// Close connection
debugLog("Closing connection.");
mysql_close($con);

?>
