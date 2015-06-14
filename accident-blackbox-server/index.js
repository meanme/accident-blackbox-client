var app = require('express')();
var vechileData = require('./export.json');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var dataIndex = 0;
setInterval(function(){
		dataIndex++;
		if(dataIndex >= vechileData.length) {
			dataIndex = 0;
		}
	}, 1000);

io.on('connection', function(socket){

	var dataInterval = null;

	dataInterval = setInterval(function(){
		console.log(dataIndex);
		var response = vechileData[dataIndex];
		response.Timestamp = (new Date()).getTime();
    	io.emit('vehicle-data', response);
	}, 1000);

	socket.on('data-loaded', function(msg) {
		io.emit('vechileData', 'hello');
	});

  socket.on('disconnect', function(){
      clearInterval(dataInterval);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
