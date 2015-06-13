'use strict';

angular.module('blackboxApp')
  .controller('MainCtrl', [
        '$scope', '$http', '$window', '$timeout', 'polling',
        '$socket',
        function ($scope, $http, $window, $timeout, polling, $socket) {

//            $socket.on('vehicle-data', function(data) {
//            });

            $scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            $scope.speed = [];
            $scope.startPolling = false;
            $scope.pollingTimer = null;

            $scope.dataLoaded = false;

            $scope.map = {
                zoom : 14,
                center : {
                    lng: 0,
                    lat: 0
                }
            };
            $scope.marker = {
                coordinates : {
                    lng: -0.14,
                    lat: 51.513872
                },
                icon: {
                    template: '<img class="marker-icon" src="images/marker.png">',
                    events: {
                        tap: function(data) {
                            $window.alert('icon params = latitude: ' + data.lat + ', longitude: ' + data.lng);
                        }
                    }
                }
            };
//
            Highcharts.setOptions({
                global : {
                    useUTC : false
                }
            });


            $('#container').highcharts({
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg, // don't animate in old IE
                    backgroundColor: null,
                    borderWidth: 1,
                    zoomType: 'x',

                    events: {
                        load: function () {

                            // set up the updating of the chart each second
                            var series = this.series[0];

                            // Register sockets
//                            setInterval(function () {
//                                var x = (new Date()).getTime(), // current time
//                                    y = Math.random();
//                                series.addPoint([x, y], true, true);
//                            }, 1000);

                            $socket.on('vehicle-data', function(data) {
                                if(data.Vehicle_Speed == 0) {return;}

                                series.addPoint([
                                    Math.floor(data.Timestamp / 1000) * 1000,
                                    data.Vehicle_Speed
                                ], true, true);


                                    $scope.map.center.lng = data.GPS_Longitude;
                                    $scope.map.center.lat = data.GPS_Latitude;

                                    $scope.marker.coordinates.lng = data.GPS_Longitude;
                                    $scope.marker.coordinates.lat = data.GPS_Latitude;

                                $scope.safeApply();

                            })
                        }
                    }
                },
                title: {
                    text: ''
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: {
                    min: 0,
                    max: 200,
                    title: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: '',
                    //data: null
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = 0; i <= 5; i ++) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random() * 120
                            });
                        }
                        return data;
                    }())
                }]
            });

            $scope.responses = [];

            $scope.pollCoordinates = function(response) {

                $scope.map.center.lng = response.GPS_Longitude;
                $scope.map.center.lat = response.GPS_Latitude;

                $scope.marker.coordinates.lng = response.GPS_Longitude;
                $scope.marker.coordinates.lat = response.GPS_Latitude;

                $scope.chartConfig.series[0].data.push(
                    Math.floor(new Date(response.Timestamp) ),
                    response.Vehicle_Speed
                );
            };

            $scope.tickerIndex = 0;
            $scope.updateTicker = function() {
                if($scope.tickerIndex < $scope.responses.length) {
                    // Process the next ticker
                    $scope.pollCoordinates($scope.responses[$scope.tickerIndex++]);

                    $timeout($scope.updateTicker, 1000);
                }
            };

            $http.get('json/export1.json').
                success(function(data, status, headers, config) {

                    $scope.dataLoaded = true;

                    $socket.emit('data-loaded');

                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.responses = data;

//                    $scope.map.center.lng = $scope.responses[0].GPS_Longitude;
//                    $scope.map.center.lat = $scope.responses[0].GPS_Latitude;
//
//                    $scope.marker.coordinates.lng = $scope.responses[0].GPS_Longitude;
//                    $scope.marker.coordinates.lat = $scope.responses[0].GPS_Latitude;

                    // Remove street view
                    $timeout(function() {
                        angular.forEach($('.H_btn'), function(btn) {
                           if(btn.title == 'Show street level areas'){
                               $(btn).css('display', 'none');
                           }
                        });
                    });
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.error(data);
                });
  }]);
