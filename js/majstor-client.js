var correctAnswer;
var myBegin;
var myUsername;
var myId = -1;
var currentRoom = "Lobby";
var playersList = [];
var socket;
var colors = [];

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
            var splitUsername = data.split(" ");
            $("#statusLoggedInUsername").html(splitUsername[1]);
            $(".statusNotLoggedIn").slideUp(250, function() {
                $(".statusLoggedIn").slideDown(250);
            });

            // Get username and id.
            //myUsername = data + Date.now().toString(); // Timestamp for testing with multiple tabs with same account.
            myId = parseInt(splitUsername[0]);
            myUsername = splitUsername[1]; // Use this for production
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
        console.log(myId);
        socket.emit("addUser", myUsername, myId);
        $("#conenction-alert").slideUp();
    });

    // Chat update
    socket.on("updateChat", function (username, data) {
        // Append message to HTML.
        if (username == myUsername) {
            $("#conversation").prepend('<div class="chatItem"><b>Me:</b> ' + data + '</div>');
        }
        else if (username == "SERVER") {
            $("#conversation").prepend('<div class="chatItemYellow">' + data + '</div>');
        }
        else {
            $("#conversation").prepend('<div class="chatItemRed"><b>'+ username + ':</b> ' + data + '</div>');
        }
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
                if (roomJSON.roomName == current_room || roomJSON.numberOfUsers == 4 || roomJSON.ready) {
                    // Don't allow users to join room they are already in.
                    $("#rooms").prepend('<div class="roomItem"><a href="#" class="disabled" onclick="switchRoom(\'' + roomJSON.roomName + '\')">' + roomJSON.roomName + ' (' + roomJSON.numberOfUsers + '/4)</a></div>');
                }
                else if (roomJSON.numberOfUsers < 4) {
                    // Create link with onlick function that switches rooms.
                    $("#rooms").prepend('<div class="roomItem"><a href="#" onclick="switchRoom(\'' + roomJSON.roomName + '\')">' + roomJSON.roomName + ' (' + roomJSON.numberOfUsers + '/4)</a></div>');
                }
                $(".roomItem").css({ "margin": "5px", "padding": "5px" }); // For some reason, properties from css file aren't working.
                $(".roomItem").attr("")
            }
        });
    });

    // Ready state
    socket.on("readyFeedback", function (username, isReady) {
        $("#cc-" + username).prop("checked", isReady);
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
        $(".playerName").css({"color": "#337ab7"});

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
            // Find fastest player's progress bar.
            var playerProgressBar = $("#pg-" + fastestPlayer);
            // Increase progress bar for fastest player.
            var progress = parseInt(playerProgressBar.attr('aria-valuenow')) + 25;
            playerProgressBar.css('width', progress+'%').attr('aria-valuenow', progress);
        }

        if (over) {
            var winnerName = fastestPlayer;
            if (winnerName == myUsername) winnerName = "<b>You</b>";
            BootstrapDialog.show({
                title: "The game is over",
                message: "<h3>" + winnerName + " won the game with 3 wins.</h3>",
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

        // Reset user list colors.
        $(".player .playerName").css({"color": "#337ab7"});

        // Hide task.
        $(".suggestion").prop("disabled", true);
        $("#task").animate({"opacity": "0"}, 250);
        $(".suggestion").animate({"opacity": "0"}, 250);

        // Insert each player in DOM.
        var myIndex = 0;
        for (var i = 0; i < playersList.length; i++) {
            if (playersList[i].username == myUsername) myIndex = i;
        }

        // Insert others.
        for (var i = 0; i < playersList.length; i++) {
            if (i != myIndex) {
                var playerUsername = playersList[i].username;
                var checked = "";
                if (playersList[i].ready) checked = "checked";
                // Show in players list.
                $("#players").prepend('<div class="player" id="pc-' + playerUsername + '">' +
                '<div class="playerName" id="pn-' + playerUsername + '">' + playerUsername + '</div>' +
                '<div class="customCheckbox disabled others">' +
                '<input type="checkbox" value="None" id="cc-' + playerUsername + '" name="check' + playerUsername + '" ' + checked + '/>' +
                '<label for="cc-' + playerUsername + '"></label>' +
                '</div>' +
                '</div>');

                // Add progress bar.
                var progressbarValue = 25 + 25 * playersList[i].won;
                $("#progressContainer").prepend('<div class="progress">' +
                '<div id="pg-' + playerUsername + '" class="progress-bar" role="progressbar" aria-valuenow="' + progressbarValue + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + progressbarValue + '%;">' + playerUsername + '</div>' +
                '</div>');

                // Color progress bar.
                $("#pg-" + playerUsername).css("background-color", colors[i]);
                $("#pc-" + playerUsername).css("background-color", colors[i]);
            }
        }

        // Show me at top of players list.
        var meDisabled = "";
        var meChecked = "";
        if (playersList[myIndex].ready) {
            meDisabled = " disabled";
            meChecked = "checked";
        }
        $("#players").prepend('<div class="panel-heading red" style="border-radius: 4px;"><h3 class="panel-title">Other players</h3></div>');
        $("#players").prepend('<div class="player" id="pc-' + myUsername + '">' +
        '<div class="playerName" id="pn-' + myUsername + '">' + myUsername + '</div>' +
        '<div class="customCheckbox' + meDisabled + '">' +
        '<input type="checkbox" value="None" id="cc-' + myUsername + '" name="check' + myUsername + '" ' + meChecked + '/>' +
        '<label for="cc-' + myUsername + '"></label>' +
        '</div>' +
        '</div>');

        // My progress bar.
        var myProgressbarValue = 25 + 25 * playersList[myIndex].won;
        $("#progressContainer").prepend('<div class="progress">' +
        '<div id="pg-' + myUsername + '" class="progress-bar" role="progressbar" aria-valuenow="' + myProgressbarValue + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + myProgressbarValue + '%;">' + myUsername + '</div>' +
        '</div>');

        // My color progress bar.
        $("#pg-" + myUsername).css("background-color", colors[myIndex]);
        $("#pc-" + myUsername).css("background-color", colors[myIndex]);

        // Set event handler on my ready click.
        $("#cc-" + myUsername).parent().removeClass("disabled");
        $("#cc-" + myUsername).click(function () {
            if (playersList.length > 1) {

                ready(this.checked);
                $(this).parent().addClass("disabled");
            }
            else {
                $(this).attr("checked", false);
                BootstrapDialog.show({
                    title: "Not enough players",
                    message: "You can not play alone. Please wait for more players.",
                    closable: true,
                    draggable: true,
                    buttons: [{
                        label: "OK",
                        cssClass: "btn-primary",
                        action: function(dialogItself){
                            dialogItself.close();
                        }
                    }]
                });
            }
        });
    });

    // Room full;
    socket.on("roomFull", function() {
        var dialog = BootstrapDialog.show({
            title: "Room exists",
            message: "<h4>Game with same room name already exists and is full.</h4>Please try another name.",
            closable: false,
            draggable: true,
            buttons: [{
                label: "Try another name",
                cssClass: "btn-primary",
                action: function(dialogItself){
                    dialogItself.close();
                    switchRoom("Lobby");
                    $("#roomName").focus();
                }
            }]
        });
        setTimeout(function() {
            switchRoom("Lobby");
            dialog.close();
        }, 5000);
    });

    // Feedback from other player answers.
    socket.on("someoneAnswered", function(user, result, time) {
        // Find element of that player
        var player = $("#pn-" + user);

        // Color it according to wrong/right answer.
        if (result == "T") {
            player.css({"color": "green"});
        }
        else if (result == "F") {
            player.css({"color": "red"});
        }
    });
}

// Join other room. It will create new room if it doesn't exits.
function switchRoom(room) {
    // No point in joining current room.
    if (currentRoom == room) return;

    if (room != "Lobby") {
        // Generate new random colors.
        var i = 0;
        colors = [];
        while (i < 4) {
            colors.push(getRandomColor());
            i++;
        }
    }

    // Change room.
    currentRoom = room;
    $("#players").empty();
    socket.emit('switchRoom', room);

    if (currentRoom != "Lobby") {
        // Going to game.

        $("#progressContainer").empty();
        $("#task").animate({"opacity": "0"}, 250);
        $(".suggestion").animate({"opacity": "0"}, 250);
        $(".suggestion").prop("disabled", true);

        $("#roomCreation").fadeOut(250, function() {
            $("#middleContainer").css({"margin": "0px", "width": "100%"});
            $("#roomPlay").fadeIn(250);
        });

        $("#roomsHeader").slideUp(300, function() {
            $("#playersHeader").slideDown(300);
        });
        $("#chatHeaderLobby").slideUp(300, function() {
            $("#chatHeaderGame").html(room);
            $("#chatHeaderGame").slideDown(300);
        });

        $("#rooms").slideUp(250);
        setTimeout(function() {$("#players").slideDown();}, 125);
        setTimeout(function() {$("#leaveRoom").slideDown(500); $("#roomScroller").css({ "height": "460px" })}, 250);
    }
    else {
        // Going to Lobby.
        $("#roomPlay").fadeOut(250, function() {
            $("#middleContainer").css({"margin": "auto", "margin-top": "240px", "width": "350px"});
            $("#roomCreation").fadeIn(250);
        });

        $("#playersHeader").slideUp(300, function() {
            $("#roomsHeader").slideDown(300);
        });
        $("#chatHeaderGame").slideUp(300, function() {
            $("#chatHeaderLobby").slideDown(300);
        });

        $("#rooms").slideDown(250);
        setTimeout(function() {$("#players").slideUp();}, 125);
        setTimeout(function() {$("#leaveRoom").slideUp(500); $("#roomScroller").css({ "height": "500px" })}, 250);
    }
}

function refreshRooms() {
    socket.emit("refreshRooms");
}

function logout() {
    $.get(URLLogout, function() {
        myId = -1;
        location.reload();
    });
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle.
    while (0 !== currentIndex) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function getRandomColor() {
    // HEX color code.
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

function ready(isReady) {
    socket.emit("ready", isReady);
}

function cleanInput(input) {
    var div = $('<div/>');
    div.html(input);
    div.contents().filter(function(){
        return this.nodeType !== 3;
    }).after(function(){
        return $(this).text();
    }).remove();
    return div.html();
}

function validRoomName(roomName) {
    // Validate form.
    var passed = true;
    var message = "";

    if (roomName == "") {
        message = "<h4>Room name can not be blank!</h4>"
        passed = false;
    }

    var re = /^(\w+\s*)*$/;
    if (passed && (!re.test(roomName))) {
        message = "<h4>Room name must contain only letters, numbers, spaces and underscores!</h4>";
        passed = false;
    }

    if (!passed) {
        BootstrapDialog.show({
            title: "Invalid room name",
            message: message,
            closable: true,
            draggable: true,
            buttons: [{
                label: "Try another name",
                cssClass: "btn-primary",
                action: function(dialogItself){
                    dialogItself.close();
                }
            }]
        });
    }

    return passed;
}

// This section handles button clicks.
$(function() {
    // Send chat message on button click.
    $("#chatSend").click( function() {
        var message = cleanInput($("#chatData").val());
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
        var name = cleanInput($("#roomName").val());
        if (validRoomName(name)) {
            $("#roomName").val("");
            switchRoom(name);
        }
        else {
            $("#roomName").focus();
        }
    });

    // Leave room.
    $("#leaveRoom").click(function() {
        switchRoom("Lobby");
    });

    $("#refreshRooms").click(function() {
        refreshRooms();
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
            $(this).css({"background-color": "green"});
        }
        else {
            $(this).css({"background-color": "red"});
        }
        $(".suggestion").not(this).css({"background-color": "grey"});
        $(".suggestion").prop("disabled", true);

        // Stop timer.
        var myEnd = new Date().getTime();

        // Send to server to register answer.
        if ((myEnd - myBegin) != null)
            socket.emit("taskAnswered", result, (myEnd - myBegin) / 1000);
    });
});