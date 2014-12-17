<?php
//ulaz je JSON s poljem userId i metoda POST
//izlaz JSON : { "roomId" : $roomId, "roomName" : $roomName}
if (is_ajax()) {
  if (isset($_POST["userId"]) && !empty($_POST["userId"])) 
  { 
    include 'spajanje_baze.php';
	mysql_query("INSERT INTO room(name) VALUES('room".$_POST['userId']."')");//stvaranje nove sobe u bazi
	
	$createdRoom=mysql_query("SELECT room.id, room.name FROM room ORDER BY room.id DESC TAKE 1");
	while ($row = mysql_fetch_assoc($provjeraKorisnika)){
		$roomId = $row['id'];
		$roomName = $row['name'];
		break;
	}
	
	mysql_query("INSERT INTO person_in_room( roomID,personID) VALUES(".$roomID.",".$_POST['userId'].")");//dodavanje osobe u tablicu person_in_room
	
	$returnValue =array(
    "roomId" => $roomId,
    "roomName" => $roomName,
	);
	
	echo json_encode($returnValue);
}



?>