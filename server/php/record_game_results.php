<?php

// Expected parameters: $_POST['p'] -> array of player IDs, $_POST['w'] -> winner ID.
include 'db_connection.php';
$playersIds = $_POST['p'];
$winnerId = $_POST['w'];
$numPlayers = count($playersIds);

$playersIdsQuery = '(' . join(',', $playersIds) . ')';
$players = mysql_query('SELECT person.id, person.username FROM person WHERE person.id IN ' . $playersIdsQuery . ';');

while ($row = mysql_fetch_assoc($players)){
	if($row['id'] == $winnerId)
	{
		echo 'W:';
		mysql_query('UPDATE person SET total = total + 1, victories = victories + 1 WHERE person.id = ' . $row['id'] . ';');
	}
	else
	{
		echo 'L:';
		mysql_query('UPDATE person SET total = total + 1 WHERE person.id = ' . $row['id'] . ';');
	}
	echo $row['username'];
	echo '<br>';
}

?>