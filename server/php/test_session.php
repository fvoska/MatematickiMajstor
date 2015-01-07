<?php

    // Returns ID and username or empty string if user isn't logged in.
    session_start();
    if (isset($_SESSION['username']))
    {
        echo $_SESSION['id'] . ' ' . $_SESSION['username'];
    }
    else
    {
        echo '';
    }

?>