$(function() {
  var socket = io.connect();
  var $username = $('#username');
  var $userForm = $('#userForm');
  var $playerStats = $('#playerStats');
  var $loginControl = $('#loginControl');
  var $loggedIn = $('#loggedIn');
  var myUsername;

  $userForm.submit(function(e) {
    e.preventDefault();
    socket.emit('islogged in', $username.val(), function(data) {
      if (data) {
        if ($username.val().length <= 10 && $username.val().length > 0) {
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


  //after someone logs in
  socket.on('changelogin layout', function(data) {
    $userForm.hide();
    $loggedIn.show();
    myUsername = data;
    //This is to stop multiple appends on the stats elements
    displayUserInfo(myUsername);
  });

  //if someone logs out
  socket.on('revert login', function(data) {
    $userForm.show();
    $loggedIn.hide();
    myUsername = "";
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
});
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
