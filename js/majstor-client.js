var correctAnswer;
var myBegin;
var myUsername;
var currentRoom = "Lobby";
var playersList = [];
var socket;

$(document).ready(function() {
    $(".statusLoggedIn").hide();
    $(".statusNotLoggedIn").hide();

    $.get(URLSessionTest, function(data) {
        if (data == "") {
            // Redirect to login or play as anonymous.
            $(".statusLoggedIn").slideUp(250, function() {
                $(".statusNotLoggedIn").slideDown(250);
            });

            BootstrapDialog.show({
                title: "You are not logged in",
                message: "<h4>Would you like to log in, register or play anonymously?</h4>If you play anonymously, your statistics will not be recorded.",
                closable: false,
                draggable: true,
                buttons: [{
                    label: "Login",
                    cssClass: "btn-primary",
                    action: function(dialogItself){
                        dialogItself.close();
                        var url = "login.html";
                        $(location).attr("href", url);
                    }
                }, {
                    label: "Register",
                    cssClass: "btn-primary",
                    action: function (dialogItself) {
                        dialogItself.close();
                        var url = "registration.html";
                        $(location).attr("href", url);
                    }
                }, {
                    label: "Play anonymously",
                    cssClass: "btn-default",
                    action: function (dialogItself) {
                        dialogItself.close();
                        myUsername = randomString(4, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') + "-" + randomString(4, '0123456789');
                        setupSockets();
                    }
                }]
            });
        }
        else {
            $("#statusLoggedInUsername").html(data);
            $(".statusNotLoggedIn").slideUp(250, function() {
                $(".statusLoggedIn").slideDown(250);
            });

            // Get username.
            myUsername = data + Date.now().toString(); // Timestamp for testing with multiple tabs with same account.
            // myUsername = data; // Use this for production
            setupSockets();
        }
    });
});

function setupSockets() {
    // Sockets section, handles events from server.
    socket = io.connect(socketURL);

    // Fired upon a connection error.
    socket.io.on("connect_error", function(err) {
        console.log("connect_error");
        $("#conenction-alert").slideDown();
        switchRoom("Lobby");
    });

    // Fired upon a successful reconnection.
    socket.io.on("reconnect", function(numAttempt) {
        console.log("reconnect");
        $("#conenction-alert").slideUp();
        switchRoom("Lobby");
    });

    // On socket conenction.
    socket.on("connect", function() {
        // Add user and prompt for name.
        // Once we have DB in place we will use username from DB instead of a prompt.
        //myUsername = prompt("What's your name: ");
        playersList.push(myUsername);
        socket.emit("addUser", myUsername);
        $("#conenction-alert").slideUp();
    });

    // Chat update
    socket.on("updateChat", function (username, data) {
        // Append message to HTML.
        $("#conversation").prepend('<div class="chatItem"><b>'+ username + ':</b> ' + data + '</div>');
    });

    // Update room list.
    socket.on("updateRooms", function (rooms, current_room) {
        /*
         rooms variable structure: array of JSONs
         [{"roomName": "room1", "numberOfUsers": 3}, {"roomName": "room2", "numberOfUsers": 1},...]
         */
        // We always receive list of all room, so empty HTML before adding rooms.
        $("#rooms").empty();
        $.each(rooms, function(key, value) {
            // value is JSON string, parse it into JSON object.
            var roomJSON = JSON.parse(value);

            // If there are no rooms except Lobby this will be null.
            if (roomJSON != null) {
                if (roomJSON.roomName == current_room) {
                    // Don't allow users to join room they are already in.
                    $("#rooms").prepend('<div class="roomItem">' + roomJSON.roomName + ' (' + roomJSON.numberOfUsers + '/4)</div>');
                }
                else {
                    // Create link with onlick function that switches rooms.
                    $("#rooms").prepend('<div class="roomItem"><a href="#" onclick="switchRoom(\'' + roomJSON.roomName + '\')">' + roomJSON.roomName + ' (' + roomJSON.numberOfUsers + '/4)</a></div>');
                }
                $(".roomItem").css({ "margin": "5px", "padding": "5px" }); // For some reason, properties from css file aren't working.
                $(".roomItem").attr("")
            }
        });
    });

    // Received new task
    socket.on("task", function(task) {
        /* task structure: JSON
         {
         "task": "2 + 2",
         "result": "4",
         "suggestions": ["1", "2", "3"] <- this isn't yet implemented in server, will be soon.
         }
         */

        // Enable buttons.
        $(".suggestion").prop("disabled", false);
        $(".suggestion").css({"background-color": "#337ab7"});

        // Reset user list colors.
        $(".player").css({"color": "#337ab7"});

        // Parse JSON.
        var taskJSON = JSON.parse(task);

        // Show task on webpage.
        $("#task").animate({"opacity": "0"}, 250, null, function() {
            $("#task").html(taskJSON.task);
            $("#task").animate({"opacity": "1"}, 250);
        });

        // Add correct answer to suggestions array.
        var suggestionsArray = [];
        suggestionsArray.push(taskJSON.result);

        // Add suggestions to suggestions array.
        for (var i = 0; i < 3; i++) {
            //suggestionsArray.push(i);
            suggestionsArray.push(taskJSON.suggestions[i]);
        }

        // Shuffle suggestions.
        suggestionsArray = shuffle(suggestionsArray);

        // Show suggestions in "boxes" on webpage.

        $(".suggestion").animate({"opacity": "0"}, 250, null, function() {
            for (var i = 1; i <= 4; i++) {
                $("#suggestion" + i).html(suggestionsArray[i-1]);
            }
            $(".suggestion").animate({"opacity": "1"}, 250);
        });

        // Remember correct answer.
        correctAnswer = taskJSON.result;

        // Start timer.
        myBegin = new Date().getTime();
    });

    // Round results.
    socket.on("roundResults", function(fastestPlayer, fastestTime, over) {
        if (fastestPlayer == null) {
            // Noone answered correctly in time.
        }
        else {
            $(".progress-bar").each(function() {
                var userTemp = $(this);
                if (userTemp.html() == fastestPlayer)
                {
                    // Increase progress bar for fastest player.
                    var progress = parseInt(userTemp.attr('aria-valuenow')) + 25;
                    userTemp.css('width', progress+'%').attr('aria-valuenow', progress);
                }
            });
        }

        if (over) {
            BootstrapDialog.show({
                title: "The game is over",
                message: fastestPlayer + " won the game with 3 wins.",
                closable: false,
                draggable: true,
                buttons: [{
                    label: "Go to Lobby",
                    cssClass: "btn-primary",
                    action: function(dialogItself){
                        dialogItself.close();
                        switchRoom("Lobby");
                    }
                }]
            });
        }
    });

    // New user in room notification.
    socket.on("updateUsers", function(users) {
        // Store list locally.
        playersList = users;
        console.log(playersList);

        // Clear DOM.
        $("#players").empty();
        $("#progressContainer").empty();

        // Insert each player in DOM.
        for (var i = 0; i < playersList.length; i++) {
            $("#players").prepend('<div class="player" id="player' + i + '">' + playersList[i] + '</div>');
            $("#progressContainer").prepend('<div class="progress">' +
            '<div id="progress' + i + '" class="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%;">' + playersList[i] + '</div>' +
            '</div>');
        }
    });

    // Feedback from other player answers.
    socket.on("someoneAnswered", function(user, result, time) {
        // Find element of that player
        $(".player").each(function() {
            var userTemp = $(this);
            if (userTemp.html() == user)
            {
                // Color it according to wrong/right answer.
                if (result == "T") {
                    userTemp.css({"color": "green"});
                }
                else if (result == "F") {
                    userTemp.css({"color": "red"});
                }
            }
        });
    });
}

function logout() {
    $.get(URLLogout, function() {
        location.reload();
        /*$.ajax({
            url: "",
            context: document.body,
            success: function(s, x){
                $(this).html(s);
            }
        });*/
    });
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

// Join other room. It will create new room if it doesn't exits.
function switchRoom(room) {
    if (currentRoom == room) return;
    currentRoom = room;
    $("#players").empty();
    socket.emit('switchRoom', room);
    if ($("#middleContainer").css("margin-top") != "0px") {
        // Go to Lobby.
        $("#progressContainer").empty();
        $("#task").animate({"opacity": "0"}, 250);
        $(".suggestion").animate({"opacity": "0"}, 250);

        $("#roomCreation").fadeOut(250, function() {
            $("#middleContainer").css({"margin": "0px", "width": "100%"});
            $("#roomPlay").fadeIn(250);
        });

        $("#roomsHeader").slideUp(300, function() {$("#playersHeader").slideDown(300);});
        $("#chatHeaderLobby").slideUp(300, function() {$("#chatHeaderGame").slideDown(300);});

        $("#rooms").slideUp(250);
        setTimeout(function() {$("#players").slideDown();}, 125);
        setTimeout(function() {$("#leaveRoom").slideDown(500);}, 250);
    }
    else {
        // Go to game.
        $("#roomPlay").fadeOut(250, function() {
            $("#middleContainer").css({"margin": "auto", "margin-top": "240px", "width": "350px"});
            $("#roomCreation").fadeIn(250);
        });

        $("#playersHeader").slideUp(300, function() {$("#roomsHeader").slideDown(300);});
        $("#chatHeaderGame").html(room);
        $("#chatHeaderGame").slideUp(300, function() {$("#chatHeaderLobby").slideDown(300);});

        $("#rooms").slideDown(250);
        setTimeout(function() {$("#players").slideUp();}, 125);
        setTimeout(function() {$("#leaveRoom").slideUp(500);}, 250);
    }
}

// This section handles button clicks.
$(function() {
    // Send chat message on button click.
    $("#chatSend").click( function() {
        var message = $("#chatData").val();
        $("#chatData").val("");
        socket.emit("sendChat", message);
        $("#chatData").focus();
    });

    // Send chat message on enter.
    $("#chatData").keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $("#chatSend").focus().click();
            $(this).focus();
        }
    });

    // Join room on enter.
    $("#roomName").keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $("#joinRoom").focus().click();
        }
    });

    // Join room
    $("#joinRoom").click(function() {
        var name = $("#roomName").val();
        $("#roomName").val("");
        switchRoom(name);
    });

    // Leave room.
    $("#leaveRoom").click(function() {
        switchRoom("Lobby");
    });

    // Handle clicks on 4 suggestion boxes.
    $(".suggestion").click(function() {
        // Disable clicked button.
        $(this).prop("disabled", true);

        // Get suggestion value.
        var chosenSuggestion = $(this).html();

        // Check if it's correct or not.
        var result = "F";
        if (chosenSuggestion == correctAnswer) {
            result = "T";
            $(".suggestion").not(this).css({"background-color": "grey"});
            $(this).css({"background-color": "green"});
            $(".suggestion").prop("disabled", true);
        }
        else {
            // Punish by 5 seconds. !!! Or it would maybe be better to just disable further answering.
            myBegin -= 5000;
            $(this).css({"background-color": "red"});
        }

        // Stop timer.
        var myEnd = new Date().getTime();

        // Send to server to register answer.
        if ((myEnd - myBegin) != null)
            socket.emit("taskAnswered", result, (myEnd - myBegin) / 1000);
    });
});