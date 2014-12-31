<?php
//ulaz je $_POST['username'],$_POST['password'],$_POST['email']
include 'spajanje_baze.php';

$provjeraKorisnika=mysql_query("SELECT person.username FROM person WHERE person.username = '".$_POST['username']."';");//provjera dal postoji vec korisnik s tim usernameom u bazi
$postoji=0;
while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		$postoji = 1;
		break;
}
if( $postoji == 1 )
{
	echo("Exists|" . $_POST['username']);
}
else
{
	//$hashPassworda=password_hash($_POST['password'], PASSWORD_DEFAULT);
	// Iz nekog razloga password_hash vraća svaki put drugačiju vrijednost
	// Privremeno stavljeno na MD5
	$hashPassworda=md5($_POST['password']);
	mysql_query("INSERT INTO person(username,password,mail,total,victories) VALUES('".$_POST['username']."', '".$hashPassworda."', '".$_POST['email']."', 0, 0)");
	//sendLogin($_POST['username'], $_POST['password']);
}

function sendLogin($username, $password)
{
	$url = dirname($_SERVER['REQUEST_URI']) . '/login.php';
	$data = array('username' => $username, 'password' => $password);

	// use key 'http' even if you send the request to https://...
	$options = array(
		'http' => array(
			'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
			'method'  => 'POST',
			'content' => http_build_query($data),
		),
	);
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);

	var_dump($result);
}

?>