var myId = -1;
$(document).ready(function() {
    $(".statusLoggedIn").hide();
    $(".statusNotLoggedIn").hide();

    var userStats = $.get(URLSessionTest);
    userStats.success(function(data) {
        getUserData(data);
    });

    // Fill in top 5 ratio players.
    var ratio = $.get(URLGetRatioStats);
    ratio.success(function(data) {
        console.log(data);
        var JSONdata = JSON.parse(data);
        var players = JSONdata.p;
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            var tableRow = "<tr><td>" + (i + 1) + "</td><td>" + player.u + "</td><td>" + player.r * 100 + "%</td></tr>"
            $("#succ5").append(tableRow);
        }
    });

    // Fill in top 5 number of games players.
    var ratio = $.get(URLGetMostPlayedStats);
    ratio.success(function(data) {
        console.log(data);
        var JSONdata = JSON.parse(data);
        var players = JSONdata.p;
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            var tableRow = "<tr><td>" + (i + 1) + "</td><td>" + player.u + "</td><td>" + player.t + "</td></tr>"
            $("#most5").append(tableRow);
        }
    });

    var fastest = $.get(URLGetFastestPlayerStats);
    fastest.success(function(data) {
        console.log(data);
        var JSONdata = JSON.parse(data);
        var players = JSONdata.p;
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            var tableRow = "<tr><td>" + (i + 1) + "</td><td>" + player.u + "</td><td>" + player.t + "s</td></tr>"
            $("#fast5").append(tableRow);
        }
    });
});
function logout() {
    $.get(URLLogout, function() {
        $(".statusLoggedIn").slideUp(250, function() {
            $(".statusNotLoggedIn").slideDown(250);
            myId = -1;
            $.get(URLSessionTest).success(function(data) {
                getUserData(data);
            });
        });
    });
}
function getUserData(data) {
    var pieData;
    var showNumber = ": <%if(segments[i].value){%><%=segments[i].value%><%}%>";
    var shouldShowTooltips = true;;
    if (data != "") {
        var splitUsername = data.split(" ");
        myId = parseInt(splitUsername[0]);
        $("#statusLoggedInUsername").html(splitUsername[1]);
        $(".statusNotLoggedIn").slideUp(250, function() {
            $(".statusLoggedIn").slideDown(250);
        });

        // Offer to log out.
        $("#logged-username").html(splitUsername[1]);
        $("#logout-container-slider").slideDown();
        $("#login-container-slider").slideUp();
        $("#loginForm :input").prop("disabled", true);

        shouldShowTooltips = true;
    }
    else if (data == "") {
        $(".statusLoggedIn").slideUp(250, function() {
            $(".statusNotLoggedIn").slideDown(250);
        });

        // OK.
        $("#logout-container-slider").slideUp();
        $("#login-container-slider").slideDown();
        $("#loginForm :input").prop("disabled", false);

        shouldShowTooltips = false;
        showNumber = "";
    }

    // Fill in chart data.
    var stats = $.get(URLGetPlayerStats, { "p": myId } );
    stats.success(function(data) {
        $("#chart").empty();
        if (data != "") {
            var JSONdata = JSON.parse(data);
            if (JSONdata.t != 0) {
                    pieData = [
                        {
                            value: JSONdata.w,
                            color: "#398439",
                            highlight: "#449d44",
                            label: "Games won"
                        }, {
                            value: JSONdata.t - JSONdata.w,
                            color: "#983331",
                            highlight: "#a94442",
                            label: "Games lost"
                        }
                    ];
                $("#chart").append("<div style=\"color:#337ab7\">Number of games played: " + JSONdata.t + "</div>");
                $("#chart").append("<div style=\"color:#337ab7\">Win percentage: " + JSONdata.w / JSONdata.t * 100 + "%</div>");
            }
            else if (JSONdata.t == 0) {
                shouldShowTooltips = false;
                showNumber = "";
                pieData = [
                    {
                        value: 1,
                        color:"#2e6da4",
                        highlight: "#337ab7",
                        label: "No games played yet"
                    }];
            }
        }
        else {
            pieData = [
                {
                    value: 1,
                    color:"#2e6da4",
                    highlight: "#337ab7",
                    label: "Log in in order to track stats"
                }];
        }
        var options = {
            showTooltips: shouldShowTooltips,
            legendTemplate : "<% for (var i=0; i<segments.length; i++){%>" +
            "<div style=\"color:<%=segments[i].fillColor%>\"><%if(segments[i].label){%><%=segments[i].label%><%}%>" + showNumber + "</div>" +
            "<%}%>"
        }
        var ctx = document.getElementById("chart-area").getContext("2d");
        var myPie = new Chart(ctx).Pie(pieData, options);
        var legend = myPie.generateLegend();
        $("#chart").append(legend);
        if (data != "") {
            var JSONdata = JSON.parse(data);
            if (JSONdata.a != 0) {
                $("#chart").append("<div style=\"color:#337ab7\">Your average time to answer: " + JSONdata.a + "s</div>");
            }
        }
    });
}