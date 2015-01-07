<?php
include 'db_connection.php';

$players = mysql_query('SELECT person.username, person.victories / person.total AS ratio FROM person ORDER BY ratio DESC LIMIT 5;');

$numRows = mysql_num_rows($players);
$counter = 1;
echo '{"p":[';
while ($row = mysql_fetch_assoc($players)){
    echo '{"u":';
    echo '"' . $row['username'] . '"';
    echo ',"r":';
    if ($row['ratio'] == NULL) echo 0;
    else echo $row['ratio'];
    echo '}';
    if ($counter < $numRows) echo ',';
    $counter++;
}
echo ']}';
?>