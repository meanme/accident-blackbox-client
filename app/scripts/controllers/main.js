'use strict';

angular.module('blackboxApp')
  .controller('MainCtrl', [
        '$scope', '$http', '$window', '$timeout', 'polling',
        '$socket',
        function ($scope, $http, $window, $timeout, polling, $socket) {

//            $socket.on('vehicle-data', function(data) {
//            });

            var bearsMarker = null;

            $scope.map = null;
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

            /*$scope.map = {
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
            };*/
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
//                                if(data.Vehicle_Speed == 0) {return;}

                                series.addPoint([
                                    Math.floor(data.Timestamp / 1000) * 1000,
                                    data.Vehicle_Speed
                                ], true, true);


                                $scope.map.setCenter({
                                    lat: data.GPS_Latitude,
                                    lng: data.GPS_Longitude
                                });

                                bearsMarker.setPosition({
                                    lat: data.GPS_Latitude,
                                    lng: data.GPS_Longitude
                                });

//                                    $scope.map.center.lng = data.GPS_Longitude;
//                                    $scope.map.center.lat = data.GPS_Latitude;
//
//                                    $scope.marker.coordinates.lng = data.GPS_Longitude;
//                                    $scope.marker.coordinates.lat = data.GPS_Latitude;

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
                                y: Math.random() * 20 + 120
                            });
                        }
                        return data;
                    }())
                }]
            });

            $scope.responses = [];

            $http.get('json/export1.json').
                success(function(data, status, headers, config) {

                    $scope.dataLoaded = true;
                    initializeMap();

                    $socket.emit('data-loaded');

                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.responses = data;

//                    console.log($scope.map);
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
                }
            );

            function initializeMap() {
                $timeout(function() {

                    var platform = new H.service.Platform({
                        app_id: 'evalLunne37Ciwejfare7',
                        app_code: 'RrEcE54Hc6U2VGp70LqoQQ',
                        useCIT: true,
                        useHTTPS: true
                    });
                    var defaultLayers = platform.createDefaultLayers();

                    $scope.map = new H.Map(document.getElementById('map'),
                        defaultLayers.normal.map);

                    $scope.map.setZoom(13);

                    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents($scope.map));

                    // Create the default UI components
                    var ui = H.ui.UI.createDefault($scope.map, defaultLayers);

                    addDomMarker($scope.map);

                }); // End of timeout
            }

            function addDomMarker(map) {

                var outerElement = document.createElement('div'),
                    innerElement = document.createElement('div');

                outerElement.style.userSelect = 'none';
                outerElement.style.webkitUserSelect = 'none';
                outerElement.style.msUserSelect = 'none';
                outerElement.style.mozUserSelect = 'none';
                outerElement.style.cursor = 'default';

                innerElement.style.color = 'red';
                innerElement.style.borderRadius = '50%';
                innerElement.style.backgroundColor = 'blue';
                innerElement.style.border = '2px solid black';
                innerElement.style.font = 'normal 12px arial';
                innerElement.style.lineHeight = '12px';

                innerElement.style.paddingTop = '2px';
                innerElement.style.paddingLeft = '4px';
                innerElement.style.width = '20px';
                innerElement.style.height = '20px';

                // add negative margin to inner element
                // to move the anchor to center of the div
                innerElement.style.marginTop = '-10px';
                innerElement.style.marginLeft = '-10px';

                outerElement.appendChild(innerElement);

                // Add text to the DOM element
                innerElement.innerHTML = '';

                function changeOpacity(evt) {
                    evt.target.style.opacity = 0.6;
                }

                function changeOpacityToOne(evt) {
                    evt.target.style.opacity = 1;
                }

                //create dom icon and add/remove opacity listeners
                var domIcon = new H.map.DomIcon(outerElement, {
                    // the function is called every time marker enters the viewport
                    onAttach: function(clonedElement, domIcon, domMarker) {
                        clonedElement.addEventListener('mouseover', changeOpacity);
                        clonedElement.addEventListener('mouseout', changeOpacityToOne);
                    },
                    // the function is called every time marker leaves the viewport
                    onDetach: function(clonedElement, domIcon, domMarker) {
                        clonedElement.removeEventListener('mouseover', changeOpacity);
                        clonedElement.removeEventListener('mouseout', changeOpacityToOne);
                    }
                });

                // Marker for Chicago Bears home
                bearsMarker = new H.map.DomMarker({lat: 41.8625, lng: -87.6166}, {
                    icon: domIcon
                });
                map.addObject(bearsMarker);

            }

        }
    ]
);
