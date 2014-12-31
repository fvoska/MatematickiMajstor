<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <span>Your username: </span>
    <?php
        session_start();
        if (isset($_SESSION['username']))
        {
            echo '<span style="color: green;">' . $_SESSION['username'] . '</span>';
        }
        else
        {
            echo '<span style="color: red;">not logged in</span>';
        }
    ?>
</body>
</html>