<?php

// Expected parameters: $_POST['username'], $_POST['password'].
if (!isset($_POST['username']) || !isset($_POST['password'])) {
	echo 'wrong';
	exit;
}

session_start();
include 'db_connection.php';

$userRow=mysql_query("SELECT person.username, person.password, person.id FROM person WHERE person.username = '".$_POST['username']."';");

$numRows = mysql_num_rows($userRow);
if ($numRows == 0) {
	echo 'wrong';
}

while ($row = mysql_fetch_assoc($userRow)){
		$passwordHash=md5($_POST['password']);
		if ($row['password'] == $passwordHash) {
			echo 'ok';
			$_SESSION['id'] = $row['id'];
			$_SESSION['username'] = $_POST['username'];
		}
		else {
			echo 'wrong';
		}
		break;
}

?>