var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:',sqlite3.OPEN_READWRITE,function(err){
if(err)
	console.error.bind(console, 'Error in connecting to sqlite')
});

db.serialize(function() {
 db.run("CREATE TABLE OfflineData (toUser String,fromUser String,message String,date Date)");

  var stmt = db.prepare("INSERT INTO OfflineData VALUES (?,?,?,?)");
  for (var i = 0; i < 100; i++) {
      stmt.run("Sans","Me","Ipsum " + i,Date.now());
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, toUser ,fromUser ,message ,date FROM OfflineData ", function(err, row) {
      console.log(row.id + ": " + row.toUser+", "+row.fromUser + ", " +row.message +", "+ row.date );
  });
});

db.close();