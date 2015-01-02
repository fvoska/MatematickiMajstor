var URLRegisterPost="http://localhost/MatematickiMajstor/server/php/register.php";
var URLLoginPost="http://localhost/MatematickiMajstor/server/php/login.php";

function checkForm(form) {
    // Disable form.
    $("#registrationForm :input").prop("disabled", true);

    // Validate form.
    var x = form.email.value;
    var atpos = x.indexOf("@");
    var dotpos = x.lastIndexOf(".");
    var passed = true;
    if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length) {
        alert("Not a valid e-mail address!");
        passed = false;
    }

    if(form.username.value == "") {
        alert("Username can not be blank!");
        form.username.focus();
        passed = false;
    }
    var re = /^\w+$/;
    if(!re.test(form.username.value)) {
        alert("Username must contain only letters, numbers and underscores!");
        form.username.focus();
        passed = false;
    }

    if(form.password.value != "" && form.password.value == form.passwordConfirm.value) {
        if(form.password.value.length < 6) {
            alert("Password must contain at least six characters!");
            form.password.focus();
            passed = false;
        }
        if(form.password.value == form.username.value) {
            alert("Password must be different from Username!");
            form.password.focus();
            passed = false;
        }
        re = /[0-9]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one number (0-9)!");
            form.password.focus();
            passed = false;
        }
        re = /[a-z]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one lowercase letter (a-z)!");
            form.password.focus();
            passed = false;
        }
        re = /[A-Z]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one uppercase letter (A-Z)!");
            form.password.focus();
            passed = false;
        }
    } else {
        alert("Please check that you've entered and confirmed your password!");
        form.password.focus();
        passed = false;
    }

    if (passed == false)
    {
        $("#registrationForm :input").prop("disabled", false);
        return false;
    }

    // Post to registration server.
    var registerPost = $.post(URLRegisterPost, { username: form.username.value, password: form.password.value, email: form.email.value });
    registerPost.success(function(data) {
        if (data == "ok") {
            // Log in after registration.
            alert("Successful registration. You will now be logged in!");
            var loginPost = $.post(URLLoginPost, { username: form.username.value, password: form.password.value });
            
            loginPost.success(function(data) {
                // Redirect to game?
            });

            loginPost.fail(function(data) {
                alert("Something went horribly wrong :(");
                $("#registrationForm :input").prop("disabled", false);
            });
        }
        else if (data.split('|')[0] == "Exists") {
            // Username taken.
            alert("Username \"" + data.split('|')[1] + "\" is already taken");
        }

        // Re-enable form.
        $("#registrationForm :input").prop("disabled", false);
    });
    registerPost.fail(function(data) {
        // Re-enable form.
        alert("Can't reach registration server, please try again later.");
        $("#registrationForm :input").prop("disabled", false);
    });
    return false;
}

