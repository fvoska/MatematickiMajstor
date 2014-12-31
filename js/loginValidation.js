var URLLoginPost="http://localhost/MatematickiMajstor/server/php/login.php";

function checkForm(form) {
    var formData = $(form).serialize();
    var loginPost = $.post(URLLoginPost, formData);
    loginPost.success(function(data){
        console.log(data);
    });
    return false;
}