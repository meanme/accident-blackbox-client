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

//    collection.find({}, function(err, data) {
//        console.log('to array');
//        data.toArray(function(err2, data2) {
////            console.log(data2);
////            console.log(err2);
//        });
//    });

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

//    setInterval(function(){
//        dataIndex++;
//        if(dataIndex >= vehicleData.length) {
//            dataIndex = 0;
//        }
//    }, 250);

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

//            var now = null;
//            while(dataIndex < vehicleData.length - 1) {
//                var next = vehicleData[dataIndex + 1];
//
//                now = new Date().getTime();
//                if((now - startTime) > (next.Timetamp - startSequence)) {
//                    dataIndex++;
//                    io.emit('vehicle-data', next);
//                }
//            }

            dataInterval = setInterval(function(){
                dataIndex++;
                if(dataIndex >= vehicleData.length) {
                    clearInterval(dataInterval);
                    dataIndex = 0;
                }
                console.log(dataIndex);
                var response = vehicleData[dataIndex];
//                response.Timestamp = (new Date()).getTime();
                io.emit('vehicle-data', response);
            }, 50);

            var printed = false;

//            var searchTerm = {'Extra_SequenceNumber': {$gt: n}};
//            stream = collection.find({}, { Vehicle_Speed: 1,
//                GPS_Latitude: 1, GPS_Longitude: 1,
//                _id:0, Image_Frame: 0 }).limit(100).stream();
//            stream.on('data', function(s) {
//
//                console.log(s);
//                io.emit('vehicle-data', s);
//
////                if(!printed) {
////                    console.log(s);
////                    printed = true;
////                }
////                for(var i = 0 ; )
////                io.emit('vehicle-data', s);
//            });

//
//            var cursor = collection.find({}, function(err, resultCursor) {
//                function processItem(err, item) {
//                    if(item === null) {
//                        return; // All done!
//                    }
//
//                    io.emit('vehicle-data', item);
//                    console.log(item);
//
//                }
//
//                resultCursor.nextObject(processItem);
//            });


//            io.emit('vehicle-data', 'hello');
        });

        socket.on('disconnect', function(){

            console.log('client disconnected');
            clearInterval(dataInterval);
//            if(stream) {
//                stream.close();
//            }
        });
    });

    http.listen(3000, function(){
        console.log('listening on *:3000');
    });

});
