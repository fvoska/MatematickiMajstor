<?php
//ulaz je JSON s poljem userId i roomId i metoda POST
//izlaz JSON : { "status" : 'success'}
if (is_ajax()) {
  if (isset($_POST["userId"]) && !empty($_POST["userId"])) 
  { 
    include 'spajanje_baze.php';
	mysql_query("INSERT INTO person_in_room(personID, roomID) VALUES(".$_POST["userId"].",".$_POST['roomId'].")");//dodavanje osobe u tablicu person_in_room
	
	$returnValue = array(
    "status" => 'success'
	);
	
	echo json_encode($returnValue);
}



?>