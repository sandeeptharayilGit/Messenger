var app = require('express')(),
 server = require('http').createServer(app),
 io = require('socket.io').listen(server);
 server.listen(2000);
 var users= new Array();
 var offlineData= new Array();
 
app.get('/myMessenger', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/app.js', function(req, res) {
	res.sendfile(__dirname + '/app.js');
});
io.sockets.on('connection', function (socket) {
	console.log('started')
	
	socket.on('broadcast:msg', function(data) {
	console.log("Message from: "+data.from+", to: "+data.to+", message:"+data.message);
	console.log(users);
		if(users.indexOf(data.to)>=0){
			socket.broadcast.emit(data.to, [{message:data.message,from:data.from}]);
		}else{
		console.log('User '+data.to+' is not logged in');
		
			var offdata= new Array();
			if(offlineData[data.to] ==undefined){
			console.log('offlineData[data.to]='+offlineData[data.to]);
				offdata.push({from:data.from,message:data.message});
				offlineData[data.to]=offdata;
			}else {
			console.log('offlineData[data.to]='+offlineData[data.to]);
				offdata=offlineData[data.to];
				if(offdata!=undefined){
					offdata.push({from:data.from,message:data.message});
					offlineData[data.to]=offdata
				}
				console.log('offlineData[data.to]='+offlineData[data.to]);
			}
		}
	});
	socket.on('user:add', function(data) {
	
		if(users.indexOf(data.userName)<0){
			users.push(data.userName);
		}
		console.log(data.userName +" logged in");
		console.log("Logged in users Count: "+ users.length);
		
		// Tell all the other clients (except self) about the new message
		socket.emit(data.userName,[{ message:'Welcome to WhiteBoard',from:''}]);
		if(offlineData[data.userName] !=undefined){
			console.log("before splicing "+offlineData[data.userName]+" from index: "+offlineData.indexOf(data.userName));
			socket.emit(data.userName, offlineData.splice(offlineData.indexOf(data.userName),1)[0]);
			console.log("after splicing "+offlineData[data.userName]);
		}
	});
});