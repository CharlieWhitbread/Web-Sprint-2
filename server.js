var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');

class Lobby {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players;
  }
}


lobbies = [];
loggedInUsers = [];
connections = [];

const games = io.of('/games');

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.sendFile('/index.html');
});

app.get('/game', function(req, res) {
  res.sendFile(__dirname + '/game.html');
});

io.sockets.on('connection', function(socket) {
  connections.push(socket);

  // Disconnect
  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
    for (var i = 0; i <= loggedInUsers.length; i++) {
      if (loggedInUsers[i] == socket.username && socket.username != null) {
        loggedInUsers.splice(loggedInUsers.indexOf(socket.username), 1);
      }
    }
  });

  socket.on('log out', function(data){
    //if you logout you remove yourself from users list but remain a connection
    console.log(socket.username + " logged out!");
    loggedInUsers.splice(loggedInUsers.indexOf(socket.username),1);
    socket.emit("revert login",socket.username);
  });

  //Login user
  socket.on('login user', function(data, callback) {
    callback(true);
    //Changes to uppercade and assigns to socket.username
    socket.username = jsUcfirst(data);
    loggedInUsers.push(socket.username);
    console.log(socket.username + " has logged in");
    changeLoginLayout();
  });
  //Login Guest
  socket.on('login guest', function() {
    socket.username = jsUcfirst(getNewGuestName());
    loggedInUsers.push(socket.username);
    console.log(socket.username + " is a guest account");
    changeLoginLayout();
  });
  //Is the user logged in already or someone has the same name
  socket.on('islogged in', function(data, callback) {
    var formattedUser = jsUcfirst(data)
    var match = false;
    for (var i = 0; i <= loggedInUsers.length; i++) {
      if (loggedInUsers[i] == formattedUser) {
        callback(false);
      } else {
        match = true;
      }
    }
    if (match) {
      callback(true);
    }
  });

  //Changes first charecter uppercase gGj -> Ggj
  function jsUcfirst(string)
  {
      var lowcasestring = string.toLowerCase();
      return lowcasestring.charAt(0).toUpperCase() + lowcasestring.slice(1);
  }

  //Create guest name
  function getNewGuestName() {
    var users = Moniker.generator([Moniker.adjective]);
    return users.choose();
  }
  //Changes the login layout to show the user and stats
  function changeLoginLayout() {
    socket.emit("changelogin layout", socket.username);
    console.log(loggedInUsers.length + "players are logged in");
  }
  //Creating the lobby for either public or private
  socket.on('play button', function() {
    randId = Math.floor(Math.random()*100000+1)
    var newLobby = new Lobby(randId,[socket.username]);
    lobbies.push(newLobby);
    console.log("play!");

    socket.emit('goto lobby',newLobby);
  });

  function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

socket.on('join custom', (data) =>{
  socket.join(data);
  var targetLobby = getLobbyByID(data);
  socket.emit('goto lobby',targetLobby);
  lobbies[0].players.push(socket.username);
  console.log(lobbies[0]);
  games.in(data).emit('get users',getLobbyByID(data).players);
});

function getLobbyByID(data){
  for (var i = 0; i <= lobbies.length; i++) {
  if (lobbies[i].roomId == data) {
    return lobbies[i];
  } else {
    console.log("can't find lobby");
  }
}
}
});

function getLobbyByID(data){
  for (var i = 0; i <= lobbies.length; i++) {
  if (lobbies[i].roomId == data) {
    return lobbies[i];
  } else {
    console.log("can't find lobby");
  }
}
}

// Game System
games.on('connection',(socket) => {
  socket.on('join', (data) =>{
    console.log(data.user);
    socket.join(data.room);
    socket.username = data.user;
    socket.myRoomID =data.room;
    console.log(socket.rooms);
    //get index of my socket in my room
    //use the index lobbies[data.room].players
    games.in(data.room).emit('message', `New ${data.user} has joined ${data.room} room!`);

    //refreshes all user lists in rooms
    games.in(data.room).emit('get users',getLobbyByID(data.room).players);
    console.log(data.room)
  })
  socket.on('disconnect', (data) =>{
    socket.leave(data);
    console.log(socket.rooms);
  });
    socket.on('send message',(data) =>{
      console.log(data);
      console.log(socket.username);
      console.log(socket.myRoomID);
      games.in(socket.myRoomID).emit('new message',{msg:data, user:socket.username});
    });

})
