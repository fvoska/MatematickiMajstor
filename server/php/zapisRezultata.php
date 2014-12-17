<?php
//ulaz je JSON s poljem roomId te poljem pobjednik gdje se nalazi ID pobjednika i metoda POST
//izlaz JSON : { "status" : 'success'}
if (is_ajax()) {
	include 'spajanje_baze.php';
	$igraci=mysql_query("SELECT person_in_room.personID FROM person_in_room WHERE person_in_room.roomID = ".$_POST['roomId']." ");
	while ($row = mysql_fetch_assoc($igraci)){
		if($row['personID'] == $_POST['pobjednik'])
		{
			mysql_query("UPDATE person SET total = total + 1,victories = victories + 1 WHERE person.id = ".$row['personID']." "); 
		}
		else
		{
			mysql_query("UPDATE person SET total = total + 1 WHERE person.id = ".$row['personID']." ");
		}
		
	}
	
	mysql_query("DELETE FROM room WHERE room.id = ".$_POST['roomId']." ");//treba provjeriti, ali bi se cascade trebal pobrinuti za zapise u person_in_room
	
	
	$returnValue = array(
    "status" => 'success'
	);
	echo json_encode($returnValue);
}
?>