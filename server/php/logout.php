<?PHP

session_start();
if (isset($_SESSION['username'])) {
    echo 'You (' . $_SESSION['username'] . ') are now logged out.';
}
else {
    echo 'You were not logged in.';
}
session_destroy();

?>