myRoomID = localStorage.getItem('room');
myUsername = localStorage.getItem('username');
hostControlsDrawn = false;
$users = $('#users');
$hostControls = $('#hostControls');
$messageForm = $('#messageForm');
$message = $('#message');
$chat = $('#chat');

localStorage.clear();

const socket = io('/games');

socket.on('connect', () => {
  socket.emit('join', {
    room: myRoomID,
    user: myUsername
  });
})

socket.on('get users', function(data) {
  console.log(data);
  var html = '';
  for (i = 0; i < data.length; i++) {
    if (data.indexOf(data[i]) == 0) {
      host = data[0];
      if (myUsername == host) {
        if (hostControlsDrawn == false) {
          $hostControls.append('<h3>Host Controls</h3><div id="buttonControls"><button id="go" type="button" class="btn btn-primary">Go</button><div id="kickControls"><button id="kick" type="button" class="btn btn-warning">Kick</button><select class="form-control" id="kickUserList"></select></div><select class="form-control" id="roundTimeInput"><option>Animals</option><option>Cities</option><option>Vehicles</option><option>Food</option></select></div>');
        }
        refreshKickList(data);

        html += '<li class="list-group-item host"><img src="src/img/playerIcon.png" height="25" width="25"><img src="src/img/hostIcon.png" height="25" width="25"></img><b>' + data[i] + '</b></li>';
      } else {
        html += '<li class="list-group-item host"><img src="src/img/hostIcon.png" height="25" width="25"></img>' + data[i] + '</li>';
      }
      if (host == myUsername && hostControlsDrawn != true) {
        hostControlsDrawn = true;
        $('#go').click(function() {
          socket.emit('ready', function() {});
        });
        $('#kick').click(function() {
          var kickedUser = $('#kickUserList').find(":selected").text();
          socket.emit('kick user', kickedUser);
          // socket.emit('kickuser', function() {});
        });
      }
    } else {
      if (myUsername == data[i]) {
        html += '<li class="list-group-item player"><img src="src/img/playerIcon.png" height="25" width="25"></img><b>' + data[i] + '</b></li>';
      } else {
        html += '<li class="list-group-item player">' + data[i] + '</li>';
      }
    }
    console.log("who am i: " + myUsername);
  }
  $users.html(html);
});

socket.on('disconnect', () => {
  // emiting to everybody
  socket.emit('disconnect', myRoomID);
  console.log(myUsername);
  console.log(myRoomID);
  socket.emit('refresh users');
})

//sending messages
$messageForm.submit(function(e) {
    e.preventDefault();
    socket.emit('send message', $message.val());
    $message.val('');
});

socket.on('kick', (data) => {
  // if i'm being kicked
  if(data==myUsername || data=='invalid name')
  {
    window.location.href = "http://localhost:3000"
  }
})

//new message from the server
socket.on('new message', function(data) {
  console.log(data);
  //if its my message - align right
  if(data.user == myUsername){
      $chat.append('<div id="userMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
    }
    //if its the Announcer, in the middle
    else if (data.user == "Announcer") {
      $chat.append('<div id="serverMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
    }
    //if its somone else
    else{
      $chat.append('<div id="otherMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
    }
});

function refreshKickList(data){
  var sel = document.getElementById('kickUserList');
  sel.innerHTML = '';
  var fragment = document.createDocumentFragment();

  data.forEach(function(user, index) {
    if(index!=0){
      var opt = document.createElement('option');
      opt.innerHTML = user;
      opt.value = user;
      fragment.appendChild(opt);
    }
  });
    sel.appendChild(fragment);
}
