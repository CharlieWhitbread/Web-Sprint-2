var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

class Lobby {
  constructor(roomId, players, type, maxPlayers) {
    this.roomId = roomId;
    this.players = players;
    this.maxPlayers = maxPlayers;
    this.type = type;
    this.inGame = false;
    this.rounds = [];
    //guesses need to be added here
    this.images = [];
  }
}


class gameRound{
    constructor(roundNumber,listOfGoes) {
      this.roundNumber = roundNumber;
      this.listOfGoes = listOfGoes;
    }
}

class userPair{
    constructor(player1, player2) {
      this.player1 = player1;
      this.player2 = player2;
    }
}

defaultLobbyMax = 5;
lobbies = [];
loggedInUsers = [];
connections = [];
//namespace for lobbies
const games = io.of('/games');
server.listen(process.env.PORT || 3000);
console.log('Server running...');
app.use(express.static(__dirname));




//mongoDB
//mongoDB connection to database
mongoose.connect('mongodb://localhost:27017/Depiction')
//schema for the users
var usersSchema = mongoose.Schema({
  _id: String,
  pass: String
});
//new model for the users
var Users = mongoose.model('users', usersSchema);
//testing the hash to make sure it works
// bcrypt.compare('myPassword','$2a$10$kiGtCVAMZgX8eKiyFUKJpO0SIfLaEdwXOPQQDpK9B/buxP4m2wvwG',function(err, res) {
//   if(res) {
//     console.log("password match");
//   } else {
//     console.log("incorrect password");
//   }
// });


app.get('/users', (req, res) =>{
  // mongoose.model('users').findOne({"_id":"test"}, function(err,user){
    mongoose.model('users').find({}, function(err,user){
    res.send(user);
    // res.send(user.pass);
  });
});

function getUserPropertyFromDatabase(username, info){
  var test = mongoose.model('users').findOne({"_id":username}, function(err,user){

    return user;
  });

}



