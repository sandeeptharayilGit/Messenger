var app = require('express')(),
 server = require('http').createServer(app),
 io = require('socket.io').listen(server);
 server.listen(2000);
 var users= new Array();
 var offlineData= new Array();
 var clients = {};
 var mongoose = require('mongoose');
 var mongo_log = "MongoDB : "
  var socket_log = "MongoDB : "
 var mongoose = require('mongoose');
 var OfflineData=null,OnlineData=null;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error in connecting to mongolab'));
db.once('open', function() {
console.log(mongo_log+" DB connected");
	 var messageSchema = new mongoose.Schema({
		to: String,
		from: String,
		message:String,
		date: Date
	});
	messageSchema.methods.speak = function () {
	  var str = "@from="+this.from
				+"@to="+this.to
				+"@message"+this.message
				+"@time"+this.date;
	  console.log(mongo_log+str);
	}
	messageSchema.statics.getMessages = function(user,callback) {
		return this.find({ to: user }, callback);
	};

	OfflineData=mongoose.model('OFFLINE_DB', messageSchema);
	OnlineData=mongoose.model('ONLINE_DB', messageSchema);
	

});

mongoose.connect('mongodb://deegouser:deegouser@ds053708.mongolab.com:53708/deego');
 
 
app.get('/myMessenger', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/app.js', function(req, res) {
	res.sendfile(__dirname + '/app.js');
});
io.sockets.on('connection', function (socket) {
	console.log(socket_log+'started')
	
	socket.on('broadcast:msg', function(data) {
	
	console.log(socket_log+"Message from: "+data.from+", to: "+data.to+", message:"+data.message);
	//console.log(socket_log+users);
		// if(users.indexOf(data.to)>=0){
			// socket.broadcast.emit(data.to.toLowerCase(), [{message:data.message,from:data.from}]);
		// }
		var messageData = {
		  to: data.to
		, from: data.from
		, message: data.message
		, date: Date.now()
		};
		
		
		if (clients[data.to]){
		  io.sockets.socket(clients[data.to].socket).emit(data.to.toLowerCase(), [{message:data.message,from:data.from}]);
		  
		  var onlineData= new OnlineData(messageData);
		  onlineData.save(function(err, onlineData) {
			  if (err) return console.error(err);
			  console.dir(mongo_log+onlineData);
			});
		  
		} else{
		console.log(socket_log+'User '+data.to+' is not logged in');
		
		var offlineDBData= new OfflineData(offlineDBData);
		  offlineDBData.save(function(err, offlineDBData) {
			  if (err) return console.error(err);
			  console.dir(offlineDBData);
			});
			
			var offdata= new Array();
			if(offlineData[data.to] ==undefined){
				console.log(socket_log+'offlineData[data.to]='+offlineData[data.to]);
				offdata.push({from:data.from,message:data.message});
				offlineData[data.to]=offdata;
			}else {
			console.log(socket_log+'offlineData[data.to]='+offlineData[data.to]);
				offdata=offlineData[data.to];
				if(offdata!=undefined){
					offdata.push({from:data.from,message:data.message});
					offlineData[data.to]=offdata
				}
				console.log(socket_log+'offlineData[data.to]='+offlineData[data.to]);
			}
		}
	});
	socket.on('user:add', function(data) {
	
		if(users.indexOf(data.userName)<0){
			users.push(data.userName);
		}
		clients[data.username] = {
		  "socket": socket.id
		};
		
		console.log(socket_log+data.userName +" logged in");
		console.log(socket_log+"Logged in users Count: "+ users.length);
		socket.emit(data.userName,[{ message:'Welcome to myMessenger',from:''}]);
		if(offlineData[data.userName] !=undefined){
			console.log(socket_log+"before splicing "+offlineData[data.userName]+" from index: "+offlineData.indexOf(data.userName));
			socket.emit(data.userName.toLowerCase(), offlineData.splice(offlineData.indexOf(data.userName),1)[0]);
			console.log(socket_log+"after splicing "+offlineData[data.userName]);
		}
		socket.broadcast.emit('newUser', users);
		socket.emit('newUser', users);
		
	});
});