<?php

// Expected parameters: $_POST['p'] -> array of player IDs, $_POST['w'] -> winner ID.
include 'db_connection.php';
$playersInfo = $_POST['players'];
$winnerId = $_POST['winner'];
$numPlayers = count($playersInfo);

// Record total played and games won for each player.
$playersIds = array();
for ($i = 0; $i < $numPlayers; $i++)
{
	$playerInfo = json_decode($playersInfo[$i]);
	array_push($playersIds, $playerInfo->{'userId'});
}

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

// Record room.
$timeFinished = date ("Y-m-d H:i:s");
$roomName = $_POST['roomName'];

$q = "INSERT INTO room (name, finished, winnerID) VALUES ('" . $roomName . "','" . $timeFinished . "','" . $winnerId . "');";
$room = mysql_query($q);
$roomId = mysql_insert_id();

// Record room-player stats
for ($i = 0; $i < $numPlayers; $i++)
{
	$playerInfo = json_decode($playersInfo[$i]);
	$playerTotalAnswers = $playerInfo->{'totalAnswers'};
	$playerTotalTime = $playerInfo->{'totalTime'};
	$playerId = $playerInfo->{'userId'};

	$q = "INSERT INTO roomHistory (personID, roomID, time, answers) VALUES ('" . $playerId . "','" . $roomId . "','" . $playerTotalTime . "','" . $playerTotalAnswers . "');";
	$room_player = mysql_query($q);
}

?>