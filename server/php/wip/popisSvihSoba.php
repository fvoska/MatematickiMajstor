<?php
//ulaz 
//izlaz JSON koji sadrži listu gdje je svaki član oblika {"id" => $row['id'],"ime" => $row['name'], "brojOsoba" => $row['brojOsoba']}
if (is_ajax()) {
  
    include 'spajanje_baze.php';
	$returnValue = array();
	
	$allRooms=mysql_query("SELECT room.id, room.name, COUNT(person_in_room.personID) AS brojOsoba FROM room JOIN person_in_room ON room.id = person_in_room.roomID GROUP BY room.id, room.name");
	while ($row = mysql_fetch_assoc($allRooms)){
		$returnValue[] = array("id" => $row['id'],"ime" => $row['name'], "brojOsoba" => $row['brojOsoba']);
		break;
	}
	
    echo json_encode($returnValue);




?>