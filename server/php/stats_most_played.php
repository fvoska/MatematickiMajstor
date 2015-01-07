<?php

include 'db_connection.php';

$players = mysql_query('SELECT person.username, person.total FROM person ORDER BY person.total DESC LIMIT 5;');

$numRows = mysql_num_rows($players);
$counter = 1;
echo '{"p":[';
while ($row = mysql_fetch_assoc($players)){
    echo '{"u":';
    echo '"' . $row['username'] . '"';
    echo ',"t":';
    if ($row['total'] == NULL) echo 0;
    else echo $row['total'];
    echo '}';
    if ($counter < $numRows) echo ',';
    $counter++;
}
echo ']}';

?>