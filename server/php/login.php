<?php
// Ulaz je $_POST['username'], $_POST['password']
session_start();
include 'spajanje_baze.php';

$provjeraKorisnika=mysql_query("SELECT person.username, person.password, person.id FROM person WHERE person.username = '".$_POST['username']."';");

while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		// Trebalo bi prije provjere onda još hashati.
		//$hashPassworda=password_hash($_POST['password'], PASSWORD_DEFAULT);
		// Iz nekog razloga password_hash vraća svaki put drugačiju vrijednost
		// Privremeno stavljeno na MD5
		$hashPassworda=md5($_POST['password']);
		if ($row['password'] == $hashPassworda) {
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