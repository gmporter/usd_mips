// First, we find out what team we're on
var url = window.location.pathname;
var filename = url.substring(url.lastIndexOf('/')+1);
var team_num = /\d/.exec(filename);
console.log("I'm on team " + team_num);

var cur_state = -1

// If we're an admin page, add info to the footer
if (filename.includes("admin")) {
    var footerElt = document.getElementById("thefooter");
    footerElt.innerHTML += '<a href="#" id="team1btn" class="button">Team 1</a><a href="#" id="team2btn" class="button">Team 2</a><a href="#" id="team3btn" class="button">Team 3</a><a href="#" id="team4btn" class="button">Team 4</a><a href="#" id="resetbtn" class="button">RESET</a>'

    var myTeamSelector = "#team" + team_num + "btn";
    $(function() {
        $(myTeamSelector).text("Advance");
        $(myTeamSelector).click(function()
        {
            $.get("advance_state/"+team_num);
            return false; // don't reload
        });

        $("#resetbtn").click(function()
        {
            $.get("reset");
            return false;
        });
    });
}

function handleMIPSEvent(evt) {
    // load the correct part of our page
    console.log("New event: " + evt);
    newState = evt.split(',');
    myState = newState[team_num];
    console.log("new state is " + newState + ", my state is: " + myState);
    setMyActiveState(myState);

    if (filename.includes("admin")) {
        team3State = newState[3];
        btn = document.getElementById("team3btn");
        if (team3State == 7) {
            btn.style.background="#32CD32";
        } else {
            btn.style.background=null;
        }
    }
}

// Reveal content related to the current state
function setMyActiveState(n) {
    if (cur_state == n) {
        console.log("ignoring event for another team");
        return;
    } else {
        cur_state = n;
    }

    makeAllHidden();

    for (i = 0; i <= n; i++) {
        var newStateContainer = document.getElementById("state" + i)
        if (typeof newStateContainer !== 'undefined' && newStateContainer !== null) {
            newStateContainer.style.display = "initial";
        }
    }

    // don't show the MIPS logo while we're playing the game
    if (n > 0) {
        document.getElementById("state0").style.display = "none";
    }

    window.scrollTo(0,0);
}

// Make all the content hidden
function makeAllHidden() {
    var contentHandles = document.getElementsByClassName("ui-content");
    for (i = 0; i < contentHandles.length; i++) {
        contentHandles[i].style.display = "none";
    }
}

// set the initial state
$.get("current_state", function(data) {
    handleMIPSEvent(data);
});

// Setup the communication channel
var eventOutputContainer = document.getElementById("main");
console.log(eventOutputContainer);
var evtSrc = new EventSource("/subscribe");

evtSrc.onmessage = function(e) {
    handleMIPSEvent(e.data);
};
