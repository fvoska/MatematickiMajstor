<?php

//ulaz je JSON s poljem userId i roomId i metoda POST
//izlaz JSON : { "status" : "roomDeleted"/"personDeleted"}; ako je roomDeleted onda je brisanje pokrenula zadnja osoba iz sobe pa smo izbrisali i sobu, a ako je personDeleted onda smo samo izbrisali osobu, a soba jos postoji
if (is_ajax()) {
  if (isset($_POST["userId"]) && !empty($_POST["userId"])) 
  { 
    include 'spajanje_baze.php';
	mysql_query("DELETE FROM person_in_room WHERE personID = ".$_POST["userId"]." AND roomID = ".$_POST['roomId']." ");//brisanje osobe iz tablice person_in_room
	
	$peopleInRoom=mysql_query("SELECT person_in_room.roomID FROM person_in_room WHERE person_in_room.roomID = ".$_POST['roomId']." ");
	$praznaSoba = 1;
	while ($row = mysql_fetch_assoc($peopleInRoom)){
		$praznaSoba = 0;
		break;
	}
	
	if($praznaSoba == 1)
	{
		//nema vise nikoga u sobi pa ju treba izbrisati iz tablice roomID
		mysql_query("DELETE FROM room WHERE id = ".$_POST['roomId']." ");
		$status = "roomDeleted";
	}
	else
	{
		$status = "personDeleted";
	}
	$returnValue = array(
    "status" => $status
	);
	
	echo json_encode($returnValue);
}

?>