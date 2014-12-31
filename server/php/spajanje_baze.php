<?php
//spajanje
$dbhost = "localhost";
$dbuser = "majstor";
$dbpass = "majstor92";
$db = "majstor";

$conn = mysql_connect($dbhost,$dbuser,$dbpass);
@mysql_select_db($db) or die( "Unable to select database");
if (!$conn) die('Could not connect: ' . mysql_error());
?>