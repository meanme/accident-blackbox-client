var app = require('express')();
var vehicleData = require('./export.json');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;

var stream = require('stream');
var sleep = require('sleep');
var Transform = stream.Transform;

mongo.connect('mongodb://admin:admin@ds047812.mongolab.com:47812/mercedezhackathon', function(err, db) {
    var collection = db.collection('vehicle_data');

    app.get('/', function(req, res){
        res.sendFile(__dirname + '/index.html');
    });

    app.post('/accident', function(req, res) {
        console.log("ACCIDENT DETECTED");
        res.send('OK');
    });

    app.get('/vehicle', function(req, res){
        var n = req.query.seq || 0 ;
        n = parseInt(n);

        var searchTerm = {'Extra_SequenceNumber': {$gt: n}};
        var stream = collection.find({'Extra_SequenceNumber' : {$gt : n}},{'Image_Frame' : 0}).limit(1).stream();
        stream.on('data', function(s) {
            res.send(s);
        });
    });

    io.on('connection', function(socket){

        var dataIndex = 0;
        var startTime = new Date().getTime();
        var startSequence = vehicleData[0].Timestamp;

        var offset = startTime - startSequence;
        var dataInterval = null;
        var stream = null;

        socket.on('change-frame', function(index) {
            console.log(index);
            dataIndex = index.frame;

        });

        socket.on('data-loaded', function(msg) {
            dataIndex = 0;

            dataInterval = setInterval(function(){
                dataIndex++;
                if(dataIndex >= vehicleData.length) {
                    clearInterval(dataInterval);
                    dataIndex = 0;
                } else {
                    console.log(dataIndex);
                    var response = vehicleData[dataIndex];
                    io.emit('vehicle-data', response);
                }

            }, 50);
        });

        socket.on('disconnect', function(){

            console.log('client disconnected');
            clearInterval(dataInterval);
        });
    });

    http.listen(3000, function(){
        console.log('listening on *:3000');
    });

});
