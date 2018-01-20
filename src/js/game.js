myRoomID = localStorage.getItem('room');
myUsername = localStorage.getItem('username');
hostControlsDrawn = false;
$users = $('#users');
$hostControls = $('#hostControls');
$messageForm = $('#messageForm');
$message = $('#message');
$chat = $('#chat');
$roomDisplay = $('#roomDisplay');
$numberOfPlayerDisplay = $('#numberOfPlayerDisplay');
$messageArea = $('#messageArea');
$gameArea = $('#gameArea');
$inGameChat = $('#inGameChat');
$gameChat = $('#gameChat');
$gameMessage = $('#gameMessage');
$roundNumber = $('#roundNumber');



function scrollToBottom(data) {
  console.log("scroll");
  const messages = document.getElementById(data);
  messages.scrollTop = messages.scrollHeight;
}


localStorage.clear();
const socket = io('/games');
socket.on('connect', () => {
  socket.emit('join', {
    room: myRoomID,
    user: myUsername
  });
  $roomDisplay.append('Room: <strong>' + myRoomID + '</strong>');
})
socket.on('get users', function(data) {
  $numberOfPlayerDisplay.html('Players in lobby: <strong>' + data.length + '</strong>');
  console.log(data);
  var html = '';

  if(myUsername != data[0]){
    var hostDetails = document.getElementById('hostControls');
    hostDetails.innerHTML = '';
    $hostControls.append('<h4>Waiting for game to start...</h4>');
  }

  for (i = 0; i < data.length; i++) {
    if (data.indexOf(data[i]) == 0) {
      host = data[0];
      if (myUsername == host) {
        if (hostControlsDrawn == false) {
          var hostDetails = document.getElementById('hostControls');
          hostDetails.innerHTML = '';
          $hostControls.append('<h4>Host Controls</h4><div id="buttonControls"><button id="go" type="button" class="btn btn-primary">Go</button><div id="kickControls"><button id="kick" type="button" class="btn btn-warning">Kick</button><select class="form-control" id="kickUserList"></select></div></div>');
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
//sending messages in game
$inGameChat.submit(function(e) {
  e.preventDefault();
  socket.emit('sendingame message', $gameMessage.val());
  $gameMessage.val('');
});
socket.on('kick', (data) => {
  // if i'm being kicked
  if (data == myUsername || data == 'invalid name') {
    window.location.href = "http://localhost:3000"
  }
})
//new message from the server
socket.on('new message', function(data) {
  console.log(data);
  switch(data.user){
    case myUsername:
      $chat.append('<div id="userMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    case "Announcer":
      $chat.append('<div id="serverMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    default:
      $chat.append('<div id="otherMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    }
      scrollToBottom("chat");
});
//new message from the server
socket.on('newingame message', function(data) {
  console.log(data);
  //if its my message - align right
  switch(data.user){
    case myUsername:
      $gameChat.append('<div id="userMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    case "Announcer":
      $gameChat.append('<div id="serverMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    default:
      $gameChat.append('<div id="otherMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
      break;
    }
    scrollToBottom("gameChat");
});
function refreshKickList(data) {
  var sel = document.getElementById('kickUserList');
  sel.innerHTML = '';
  var fragment = document.createDocumentFragment();
    data.forEach(function(user, index) {
      if (index != 0) {
        var opt = document.createElement('option');
        opt.innerHTML = user;
        opt.value = user;
        fragment.appendChild(opt);
      }
    });
    sel.appendChild(fragment);

  if(data.length >= 3){
  $('#hostControls').find('*').removeAttr('disabled');
}else if(data.length > 1){
  $('#hostControls').find('*').attr('disabled', true);
  $('#kickControls').find('*').removeAttr('disabled');
}else{
  $('#hostControls').find('*').attr('disabled', true);
}
}

socket.on('receive word', (data) =>{
  var previousImageGuess = document.getElementById('previousImageGuess');
  previousImageGuess.innerHTML = '';
  previousImageGuess.innerHTML = 'Your word is: '+data;

});

function gameStartup(){
  socket.emit('request word');
  startRoundTimer();
}

function startRoundTimer(){
  var count=10;
  var counter=setInterval(timer, 1000); //1000 will  run it every 1 second
  function timer()
  {
    count=count-1;
    if (count <= 0)
    {
       clearInterval(counter);
       //counter ended, do something here
       socket.emit("next round");
       return;
    }

   document.getElementById("roundTimer").innerHTML=count + "s"; // watch for spelling
    //Do code for showing the number of seconds here
  }

  // Display the result
  // document.getElementById("roundTimer").innerHTML = seconds + "s ";

  // If the count down is finished, write some text
}
socket.on('start game', () => {
  // starting the game
  $messageArea.hide();
  $gameArea.show();
})

socket.on('goto round', (pairs) => {
  // starting the game
  console.log(pairs.roundNumber)
  var roundNumDisplay = document.getElementById('roundNumber');
  roundNumDisplay.innerHTML = '';
  var numberOfRounds = (pairs.listOfGoes.length)-1;
  roundNumDisplay.innerHTML = 'Round Number: '+pairs.roundNumber+"/"+numberOfRounds
  //if its the first round we need to setup some game elements (get word etc..)
  if(pairs.roundNumber==1){
    gameStartup();
  }

})
