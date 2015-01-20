<?php

include 'db_connection.php';

$players = mysql_query('SELECT person.username, ROUND(SUM(roomHistory.time) / SUM(roomHistory.answers), 2) AS avgTime FROM roomHistory INNER JOIN person ON roomHistory.personID = person.id GROUP BY roomHistory.personID ORDER BY avgTime ASC LIMIT 5;');

$numRows = mysql_num_rows($players);
$counter = 1;
echo '{"p":[';
while ($row = mysql_fetch_assoc($players)){
    echo '{"u":';
    echo '"' . $row['username'] . '"';
    echo ',"t":';
    if ($row['avgTime'] == NULL) echo 0;
    else echo $row['avgTime'];
    echo '}';
    if ($counter < $numRows) echo ',';
    $counter++;
}
echo ']}';

?>