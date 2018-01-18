var myUsername;
var myRoomID;

$(function() {
  var socket = io.connect();
  var $username = $('#username');
  var $customLobbyURL=$('#customLobbyURL');
  var $userForm = $('#userForm');
  var $playerStats = $('#playerStats');
  var $loginControl = $('#loginControl');
  var $loggedIn = $('#loggedIn');

  $userForm.submit(function(e) {
    e.preventDefault();
    socket.emit('islogged in', $username.val(), function(data) {
      if (data) {
        if ($username.val().length <= 10) {
          socket.emit('login user', $username.val(), function(data) {});
        } else {
          console.log("too many characters");
        }
      }
    });
  });
//login as Guest
  $('#guestBtn').click(function(e) {
    e.preventDefault();
    socket.emit('login guest');
  });

  $('#playButton').click(function(e) {
    e.preventDefault();
    socket.emit('play button');
    // send username and create room id to the server
    // store the values
    // redirect and access them values from the server
  });

  //if they want to join a custom lobbylobby
  $('#joinCustomBtn').click(function(e) {
    e.preventDefault
    var customlobbyInput = $('#customLobbyURL').val();
    console.log("attempting to join:"+ customlobbyInput);
    socket.emit('join custom',customlobbyInput);
  });

  //create custom lobby
  $('#createCustomBtn').click(function(e) {
    e.preventDefault
    socket.emit('create custom');
  });

  socket.on('changelogin layout', function(data) {
    $userForm.hide();
    $loggedIn.show();
    myUsername = data;
    localStorage.setItem("username", myUsername);
    //This is to stop multiple appends on the stats elements
    displayUserInfo(myUsername);
    $('#lobbyInfo').find('*').removeAttr('disabled');
  });

  //if someone logs out
  socket.on('revert login', function(data) {
    $userForm.show();
    $loggedIn.hide();
    myUsername = "";
    $('#lobbyInfo').find('*').attr('disabled', true);
  });

  socket.on('goto lobby',function(data){
    localStorage.setItem("room", data.roomId);
    window.location.href="/game#"+data.roomId
  });

  function displayUserInfo(username) {
    document.getElementById("loggedIn").innerHTML = "";
    $loggedIn.append('<h3>Welcome ' + username + '</h3>');
    $loggedIn.append('<div id="playerStats"></div>');
    $loggedIn.append('<div class="btn-group">');
    $loggedIn.append('<input type="button" class="btn btn-outline-danger uiBtn" id="leaderboardBtn" value="Leaderboard" />');
    $loggedIn.append('<input type="button" class="btn btn-outline-warning uiBtn" id="logoutBtn" value="Logout" /></div>');

    //events have to be after append
    $('#logoutBtn').click(function(e) {
      e.preventDefault()
      socket.emit('log out',myUsername);
    });

    $('#leaderboardBtn').click(function(e) {
      e.preventDefault();
      window.location.href = 'http://www.bbc.co.uk';
    });
  }
//Joining a public lobby or creating a public lobby
$('#joinPublicBtn').click(function(e) {
  e.preventDefault()
  socket.emit('create room', 'public')
});

//Creating a private lobby
$('#createCustomBtn').click(function(e) {
  e.preventDefault()
  socket.emit('create room', 'private')
});
});
