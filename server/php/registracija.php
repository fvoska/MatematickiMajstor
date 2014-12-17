<?php
//ulaz je $_POST['username'],$_POST['password'],$_POST['email']
include 'spajanje_baze.php';
$provjeraKorisnika=mysql_query("SELECT person.username FROM person WHERE person.username = '.$_POST['username'].'");//provjera dal postoji vec korisnik s tim usernameom u bazi
$postoji=0;
while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		$postoji = 1;
		break;
}
if( $postoji == 1 )
{
	echo("Veæ postoji korisnik s tim korisnièkim imenom!");
}
else
{
	$hashPassworda=password_hash($_POST['password'], PASSWORD_DEFAULT);
	mysql_query("INSERT INTO person(username,password,mail,total,victories) VALUES('".$_POST['username']."', '".$hashPassworda."', '".$_POST['email']."', 0, 0)");
}

?>