//Normal code

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
  socket.on('register user', (username, password) => {
    bcrypt.hash(password, 10, function(err, hash) {
      var user = new Users({_id: jsUcfirst(username), pass: hash});
      user.save();
    });
  });
  socket.on('log out', (data) => {
    //if you logout you remove yourself from users list but remain a connection
    loggedInUsers.splice(loggedInUsers.indexOf(socket.username), 1);
    socket.emit("revert login", socket.username);
  });
  //Login user
  socket.on('login user', (data, callback) => {
    callback(true);
    data = jsUcfirst(data);
    socket.username = data;
    //Changes to uppercade and assigns to socket.username
    // check if user is in the database
    // if user is in the database grab hash and check against the password
    // if correct push user and change layout
    // else console log
    loggedInUsers.push(data);
    console.log(loggedInUsers);
    changeLoginLayout("user");
  });
  //Login Guest
  socket.on('login guest', () => {
    socket.username = jsUcfirst(getNewGuestName());
    loggedInUsers.push(socket.username);
    changeLoginLayout("guest");
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

  //Create guest name
  function getNewGuestName() {
    var users = Moniker.generator([Moniker.adjective]);
    return users.choose();
  }
  //Changes the login layout to show the user and stats
  function changeLoginLayout(type) {
    socket.emit("changelogin layout", socket.username, type);
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

//Changes first charecter uppercase gGj -> Ggj
function jsUcfirst(string) {
  var lowcasestring = string.toLowerCase();
  return lowcasestring.charAt(0).toUpperCase() + lowcasestring.slice(1);
}
/////////////////
// Game System //
/////////////////
games.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(data.room);
    socket.username = data.user;
    loggedInUsers.push(socket.username);
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

  socket.on('countdown message', (data) => {
    socket.emit('newingame message',{
      msg: "Round begins in "+data+"...",
      user: "Announcer"
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
    var rounds;
    for (var i = 0; i < lobbies.length; i++) {
      if (lobbies[i].roomId == socket.myRoomID) {
        //gets randomised rounds
        var rounds = generateRounds(lobbies[i].players)
        lobbies[i].inGame = true;
        socket.numberOfRounds = (lobbies[i].players.length-1)
      }
    }
    games.in(socket.myRoomID).emit('start game');
    initiateRounds(rounds);
  });

//gives a starting word
  socket.on('request word', () =>{
    var dic = Moniker.read("gamewords.txt");
    var item = dic.words[Math.floor(Math.random()*dic.words.length)];
    socket.emit('receive word',jsUcfirst(item));
  });

  socket.on('next round', (data) =>{
    socket.emit('goto round', getRoundFromRounds(data+1,getLobbyByID(socket.myRoomID).rounds));
});

  //user to randomise the order of players
  function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}


  // test function to make sure the rounds are generating properly
  function initiateRounds(rounds)
  {
    //get my lobby
    //update the rounds

    //for each lobby
    for (var i = 0; i < lobbies.length; i++) {
      if(lobbies[i].roomId == socket.myRoomID)
      {
        //set the rounds
        lobbies[i].rounds = rounds
      }
      {

    for (var i = 1; i <= socket.numberOfRounds; i++) {
      //for each go in each round
      var round = getRoundFromRounds(i,rounds)
      for (var j = 0; j < round.listOfGoes.length; j++) {
      }

    }

    games.in(socket.myRoomID).emit('goto round',getRoundFromRounds(1,rounds));
    console.log(getRoundFromRounds(1,rounds));
    //   //passes in the round number,the goes fo
    //   setTimeout(() => { games.in(socket.myRoomID).emit('new round',rounds.indexOf(rounds[i])+1,rounds[i]); }, 3000*(i+1));
    //
    //   // games.in(socket.myRoomID).emit('new round',rounds[i]);
    // }
  }
}
}


  function getRoundFromRounds(roundNumber,rounds)
  {
    var listOfGoes =[];
    //for each person
    for (var i = 0; i < rounds.length; i++) {
      //extract the data and add to lists
      if(rounds[i].roundNumber == roundNumber)
      {
        listOfGoes.push(rounds[i].pair);
      }
    }
     return new gameRound(roundNumber,listOfGoes);
  }

// get a specific list of pairs from a given round
  //gets list of rounds from a list of users
  function generateRounds(originList){
    var data = shuffle(originList)
    var appendedList = data.concat(data);
    //form
    var roundList = [];
    //for each player
    for (var i = 0; i < data.length; i++) {
      //for each player loop again through the players pairing users together
      for (var j = 0; j < (data.length -1); j++) {
        //gets currentIndex
        var myIndex = data.indexOf(data[i])+1;
        //matching
        var pair = new userPair(data[i],appendedList[j+myIndex]);
        //add it to the array of moves for the player
        var roundnum = j+1
        var test = {roundNumber:roundnum,pair:pair}
        roundList.push(test);
      }
    }
    return roundList;
  }

socket.on('save image', (data) => {
  for (var i = 0; i < lobbies.length ; i++) {
    if(lobbies[i].roomId == socket.myRoomID){
      lobbies[i].images.push(data);
    }
  }
});

socket.on('getimage forplayer', (data) =>{
var imageUrl = getImageFromRoundNumber(data);
socket.emit('receive image',imageUrl);
});


//data is new gameImage
socket.on('save guess', (data) =>{
//for each lobby
for (var i = 0; i < lobbies.length; i++) {
  if(lobbies[i].roomId == socket.myRoomID){
    //get old images list
    var oldimages = lobbies[i].images;
    console.log(oldimages);
    var newimages = addGuessToImage(data, oldimages);
    console.log(lobbies[i].images);
    lobbies[i].images = newimages;
    console.log(lobbies[i].images);
  }
}
});


//ovewrite lobbies[i].images with new gameImage .guess
function addGuessToImage(gameImage, images){
  for (var i = 0; i < images.length; i++) {
    if (images[i].roundNumber == gameImage.roundNumber && images[i].imageUrl == gameImage.imageUrl){
      //if found the old gameImage Edit it
      images[i].guess = gameImage.guess;
      return images;
    }
  }
}

function getImageFromRoundNumber(data){
var lobbyObj = getLobbyByID(socket.myRoomID);
var roundObj = getRoundFromRounds(data, lobbyObj.rounds);
var drawingToGuessPlayer = getImageByAuthor(roundObj.listOfGoes);
var imageUrl = getImageForPlayer(drawingToGuessPlayer, lobbyObj.images, data);
return imageUrl;
}

function getImageByAuthor(data){
for (var i = 0; i < data.length; i++) {
  if(data[i].player2 == socket.username){
    return data[i].player1;
  }
}
}

function getImageForPlayer(playerToSearch, images, roundNumber){
  for (var i = 0; i < images.length; i++) {
    if(images[i].roundNumber == roundNumber){
      if(images[i].author == playerToSearch){
        return images[i].imageUrl;
      }
    }
  }
}



socket.on('get sequences', ()=>{
var mylobby = getLobbyByID(socket.myRoomID);
var gameimages = mylobby.images
var numberOfRounds = mylobby.players.length-1;
var roundNumber = 0;
//for each sequence
// for (var i = 1; i <= numberOfRounds+1; i++){
//   var sequence = [];
//   var round = getRoundFromRounds(roundNumber,mylobby.rounds)
//   //for each go
//   for (var i = 0; i < round.listOfGoes; i++) {
//
//     if(round.listOfGoes[i].player1 == socket.myUsername)
//     {
//
//
//     }
// }
// }

var sequence = [gameimages[0]];
socket.emit('receive sequence',sequence);
//find image where round number == 1 and author is me
//ad to image to array and find the pair based on author name
//goto next round and find image where author is pair
//repeat
});
});
