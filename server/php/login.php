<?php
//ulaz je $_POST['username'], $_POST['password']
session_start();
include 'spajanje_baze.php';

$provjeraKorisnika=mysql_query("SELECT person.username, person.password, person.id FROM person WHERE person.username = '.$_POST['username'].'");

while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		if (password_verify($_POST['password'], $row['password'])) {
			echo 'Uspješno ulogiran!';
			$_SESSION['id'] = $row['id'];
			$_SESSION['username'] = $_POST['username'];
		} 
		else {
			echo 'Neispravna kombinacija korisničkog imena/lozinke';
		}
		break;
}

?>