<?php

// Expected parameters: $_POST['username'], $_POST['password'], $_POST['email'].
if (!isset($_POST['username']) || !isset($_POST['password']) || !isset($_POST['email'])) {
	echo 'wrong';
	exit;
}

include 'db_connection.php';

$user=mysql_query("SELECT person.username FROM person WHERE person.username = '".$_POST['username']."';");
$exists=0;
while ($row = mysql_fetch_assoc($user)){
		$exists = 1;
		break;
}
if( $exists == 1 )
{
	echo 'Exists|' . $_POST['username'];
}
else
{
	$passwordHash=md5($_POST['password']);
	mysql_query("INSERT INTO person(username,password,mail,total,victories) VALUES('".$_POST['username']."', '".$passwordHash."', '".$_POST['email']."', 0, 0)");
	echo 'ok';
}

?>