var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');

loggedInUsers = [];
connections = [];
currentHost = '';

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.sendFile('/index.html');
});

io.sockets.on('connection', function(socket) {
  connections.push(socket);
  console.log(connections.length);

  // Disconnect
  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
  });

  //Login user
  socket.on('login user', function(data, callback) {
    callback(true);
    socket.username = data;
    loggedInUsers.push(socket.username);
    console.log(socket.username);
    changeLoginLayout();
  });

  socket.on('login guest', function() {
    socket.username = getNewGuestName();
    console.log(socket.username);
    changeLoginLayout();
  });

  function getNewGuestName() {
    var users = Moniker.generator([Moniker.adjective]);
    return users.choose();
  }

  function changeLoginLayout() {
    socket.emit("changelogin layout", socket.username);
  }

});