<?php

// Expected parameters: $_POST['p'] -> user's ID.
include 'db_connection.php';
$playerId = $_GET['p'];

$player = mysql_query('SELECT person.total, person.victories FROM person WHERE person.id = ' . $playerId . ';');
$myAvg = mysql_query('SELECT ROUND(SUM(roomHistory.time) / SUM(roomHistory.answers), 2) AS avgTime FROM roomHistory WHERE roomHistory.personID = ' . $playerId . ' GROUP BY roomHistory.personID');

echo '{';
while ($row = mysql_fetch_assoc($player)) {
    echo '"t":' . $row['total'] . ',"w":' . $row['victories'];
    break;
}

while ($row = mysql_fetch_assoc($myAvg)) {
    echo ',"a":' . $row['avgTime'];
    break;
}
echo '}';

?>