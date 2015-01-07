<?php

// Expected parameters: $_POST['p'] -> user's ID.
include 'db_connection.php';
$playerId = $_GET['p'];

$player = mysql_query('SELECT person.total, person.victories FROM person WHERE person.id = ' . $playerId . ';');

while ($row = mysql_fetch_assoc($player)){
    echo '{"t":' . $row['total'] . ',"w":' . $row['victories'] . '}';
}
?>