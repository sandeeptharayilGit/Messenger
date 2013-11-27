var app = require('express')(),
 server = require('http').createServer(app),
 sqlite3 = require('sqlite3').verbose(),
 io = require('socket.io').listen(server),
 db = new sqlite3.Database(':memory:');
 
 server.listen(2000);
 var users= new Array();
 var offlineData= new Array();
 var clients = {};
 var sq_log = "sqLite : "
 var socket_log = "Socket : "


  
  var offQuery="SELECT rowid AS id, toUser ,fromUser ,message ,date FROM OfflineData where toUser=?",
	  onQuery="SELECT rowid AS id, toUser ,fromUser ,message ,date FROM OnlineData where toUser=? or fromUser=? order by date asc limit 0,10";
 


var isDBConnected=false;

db.serialize(function() {
	console.log(sq_log+'started');	
	isDBConnected=true;
  db.run("CREATE TABLE OfflineData (toUser String,fromUser String,message String,date Date)");
   db.run("CREATE TABLE OnlineData (toUser String,fromUser String,message String,date Date)");
});

  var Offstmt = db.prepare("INSERT INTO OfflineData VALUES (?,?,?,?)");
   var Onstmt = db.prepare("INSERT INTO OnlineData VALUES (?,?,?,?)");

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
	
		
			console.log(sq_log+' isDBConnected='+isDBConnected);	
		if (clients[data.to]){
			 io.sockets.socket(clients[data.to].socket).emit(data.to.toLowerCase(), [{message:data.message,from:data.from}]);

			 if(isDBConnected){
			 console.log(sq_log+' pushing data to OnlineData');	
			  Onstmt.run(data.to,data.from,data.message,Date.now(),function(err){console.log(sq_log+' succesfully pushed data to OnlineData');	});
			//  Onstmt.finalize();
			}
		  
		} else{
			console.log(socket_log+'User '+data.to+' is not logged in');

			if(isDBConnected){
			console.log(sq_log+' pushing data to OfflineData');	
			  Offstmt.run(data.to,data.from,data.message,Date.now(),function(err){console.log(sq_log+' succesfully pushed data to OnlineData');	});
			 // Offstmt.finalize();
			}else{
			
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
		
		}
	});
	socket.on('user:add', function(data) {
	
		if(users.indexOf(data.userName)<0){
			users.push(data.userName);
		}
		clients[data.userName] = {
		  "socket": socket.id
		};
		
		console.log(socket_log+data.userName +" logged in");
		//console.log(socket_log+"Logged in users Count: "+ users.length);
		socket.emit(data.userName,[{ message:'Welcome to myMessenger',from:''}]);
		
		
		var messageArr=[];
		
		sendMessagesFromDB=function(err, rows){
		console.log(sq_log+'==========rows==============');	
			console.dir(rows );
		console.log(sq_log+'==========rows==============');	
			var index,row;
			for( index in rows){
			row=rows[index];
			console.log(sq_log+'==========Single row==============');	
			console.dir(row );
			console.log(sq_log+'==========Single row==============');	
				messageArr.push({from:row.fromUser,message:row.message})
				console.log(sq_log+row.id + ": " + row.toUser+", "+row.fromUser + ", " +row.message +", "+ row.date );
				}
				console.log(sq_log+'==========final msg==============');	
				console.dir(messageArr );
				console.log(sq_log+'==========final msg==============');	
			socket.emit(data.userName.toLowerCase(), messageArr);
		}
		
		if(isDBConnected){
			console.log(sq_log+'fetching OfflineData using '+offQuery+" for "+data.userName);	
			db.all(offQuery,data.userName, sendMessagesFromDB);
			
			console.log(sq_log+'fetching OfflineData using '+onQuery+" for "+data.userName);	
			db.all(onQuery,data.userName,data.userName, sendMessagesFromDB);
			
		}else{
			
			
			if(offlineData[data.userName] !=undefined){
				//console.log(socket_log+"before splicing "+offlineData[data.userName]+" from index: "+offlineData.indexOf(data.userName));
				socket.emit(data.userName.toLowerCase(), offlineData.splice(offlineData.indexOf(data.userName),1)[0]);
				//console.log(socket_log+"after splicing "+offlineData[data.userName]);
			}
		}
		socket.broadcast.emit('newUser', users);
		socket.emit('newUser', users);
		
	});
});