'use strict';

angular.module('blackboxApp')
  .controller('MainCtrl', [
        '$scope', '$http', '$window', '$timeout', 'polling',
        function ($scope, $http, $window, $timeout, polling) {

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

            Highcharts.setOptions({
                global: {
                    useUTC: false
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
                            setInterval(function () {
                                var x = (new Date()).getTime(), // current time
                                    y = Math.random();
                                series.addPoint([x, y], true, true);
                            }, 1000);
                        }
                    }
                },
                title: {
                    text: ''
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150
                },
                yAxis: {
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
                    name: 'Random data',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -19; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                }]
            });

            $scope.responses = [];

            $scope.pollCoordinates = function(response) {
//                console.log(response.Vehicle_Speed);

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
                    console.log('data loaded');

                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.responses = data;

                    $scope.map.center.lng = $scope.responses[0].GPS_Longitude;
                    $scope.map.center.lat = $scope.responses[0].GPS_Latitude;

                    $scope.marker.coordinates.lng = $scope.responses[0].GPS_Longitude;
                    $scope.marker.coordinates.lat = $scope.responses[0].GPS_Latitude;

//                    polling.startPolling('vehicle', 'http://172.31.99.2/vehicle', 1000, $scope.pollCoordinates);

//                    angular.forEach($scope.responses, function(response) {
//
//                        $scope.speed.push([
//                            Math.floor(new Date(response.Timestamp) * 1000 ),
//                            response.Vehicle_Speed
//                        ]);
//                    });

                    //$scope.updateTicker();

                    // Remove street view
                    $timeout(function() {
                        angular.forEach($('.H_btn'), function(btn) {
                           if(btn.title == 'Show street level areas'){
                               $(btn).css('display', 'none');
                           }
                        });
                    });

//                    $scope.chartConfig.series[0].showInLegend = false;
//                    $scope.chartConfig.series[0].name = 'Vehicle_Speed';
////                    $scope.chartConfig.series[0].data = $scope.speed;
//                    $scope.chartConfig.series[0].data = [];

                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.error(data);
                });
  }]);
