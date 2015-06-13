'use strict';

angular.module('blackboxApp')
  .controller('MainCtrl', [
        '$scope', '$http', '$window', '$timeout', 'polling',
        function ($scope, $http, $window, $timeout, polling) {

            $scope.speed = [];
            $scope.startPolling = false;
            $scope.pollingTimer = null;

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
                    events: {
                        tap: function(data) {
                            $window.alert('icon params = latitude: ' + data.lat + ', longitude: ' + data.lng);
                        }
                    }
                }
            };

            $scope.chartConfig = {
                options: {
                    chart: {
                        type: 'line',
                        zoomType: 'x'
                    }
                },
                series: [{
                    data: []
                }],
                title: {
                    text: 'Vehicle_Speed'
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: { // don't display the dummy year
                        month: '%e. %b',
                        year: '%b'
                    },
                    title: {
                        text: 'Date'
                    }
                },
                loading: true
            };

            $scope.responses = [];


            $scope.pollCoordinates = function() {

            };

            $http.get('json/simulation-1.json').
                success(function(data, status, headers, config) {

                    var series = [];
                    var graphSeries = [];
                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.responses = data.responses;

                    $scope.map.center.lng = $scope.responses[0].GPS_Longitude;
                    $scope.map.center.lat = $scope.responses[0].GPS_Latitude;

                    $scope.marker.coordinates.lng = $scope.responses[0].GPS_Longitude;
                    $scope.marker.coordinates.lat = $scope.responses[0].GPS_Latitude;

                    angular.forEach($scope.responses, function(response) {

//                        angular.forEach(response, function(value, key) {
//
//
//                            if(series[key] == null) {
//                                series[key] = {
//                                    name: key,
//                                    data: []
//                                };
//                            } else {
//                                series[key].data.push(value);
//                            }
//                        });

                        $scope.speed.push([
                            Math.floor(new Date(response.Timestamp) * 1000 ),
                            response.Vehicle_Speed
                        ]);
//                        _.sortBy($scope.speed, function(entry) {
//                            return entry[1];
//                        });
                    });

//                    console.log(series);
//                    angular.forEach(Object.keys(series), function(key) {
//                        console.log(key);
//                        graphSeries.push(series[key]);
//                    });

                    // Remove street view
                    $timeout(function() {
                        angular.forEach($('.H_btn'), function(btn) {
                           if(btn.title == 'Show street level areas'){
                               $(btn).css('display', 'none');
                           }
                        });
                    });


//
//                    console.log(graphSeries);
                    $scope.chartConfig.loading = false;
//                    $scope.chartConfig.series = graphSeries;
                    $scope.chartConfig.series[0].name = 'Vehicle_Speed';
                    $scope.chartConfig.series[0].data = $scope.speed;

                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.error(data);
                });
  }]);
