$(function() {
  var socket = io.connect();
  var $username = $('#username');
  var $userForm = $('#userForm');
  var $loggedIn = $('#loggedIn');
  var myUsername;

  $userForm.submit(function(e) {
    e.preventDefault();
    if ($username.val().length <= 10) {
      socket.emit('login user', $username.val(), function(data) {});
    } else {
      console.log("too many characters");
    }
  });

  $('#guestBtn').click(function(e) {
    e.preventDefault();
    socket.emit('login guest');
  });

  socket.on('changelogin layout', function(data) {
    $userForm.hide();
    $loggedIn.show();
    myUsername = data;
    displayUserInfo(myUsername);
  })

  function displayUserInfo(username) {
    $loggedIn.append('<h3>Welcome ' + username + '</h3>');
  }
});