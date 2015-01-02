<?php

// Expected parameters: $_POST['username'], $_POST['password'], $_POST['email'].
if (!isset($_POST['username']) || !isset($_POST['password']) || !isset($_POST['email'])) {
	echo 'wrong';
	exit;
}

include 'db_connection.php';

$provjeraKorisnika=mysql_query("SELECT person.username FROM person WHERE person.username = '".$_POST['username']."';");//provjera dal postoji vec korisnik s tim usernameom u bazi
$postoji=0;
while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		$postoji = 1;
		break;
}
if( $postoji == 1 )
{
	echo 'Exists|' . $_POST['username'];
}
else
{
	//$hashPassworda=password_hash($_POST['password'], PASSWORD_DEFAULT);
	// Iz nekog razloga password_hash vraća svaki put drugačiju vrijednost
	// Privremeno stavljeno na MD5
	$hashPassworda=md5($_POST['password']);
	mysql_query("INSERT INTO person(username,password,mail,total,victories) VALUES('".$_POST['username']."', '".$hashPassworda."', '".$_POST['email']."', 0, 0)");
	echo 'ok';
}

?>