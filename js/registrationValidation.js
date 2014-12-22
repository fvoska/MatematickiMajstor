

    function checkForm(form)
    {
		
		var x = form.email.value;
		var atpos = x.indexOf("@");
		var dotpos = x.lastIndexOf(".");
		if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length) {
			alert("Not a valid e-mail address!");
			return false;
		}
	
      if(form.userName.value == "") {
          alert("Username can not be blank!");
            form.userName.focus();
            return false;
        }
        re = /^\w+$/;
        if(!re.test(form.userName.value)) {
            alert("Username must contain only letters, numbers and underscores!");
            form.userName.focus();
            return false;
        }

        if(form.pass1.value != "" && form.pass1.value == form.pass2.value) {
            if(form.pass1.value.length < 6) {
                alert("Password must contain at least six characters!");
                form.pass1.focus();
                return false;
            }
            if(form.pass1.value == form.userName.value) {
                alert("Password must be different from Username!");
                form.pass1.focus();
                return false;
            }
            re = /[0-9]/;
            if(!re.test(form.pass1.value)) {
                alert("Password must contain at least one number (0-9)!");
                form.pass1.focus();
                return false;
            }
            re = /[a-z]/;
            if(!re.test(form.pass1.value)) {
                alert("Password must contain at least one lowercase letter (a-z)!");
                form.pass1.focus();
                return false;
            }
            re = /[A-Z]/;
            if(!re.test(form.pass1.value)) {
                alert("Password must contain at least one uppercase letter (A-Z)!");
                form.pass1.focus();
                return false;
            }
        } else {
            alert("Please check that you've entered and confirmed your password!");
            form.pass1.focus();
            return false;
        }

        //alert("You entered a valid password: " + form.pwd1.value);
        return true;
    }
	
	
	var ALERT_TITLE = "Oops!";
    var ALERT_BUTTON_TEXT = "Ok";

    if(document.getElementById) {
        window.alert = function(txt) {
            createCustomAlert(txt);
        }
    }
	
	

    function createCustomAlert(txt) {
        d = document;

        if(d.getElementById("modalContainer")) return;

        mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
        mObj.id = "modalContainer";
        mObj.style.height = d.documentElement.scrollHeight + "px";

        alertObj = mObj.appendChild(d.createElement("div"));
        alertObj.id = "alertBox";
        if(d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
        alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth)/2 + "px";
        alertObj.style.visiblity="visible";

        h1 = alertObj.appendChild(d.createElement("h1"));
        h1.appendChild(d.createTextNode(ALERT_TITLE));

        msg = alertObj.appendChild(d.createElement("p"));
        //msg.appendChild(d.createTextNode(txt));
        msg.innerHTML = txt;

        btn = alertObj.appendChild(d.createElement("a"));
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

