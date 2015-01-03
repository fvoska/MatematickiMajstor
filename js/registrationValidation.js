var URLLoginPost="http://localhost/MatematickiMajstor/server/php/login.php";
var URLRegisterPost="http://localhost/MatematickiMajstor/server/php/register.php";
var URLSessionTest = "http://localhost/MatematickiMajstor/server/php/test_session.php";

$(document).ready(function() {
    $.get(URLSessionTest, function(data) {
        if (data != "") {
            // Redirect to login.
            var url = "login.html";
            $(location).attr("href", url);
        }
    });
});

function checkForm(form) {
    resetAlerts();
    // Disable form.
    $("#registrationForm :input").prop("disabled", true);

    // Validate form.
    var passed = true;

    if(form.username.value == "") {
        //alert("Username can not be blank!");
        validationFeedback("#username-alert", "Username can not be blank!");
        $("#username").focus();
        passed = false;
    }

    var re = /^\w+$/;
    if(passed && (!re.test(form.username.value))) {
        //alert("Username must contain only letters, numbers and underscores!");
        validationFeedback("#username-alert", "Username must contain only letters, numbers and underscores!");
        $("#username").focus();
        passed = false;
    }

    var x = form.email.value;
    var atpos = x.indexOf("@");
    var dotpos = x.lastIndexOf(".");
    if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length) {
        //alert("Not a valid e-mail address!");
        validationFeedback("#email-alert", "Not a valid e-mail address!");
        $("#email").focus();
        passed = false;
    }

    if(form.password.value != "" && form.password.value == form.passwordConfirm.value) {
        if(form.password.value.length < 6) {
            //alert("Password must contain at least six characters!");
            validationFeedback("#password-alert", "Password must contain at least six characters!");
            $("#password").focus();
            passed = false;
        }
        if(form.password.value == form.username.value) {
            //alert("Password must be different from Username!");
            validationFeedback("#password-alert", "Password must be different from Username!");
            $("#password").focus();
            passed = false;
        }
        re = /[0-9]/;
        if(!re.test(form.password.value)) {
            //alert("Password must contain at least one number (0-9)!");
            validationFeedback("#password-alert", "Password must contain at least one number (0-9)!");
            $("#password").focus();
            passed = false;
        }
        re = /[a-z]/;
        if(!re.test(form.password.value)) {
            //alert("Password must contain at least one lowercase letter (a-z)!");
            validationFeedback("#password-alert", "Password must contain at least one lowercase letter (a-z)!");
            $("#password").focus();
            passed = false;
        }
        re = /[A-Z]/;
        if(!re.test(form.password.value)) {
            //alert("Password must contain at least one uppercase letter (A-Z)!");
            validationFeedback("#password-alert", "Password must contain at least one uppercase letter (A-Z)!");
            $("#password").focus();
            passed = false;
        }
    } else {
        //alert("Please check that you've entered and confirmed your password!");
        validationFeedback("#password-alert", "Please check that you've entered and confirmed your password!");
        $("#password").focus();
        passed = false;
    }

    if (passed == false)
    {
        $("#registrationForm :input").prop("disabled", false);
        return false;
    }

    // Post to registration server.
    var registerPost = $.post(URLRegisterPost, { username: form.username.value, password: form.password.value, email: form.email.value });
    setNotifier("Registering.", true, true);
    registerPost.success(function(data) {
        if (data == "ok") {
            // Log in after registration.
            //alert("Successful registration. You will now be logged in!");
            notifierFeedback("Successful registration. You will now be logged in!");
            var loginPost = $.post(URLLoginPost, { username: form.username.value, password: form.password.value });
            
            loginPost.success(function(data) {
                // Redirect to game?
                var url = "login.html";
                $(location).attr("href", url);
            });

            loginPost.fail(function(data) {
                alert("Something went horribly wrong :(");
                $("#registrationForm :input").prop("disabled", false);
            });
        }
        else if (data.split('|')[0] == "Exists") {
            // Username taken.
            //alert("Username \"" + data.split('|')[1] + "\" is already taken");
            validationFeedback("username-alert", "Username \"" + data.split('|')[1] + "\" is already taken");
        }
        else {
            notifierFeedback("Can not reach registration server, please try again later.");
        }

        // Re-enable form.
        $("#registrationForm :input").prop("disabled", false);
    });
    registerPost.fail(function(data) {
        // Re-enable form.
        //alert("Can not reach registration server, please try again later.");
        notifierFeedback("Can not reach registration server, please try again later.");
        $("#registrationForm :input").prop("disabled", false);
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

function validationFeedback(element, text) {
    $(element).slideUp(250, function() {
        $(element + " .alert-message").html(text);
        $(element).slideDown(250);
    });
}

function notifierFeedback(text) {
    setNotifier(text, true, false);
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(function() {
        setNotifier(text, false, false);
    }, 3000);
}

function resetAlerts() {
    $(".alert-danger").slideUp(250);
    $("#status-notifier-container").slideUp(250);
}