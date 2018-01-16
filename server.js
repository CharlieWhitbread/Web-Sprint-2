var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Moniker = require('moniker');
var io = require('socket.io').listen(server);
var $ = require('jquery');



users = [];
connections = [];
currentHost = '';

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use(express.static(__dirname));

app.get('/',function(req, res){
	res.sendFile('/index.html');
});

io.sockets.on('connection',function(socket){
	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);
	console.log('Users: %s users logged in', users.length);
	console.log(users);
	io.sockets.emit('lobby users', users);

	// Disconnect
	socket.on('disconnect',function(data){
		io.sockets.emit('player leave', socket.username);
		if(currentHost == socket.username){
			io.sockets.emit('new host',users[1]);
		}
		users.splice(users.indexOf(socket.username), 1);
		console.log('Disconnected %s sockets connected', connections.length);
		io.sockets.emit('lobby users', users);

		//If the current host leaves
		assignHost(socket.username);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);
	});

  // Send Messege
	socket.on('send message', function(data){
		io.sockets.emit('new message',{msg:data,user:socket.username});
	});

	socket.on('ready', function(){
		console.log("Host has started the game");
		io.sockets.emit('start game');
		distributeWords();
	});

	socket.on('kick user', function(user){
		console.log("Host has kicked "+user);
		io.sockets.emit('remove user',user);
	});


	function distributeWords(){
		for (var i = 0; i < connections.length; i++) {
			var word = getWord();
			// io.sockets.connected[connections[i]].emit('get word", word);
		}

		// users.forEach(function(item){
		// 	var word = getWord();
		// 	console.log(item+'s given word is '+word);
		// 	io.sockets.emit('get word',word);
		// });
	}

	function getWord(){
		var names = Moniker.generator([Moniker.adjective, Moniker.noun]);
		return names.choose();
	}

	function getGuestName(){
		var users = Moniker.generator([Moniker.adjective]);
		return users.choose();
	}

	//New User
	socket.on('new user',function(data, callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		io.sockets.emit('lobby users', users);
		assignHost(data);
		updateUsernames();
		io.sockets.emit('player join',socket.username)
	});

	socket.on('new guest',function(){
		var generatedName = getGuestName();
		socket.username = generatedName;
		users.push(socket.username);
		io.sockets.emit('lobby users', users);
		assignHost(socket.username);
		updateUsernames();
		io.sockets.emit('player join',socket.username)
	});

	function updateUsernames(){
		io.sockets.emit('get users', users);
	}


	function assignHost(connectedUser){
		currentHost = users[0]
		console.log("Lobby Host is "+currentHost);
		if(currentHost == connectedUser)
		{
			//run when you are host
			console.log("Host Change.")
			io.sockets.emit('get host',users);
		}
	}
		//if last person in lobby OR lobby leader leaves
});
