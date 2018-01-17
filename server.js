var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');
var defaultLobbySize = 5;

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

  socket.on('log out', function(data){
    //if you logout you remove yourself from users list but remain a connection
    console.log(socket.username + " logged out!");
    loggedInUsers.splice(loggedInUsers.indexOf(socket.username),1);
    socket.emit("revert login",socket.username);
    leaveRoom(socket.myRoomID);
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
    console.log("play!");
    getNewOrOpenLobbyID();
    console.log("Room Count:"+rooms.length);
    for (var i = 0; i < rooms.length; i++) {
      console.log("----------");
      console.log("Room ID  :"+rooms[i].roomID);
      console.log("Player # :"+rooms[i].players.length+"/"+rooms[i].maxPlayers);
      console.log("Room Type:"+rooms[i].type);
      console.log("----------");
    }
  });

  socket.on('join custom', function(data) {
    joinRoom(data);
  });

  socket.on('create custom', function(data) {
    var id =createRoom("private",defaultLobbySize);
    joinRoom(id);

  });

  //gets a new or open lobby ID
  function getNewOrOpenLobbyID() {
    //if there are no rooms, (we can add validation for private and public)
  if(!isEmpty(rooms))
  {
    //for each room
      for (var i = 0; i < rooms.length; i++) {
        //if room is Public
        if(rooms[i].type == "public"){
          //check if lobby is not full
          if(rooms[i].players.length != rooms[i].maxPlayers)
          {//join the room
            joinRoom(rooms[i].roomID);
          }else{ //if all public rooms are full, create one
            if(rooms.indexOf(rooms[i]) == (rooms.length -1))
            {
              var id = createRoom("public",defaultLobbySize);
              joinRoom(id);
            }
          }


        }else{ //private
          //if its the last
          if(rooms.indexOf(rooms[i]) == (rooms.length -1))
          {
            var id = createRoom("public",defaultLobbySize);
            console.log("Joining room.");
            joinRoom(id);
          }
        }
      }
    }
    //if no lobbies currently exist - Make one.
    else{//and join it
      console.log("Creating room");
      //public rooms are max players ten
      var id = createRoom("public",defaultLobbySize);
      console.log("Joining room.");
      joinRoom(id);


    }
  }


  function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


//function for removing your name from your room using roomID
function leaveRoom(roomID){
  //for every room
  for (var i = 0; i < rooms.length; i++) {
    //if you've found the room in question
    if(rooms[i].roomID == roomID)
    {
      var oldlist = rooms[i].players;
      //remove from room
      console.log(socket.username+"has left the room");
      var newlist = oldlist.splice(oldlist.indexOf(socket.username), 1);
      rooms[i].players = newlist;
    }
}
}

function joinRoom(roomID){
  var roomFound = false;
  for (var i = 0; i < rooms.length; i++) {
    if(rooms[i].roomID == roomID && (!rooms[i].players.includes(socket.username) || !rooms[i-1].players.includes(socket.username))){
      //if room as been found
      rooms[i].players.push(socket.username);
      socket.myRoomID = [roomID]
      console.log(socket.username+" has joined room "+roomID);
      console.log(rooms[i].roomID+" has "+rooms[i].players.length+" players in the room");
      roomFound = true;
    }
  }
  if(!roomFound)
    console.log("Room "+roomID+" does not exist!");
    // this.emit('join game',url);
}

  //creates a room and generates an id for you
  function createRoom(lobbyType,maxPlayers){
				//generate random 6 digit roomID
				var generatedRoomID = Math.floor(100000 + Math.random() * 900000);
				var newRoom = {};
				newRoom.roomID = generatedRoomID;
				newRoom.players = [];
        //public or private
        newRoom.type = lobbyType;
        newRoom.maxPlayers = maxPlayers;
        //adds the new room to the rooms list
				rooms.push(newRoom);
				console.log("Room: "+generatedRoomID+" created!");
				console.log("Rooms: "+rooms);
        //returns the id
        return generatedRoomID;
		}
  //Join the lobby for either private or Public
  function joinLobby(typeOfLobby) {

  }
});
