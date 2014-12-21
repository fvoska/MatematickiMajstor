<!DOCTYPE html>
<html>
<head lang="hr">
    <meta charset="UTF-8">

    <link rel="stylesheet" type="text/css" href="bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="css/majstor-style.css">
    <!--<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Patrick+Hand">
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Courgette">
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Sacramento">
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Marck+Script">-->
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans:400italic,700,400">
    <!--<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans+Condensed:300">-->

    <script type="application/javascript" src="//code.jquery.com/jquery-2.1.1.min.js"></script>
    <script type="application/javascript" src="bootstrap/js/bootstrap.min.js"></script>
    <script type="application/javascript" src="//cdn.socket.io/socket.io-1.2.1.js"></script>
    <script type="application/javascript" src="js/majstor-client.js"></script>
    <title>Matematički Majstor</title>
</head>
<body>    
	<form action="" id="loginForm" method="POST">
	<br><br><br>
	<div class="login-container" style="width:350px; margin:auto">
		<div class="panel panel-primary login">
			<div class="panel-body">
                    <h2 style="margin-top:0x;">Prijava</h2>
				
					<div class="form-group">
						<label for="korisničkoIme"><b>Korisničko ime</b></label>
						<input type="text" class="form-control" id="korisničkoIme" name="userName" placeholder="Upišite korisničko ime" />
					</div>	
					<div class="form-group">
						<label for="lozinka"><b>Lozinka</b></label>
						<input type="password" class="form-control" id="šifra" name="pass" placeholder="Upišite lozinku" />
					</div>
					<br>
					<input type="submit" class="btn btn-primary" value="Prijava" />
			</div>
		</div>
	</div>
 </form>
 </body>
 </html>