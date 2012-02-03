<?php

// helpers
function customDie($msg)
{
    if (isset($con)) mysql_close($con);
    die($msg . "<br/>");
}
function customLog($msg)
{
    echo($msg . "<br/>");
}

// get username
customLog("Getting username...");
if (!isset($_GET["username"]))
{
    customDie("ERROR: missing username.");
}
$username = $_GET["username"];

// get password
customLog("Getting password...");
if (!isset($_GET["password"]))
{
    customDie("ERROR: missing password.");
}
$password = $_GET["password"];

// get action
customLog("Getting action...");
if (!isset($_GET["action"]))
{
    customDie("ERROR: missing action.");
}
$action = $_GET["action"];

// connect
customLog("Connecting...");
if (!$con = mysql_connect("localhost",$username,$password))
{
    customDie("ERROR: can't connect.");
}

// select DB
customLog("Selecting database...");
if (!$db = mysql_select_db("snakedemocracy", $con))
{
    customDie("ERROR: can't select database.");
}

// create table
customLog("Creating table if missing...");
if (!$create = mysql_query(
        "CREATE TABLE IF NOT EXISTS scores(" .
        "id INT AUTO_INCREMENT, " .
        "score INT, " .
        "addr TEXT, " .
        "host TEXT, " .
        "port TEXT, " .
        "year DATETIME, " .
        "month DATETIME, " .
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
        customLog("Getting score...");
        if (!isset($_GET["score"]))
        {
            customDie("ERROR: missing score.");
        }
        $score = $_GET["score"];

        // add it
        customLog("Adding score...");
        if (!$add = mysql_query(
            "INSERT INTO scores SET " .
            "score = '"   . $score                  . "'," .
            "addr = '"    . $_SERVER['REMOTE_ADDR'] . "'," .
            "host = '"    . $_SERVER['REMOTE_HOST'] . "'," .
            "port = '"    . $_SERVER['REMOTE_PORT'] . "'," .
            "year = '"    . date("Y") . "-00-00"    . "'," .
            "month = '"   . date("Y-m") . "-00"     . "'," .
            "day = '"     . date("Y-m-d")           . "'," .
            "created = '" . date("Y-m-d H:i:s")     . "'"))
        {
            customDie("ERROR: can't add score.");
        }
    }
    break;
    case "best":
    {
        customLog("Fetching best scores...");

        // year's best
        $year =  date("Y") . "-00-00";
        if (!$view = mysql_query("SELECT * FROM scores WHERE year='" . $year . "' ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get year's best");
        }
        $row = mysql_fetch_array($view);
        $yearsBest = $row["score"];

        // month's best
        $month = date("Y-m") . "-00";
        if (!$view = mysql_query("SELECT * FROM scores WHERE month='" . $month . "' ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get month's best");
        }
        $row = mysql_fetch_array($view);
        $monthsBest = $row["score"];
        
        // today's best
        $day = date("Y-m-d");
        if (!$view = mysql_query("SELECT * FROM scores WHERE day='" . $day . "' ORDER BY score DESC LIMIT 1"))
        {
            customDie("ERROR: can't get day's best");
        }
        $row = mysql_fetch_array($view);
        $daysBest = $row["score"];
        
        customLog($yearsBest . "," . $monthsBest . "," . $daysBest);
    }
    break;
    case "view":
    {
        // just list all times scores
        customLog("Fetching scores...");
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

// done
customDie("OK");

?>
