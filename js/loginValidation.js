var URLLoginPost = "http://localhost/MatematickiMajstor/server/php/login.php";
var URLLogout = "http://localhost/MatematickiMajstor/server/php/logout.php";
var URLSessionTest = "http://localhost/MatematickiMajstor/server/php/test_session.php";

$(document).ready(function() {
    checkLogin();
});

function checkLogin() {
    $("#loginForm :input").prop("disabled", true);
    $.get(URLSessionTest, function(data) {
        if (data != "") {
            // Offer to log out.
            $("#logged-username").html(data);
            $("#logout-container-slider").slideDown();
            $("#login-container-slider").slideUp();
            $("#loginForm :input").prop("disabled", true);
        }
        else if (data == "") {
            // OK.
            $("#logout-container-slider").slideUp();
            $("#login-container-slider").slideDown();
            $("#loginForm :input").prop("disabled", false);
        }
    });
}

function logout() {
    $.get(URLLogout, function() {
        $("#loginForm :input").prop("disabled", false);
        $("#logout-container-slider").slideUp();
        $("#login-container-slider").slideDown();
    });
}

function checkForm(form) {
    // Disable form
    $("#loginForm :input").prop("disabled", true);
    var loginPost = $.post(URLLoginPost, { username: form.username.value, password: form.password.value });
    loginPost.success(function(data) {
        console.log(data);
        if (data == "ok") {
            //alert("You have successfully logged in!");
            checkLogin();
        }
        else if (data == "wrong") {
            alert("Wrong username/password combination!");
            $("#loginForm :input").prop("disabled", false);
        }
    });
    loginPost.fail(function(data){
        // Re-enable form
        alert("Can't reach login server, please try again later.");
        $("#loginForm :input").prop("disabled", false);
    });
    return false;
}