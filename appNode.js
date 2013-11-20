var app = require('express')(),
 server = require('http').createServer(app),
 io = require('socket.io').listen(server);
 server.listen(2000);
 
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/app.js', function(req, res) {
	res.sendfile(__dirname + '/app.js');
});
io.sockets.on('connection', function (socket) {
console.log('started')
	socket.emit('new:msg', 'Welcome to AnonBoard');
	socket.on('broadcast:msg', function(data) {
	console.log(data.message);
		// Tell all the other clients (except self) about the new message
		socket.broadcast.emit('new:msg', data.message);
	});
});