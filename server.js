var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');

loggedInUsers = [];
connections = [];
rooms = [];

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.sendFile('/index.html');
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

  //Login user
  socket.on('login user', function(data, callback) {
    callback(true);
    socket.username = data;
    loggedInUsers.push(socket.username);
    console.log(socket.username + " has logged in");
    changeLoginLayout();
  });
  //Login Guest
  socket.on('login guest', function() {
    socket.username = getNewGuestName();
    loggedInUsers.push(socket.username);
    console.log(socket.username + " is a guest account");
    changeLoginLayout();
  });
  //Is the user logged in already or someone has the same name
  socket.on('islogged in', function(data, callback) {
    var match = false;
    for (var i = 0; i <= loggedInUsers.length; i++) {
      if (loggedInUsers[i] == data) {
        callback(false);
      } else {
        match = true;
      }
    }
    if (match) {
      callback(true);
    }
  });

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
  socket.on('create room', function(typeOfLobby) {
    console.log(typeOfLobby);
  });
  //Creates the lobby for either private or public
  function createLobby(typeOfLobby) {

  }
  //Join the lobby for either private or Public
  function joinLobby(typeOfLobby) {

  }
});