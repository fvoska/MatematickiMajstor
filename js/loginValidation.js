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

        setNotifier("You have successfully logged out.", true, false);
        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(function() {
            setNotifier("You have successfully logged out.", false, false);
        }, 2500);
    });
}

function checkForm(form) {
    setNotifier("Logging in.", true, true);
    // Disable form
    $("#loginForm :input").prop("disabled", true);
    var loginPost = $.post(URLLoginPost, { username: form.username.value, password: form.password.value });
    loginPost.success(function(data) {
        console.log(data);
        if (data == "ok") {
            checkLogin();
            validationFeedback("You have successfully logged in.");
        }
        else if (data == "wrong") {
            validationFeedback("Wrong username/password combination.");
        }
        else {
            validationFeedback("Can not reach login server, please try again later.");
        }
        $("#loginForm :input").prop("disabled", false);
    });
    loginPost.fail(function(data) {
        // Re-enable form
        validationFeedback("Can not reach login server, please try again later.");
        $("#loginForm :input").prop("disabled", false);
    });
    return false;
}

var statusTimer = null;
function setNotifier(text, show, spinner) {
    $("#status-notifier-container").slideUp(250, function () {
        text = typeof text !== 'undefined' ? text : "Logging in";
        show = typeof show !== 'undefined' ? show : true;
        spinner = typeof spinner !== 'undefined' ? spinner : true;
        $("#status-notifier").html(" " + text);
        if (show == true) {
            $("#status-notifier-container").slideDown(250);
        }
        else {
            $("#status-notifier-container").slideUp(250);
        }
        if (spinner == true) {
            $("#spinner").show();
        }
        else {
            $("#spinner").hide();
        }
    });
}

function validationFeedback(text) {
    setNotifier(text, true, false);
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(function() {
        setNotifier(text, false, false);
    }, 3000);
}