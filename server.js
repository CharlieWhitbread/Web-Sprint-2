var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');

class Lobby {
  constructor(roomId, players, type, maxPlayers) {
    this.roomId = roomId;
    this.players = players;
    this.maxPlayers = maxPlayers;
    this.type = type;
    this.inGame = false;
  }
}
defaultLobbyMax = 3;
lobbies = [];
loggedInUsers = [];
connections = [];
//namespace for lobbies
const games = io.of('/games');
server.listen(process.env.PORT || 3000);
console.log('Server running...');
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile('/index.html');
});
app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/game.html');
});
io.sockets.on('connection', (socket) => {
  connections.push(socket);
  socket.on('disconnect', (data) => {
    connections.splice(connections.indexOf(socket), 1);
    for (var i = 0; i <= loggedInUsers.length; i++) {
      if (loggedInUsers[i] == socket.username && socket.username != null) {
        loggedInUsers.splice(loggedInUsers.indexOf(socket.username), 1);
      }
    }
  });
  socket.on('log out', (data) => {
    //if you logout you remove yourself from users list but remain a connection
    loggedInUsers.splice(loggedInUsers.indexOf(socket.username), 1);
    socket.emit("revert login", socket.username);
  });
  //Login user
  socket.on('login user', (data, callback) => {
    callback(true);
    //Changes to uppercade and assigns to socket.username
    socket.username = jsUcfirst(data);
    loggedInUsers.push(socket.username);
    changeLoginLayout();
  });
  //Login Guest
  socket.on('login guest', () => {
    socket.username = jsUcfirst(getNewGuestName());
    loggedInUsers.push(socket.username);
    changeLoginLayout();
  });
  //Is the user logged in already or someone has the same name
  socket.on('islogged in', (data, callback) => {
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
  function jsUcfirst(string) {
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
  }
  //Creating the lobby for either public or private
  socket.on('play button', () => {
    var roomFound = false;
    //for each lobby
    for (var i = 0; i < lobbies.length; i++) {
      //if a public lobby exists and its free to join
      if (lobbies[i].type == "public" && (lobbies[i].players.length < lobbies[i].maxPlayers && lobbies[i].inGame == false)) {
        //goto that lobby
        socket.emit('goto lobby', lobbies[i]);
        roomFound = true;
        //add you to the room
        lobbies[i].players.push(socket.username);
      }
    }
    //if we havn't found a lobby
    if (!roomFound) {
      console.log("No lobby found...Creating one...")
      randId = Math.floor(Math.random() * 100000 + 1)
      var newLobby = new Lobby(randId, [socket.username], "public", defaultLobbyMax);
      lobbies.push(newLobby);
      socket.emit('goto lobby', newLobby);
    }
  });
  //checks if array is empty, returns true or false
  function isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }
  socket.on('join custom', (data) => {
    socket.join(data);
    var targetLobby = getLobbyByID(data);
    for (var i = 0; i < lobbies.length; i++) {
      if (lobbies[i].roomId == data && lobbies[i].inGame == false && lobbies[i].players.length < defaultLobbyMax) {
        lobbies[i].players.push(socket.username);
        socket.emit('goto lobby', targetLobby);
        games.in(data).emit('get users', getLobbyByID(data).players);
      }
    }
  });
  socket.on('create custom', (data) => {
    randId = Math.floor(Math.random() * 100000 + 1)
    var newLobby = new Lobby(randId, [socket.username], "private", defaultLobbyMax);
    lobbies.push(newLobby);
    socket.emit('goto lobby', newLobby);
  });
});

function getLobbyByID(data) {
  for (var i = 0; i <= lobbies.length; i++) {
    if (lobbies[i].roomId == data) {
      return lobbies[i];
    }
  }
}
/////////////////
// Game System //
/////////////////
games.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(data.room);
    socket.username = data.user;
    socket.myRoomID = data.room;
    //get index of my socket in my room
    //when you join a room - emit message letting people know you've joined.
    games.in(socket.myRoomID).emit('new message', {
      msg: socket.username + " has joined the room",
      user: "Announcer"
    });
    //refreshes all user lists in rooms
    //When you join a lobby emit to all rooms
    if (socket.username != null) {
      games.in(data.room).emit('get users', getLobbyByID(data.room).players);
    } else {
      socket.emit('kick', 'invalid name');
    }
  })
  socket.on('disconnect', (data) => {
    //remove name from lobby
    for (var i = 0; i < lobbies.length; i++) {
      if (lobbies[i].roomId == socket.myRoomID) {
        const index = lobbies[i].players.indexOf(socket.username);
        //removes you from lobby list
        lobbies[i].players.splice(index, 1);

        //announces player has left the room
        games.in(socket.myRoomID).emit('get users', getLobbyByID(socket.myRoomID).players);
        games.in(socket.myRoomID).emit('new message', {
          msg: socket.username + " has left the room",
          user: "Announcer"
        });
        //only removes you from the room if you're actually in a room...
        socket.leave(data);
        //if last person in the lobby delete the object
        if (lobbies[i].players.length == 0) {
          //find your lobby
          var lobbyIndex = lobbies.indexOf(lobbies[i]);
          //delete it from lobbylists
          lobbies.splice(lobbyIndex, 1);
        }
      }
    }
  });
  socket.on('send message', (data) => {
    games.in(socket.myRoomID).emit('new message', {
      msg: data,
      user: socket.username
    });
  });
  socket.on('sendingame message', (data) => {
    games.in(socket.myRoomID).emit('newingame message', {
      msg: data,
      user: socket.username
    });
  });
  socket.on('kick user', (data) => {
    //announces kick
    games.in(socket.myRoomID).emit('new message', {
      msg: socket.username + " has been kicked",
      user: "Announcer"
    });
    games.in(socket.myRoomID).emit('kick', data);
  });
  //Game not the lobby no more
  socket.on('ready', () => {
    console.log(socket.myRoomID +"has Started their game.");
    for (var i = 0; i < lobbies.length; i++) {
      if (lobbies[i].roomId == socket.myRoomID) {
        lobbies[i].inGame = true;
      }
    }
    games.in(socket.myRoomID).emit('start game');
  });
});
