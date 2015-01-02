<?PHP

session_start();
if (isset($_SESSION['username'])) {
    echo 'You (' . $_SESSION['username'] . ') are now logged out.';
    // Maybe redirect to login?
}
else {
    echo 'You were not logged in.';
}
session_destroy();

?>