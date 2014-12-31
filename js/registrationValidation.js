var URLRegisterPost="http://localhost/MatematickiMajstor/server/php/registracija.php";
var URLLoginPost="http://localhost/MatematickiMajstor/server/php/login.php";

function checkForm(form) {
    var x = form.email.value;
    var atpos = x.indexOf("@");
    var dotpos = x.lastIndexOf(".");
    if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length) {
        alert("Not a valid e-mail address!");
        return false;
    }

    if(form.username.value == "") {
      alert("Username can not be blank!");
        form.username.focus();
        return false;
    }
    var re = /^\w+$/;
    if(!re.test(form.username.value)) {
        alert("Username must contain only letters, numbers and underscores!");
        form.username.focus();
        return false;
    }

    if(form.password.value != "" && form.password.value == form.passwordConfirm.value) {
        if(form.password.value.length < 6) {
            alert("Password must contain at least six characters!");
            form.password.focus();
            return false;
        }
        if(form.password.value == form.username.value) {
            alert("Password must be different from Username!");
            form.password.focus();
            return false;
        }
        re = /[0-9]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one number (0-9)!");
            form.password.focus();
            return false;
        }
        re = /[a-z]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one lowercase letter (a-z)!");
            form.password.focus();
            return false;
        }
        re = /[A-Z]/;
        if(!re.test(form.password.value)) {
            alert("Password must contain at least one uppercase letter (A-Z)!");
            form.password.focus();
            return false;
        }
    } else {
        alert("Please check that you've entered and confirmed your password!");
        form.password.focus();
        return false;
    }

    //alert("You entered a valid password: " + form.pwd1.value);

    // Post to registration server.
    //$.post(URLRegisterPost, { username: form.username.value, password: form.password.value, email: form.email.value });
    var formData = $(form).serialize();
    var registerPost = $.post(URLRegisterPost, formData);
    registerPost.success(function(data){
        if (data.split('|')[0] != "Exists") {
            // Log in after registration
            alert("Successful registration. You will now be logged in!");
            var loginPost = $.post(URLLoginPost, formData);
            loginPost.success(function(data){

            });
        }
        else {
            // Username taken.
            alert("Username \"" + data.split('|')[1] + "\" is already taken");
        }
    });
    return false;
}

var ALERT_TITLE = "Oops!";
var ALERT_BUTTON_TEXT = "Ok";

if(document.getElementById) {
    window.alert = function(txt) {
        createCustomAlert(txt);
    }
}

function createCustomAlert(txt) {
    var d = document;

    if(d.getElementById("modalContainer")) return;

    var mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
    mObj.id = "modalContainer";
    mObj.style.height = d.documentElement.scrollHeight + "px";

    var alertObj = mObj.appendChild(d.createElement("div"));
    alertObj.id = "alertBox";
    if(d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
    alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth)/2 + "px";
    alertObj.style.visiblity="visible";

    var h1 = alertObj.appendChild(d.createElement("h1"));
    h1.appendChild(d.createTextNode(ALERT_TITLE));

    var msg = alertObj.appendChild(d.createElement("p"));
    //msg.appendChild(d.createTextNode(txt));
    msg.innerHTML = txt;

    var btn = alertObj.appendChild(d.createElement("a"));
    btn.id = "closeBtn";
    btn.appendChild(d.createTextNode(ALERT_BUTTON_TEXT));
    btn.href = "#";
    btn.focus();
    btn.onclick = function() { removeCustomAlert();return false; }

    alertObj.style.display = "block";

}

function removeCustomAlert() {
    document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
}
function ful(){
    alert('Alert this pages');
}

