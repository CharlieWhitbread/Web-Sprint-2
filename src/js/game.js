$(function() {
    var socket = io.connect();
    var $messageForm = $('#messageForm');
    var $message = $('#message');
    var $chat = $('#chat');
    var $hostControls = $('#hostControls');
    var $messageArea = $('#messageArea');
    var $userFormArea = $('#userFormArea');
    var $userForm = $('#userForm');
    var $panel = $('#panel');
    var $guestButton=$('#guestButton');
    var $createRoomButton=$('#createRoomButton');
    var $wordDisplay = $('#wordDisplay');
    var $users = $('#users');
    var $username = $('#username');
    var myusername = '';
    var host = '';
    var hostControlsDrawn = false;
    var lobbyUsers = [];

    //sending messages
    $messageForm.submit(function(e) {
        e.preventDefault();
        socket.emit('send message', $message.val());
        $message.val('');
    });

    //new message from the server
    socket.on('new message', function(data) {
      if(data.user == myusername){
          $chat.append('<div id="userMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
        }
        else{
          $chat.append('<div id="otherMessage" class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
        }
    });


    $createRoomButton.click(function(e) {
      //if login as guest
      socket.emit('create room');

      //
    });


    //changes to the lobby area
    $userForm.submit(function(e) {

        socket.emit('join room',$username.val());
      //   e.preventDefault();
      //   if($username.val().length <= 10 && $.inArray($username.val(),lobbyUsers) == -1){
      //     console.log($username.val(),lobbyUsers);
      //     socket.emit('new user', $username.val(), function(data) {
      //       if (data) {
      //           $userFormArea.hide();
      //           $messageArea.show();
      //       }
      //   });
      // }
      //   else{
      //     console.log("too many characters");
      //   }
      //   myusername = $username.val();
      //   $username.val('');
    });

    // When a client connects
    socket.on('lobby users', function(data) {
        lobbyUsers = data;
        if(host == myusername && hostControlsDrawn==false && lobbyUsers > 0)
        {
          refreshKickList();
        }
    });

    // changes to the game area
    socket.on('start game', function() {
        $messageArea.hide();
        $panel.show();
    });

    socket.on('remove user', function(user) {
        if(user == myusername)
        {
          location.replace("http://bbc.co.uk/");
        }
        $chat.append('<div id="serverMessage" class="well"><strong>Announcement</strong>: ' +user+' has been Kicked</div>');

    });

    socket.on('get word', function(word) {
        console.log("Your word is: "+word);
        $wordDisplay.append('<h3>Your word is...</h3>');
        $wordDisplay.append('<h1>'+word+'</h1>');

    });

    socket.on('player leave', function(user) {
      $chat.append('<div id="serverMessage" class="well"><strong>Announcement</strong>: '+user+' has Disconnected</div>');
    });

    socket.on('player join', function(user) {
      $chat.append('<div id="serverMessage" class="well"><strong>Announcement</strong>: '+user+' has Joined</div>');
    });

    socket.on('new host', function(user){
      $chat.append('<div id="serverMessage" class="well"><strong>Announcement</strong>: '+user+' is the new Host</div>');
    });

    function refreshKickList(){
      var sel = document.getElementById('kickUserList');
      sel.innerHTML = '';
      var fragment = document.createDocumentFragment();

      lobbyUsers.forEach(function(user, index) {
        if(index!=0){
          var opt = document.createElement('option');
          opt.innerHTML = user;
          opt.value = user;
          fragment.appendChild(opt);
        }
      });
        sel.appendChild(fragment);
    }


    //gets all users and displays in the lobby list
    socket.on('get users', function(data) {
        var html = '';
        for (i = 0; i < data.length; i++) {
          if(data.indexOf(data[i]) == 0){
            host = data[0];
            if(myusername == host){
              if(hostControlsDrawn == false)
              {
                $hostControls.append('<h3>Host Controls</h3><div id="buttonControls"><button id="go" type="button" class="btn btn-primary">Go</button><div id="kickControls"><button id="kick" type="button" class="btn btn-warning">Kick</button><select class="form-control" id="kickUserList"></select></div><select class="form-control" id="roundTimeInput"><option>Animals</option><option>Cities</option><option>Vehicles</option><option>Food</option></select></div>');
              }
              refreshKickList();

              html += '<li class="list-group-item host"><img src="src/img/playerIcon.png" height="25" width="25"><img src="src/img/hostIcon.png" height="25" width="25"></img><b>' + data[i] + '</b></li>';
            }
            else{
              html += '<li class="list-group-item host"><img src="src/img/hostIcon.png" height="25" width="25"></img>' + data[i] + '</li>';
            }
            if(host == myusername && hostControlsDrawn != true) {
              hostControlsDrawn = true;
              // $hostControls.append('<h3>Host Controls</h3><div id="buttonControls"><button id="go" type="button" class="btn btn-primary">Go</button><div id="kickControls"><button id="kick" type="button" class="btn btn-warning">Kick</button><select class="form-control" id="kickUserList"></select></div><select class="form-control" id="roundTimeInput"><option>Animals</option><option>Cities</option><option>Vehicles</option><option>Food</option></select></div>');

              $('#go').click(function() {
                  socket.emit('ready', function() {
                  });
                });
                $('#kick').click(function() {
                  var kickedUser = $('#kickUserList').find(":selected").text();
                      socket.emit('kick user', kickedUser);
                    // socket.emit('kickuser', function() {});
                  });


              }else{

              }
              //if not host
          }else{
            if(myusername == data[i]){
              html+= '<li class="list-group-item player"><img src="src/img/playerIcon.png" height="25" width="25"></img><b>' + data[i] + '</b></li>';
            }
            else{
              html += '<li class="list-group-item player">' + data[i] + '</li>';
            }
          }
        }
        $users.html(html);
    });
});
