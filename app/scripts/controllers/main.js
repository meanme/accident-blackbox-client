'use strict';

angular.module('blackboxApp')
  .controller('MainCtrl', [
        '$scope', '$http', '$window', '$timeout', 'polling',
        '$socket',
        function ($scope, $http, $window, $timeout, polling, $socket) {

            var carMarker = null;
            var velocities = [];
            var drop = 150;         // Detect a deceleration of at least 150 over 250 ms
            var crashed = false;

            var video = document.getElementById('dash-cam');
            var videoTime = 0;
            $scope.map = null;
            var startTime = null;
            $scope.changeFrame = function() {

                startTime = (new Date()).getTime();
                $socket.emit('change-frame', {
                    frame: $scope.frame
                });
            };

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
            var chartContext = null;
            $scope.startPolling = false;
            $scope.pollingTimer = null;

            $scope.dataLoaded = false;

            Highcharts.setOptions({
                global : {
                    useUTC : false
                }
            });

            $scope.exportSVG = function(data) {

                console.log(data);

                var svg = $('#container').find('svg')[0];
                var svgSize = svg.getBoundingClientRect();

                var svgData = new XMLSerializer().serializeToString( svg );
                var canvas = document.createElement('canvas');

                canvas.width = svgSize.width;
                canvas.height = svgSize.height;
                var ctx = canvas.getContext('2d');

                var img = document.createElement('img');
                img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                    console.log(canvas.toDataURL('image/png'));

                    console.log(
                        'http://image.maps.cit.api.here.com/mia/1.6/mapview' +
                            '?app_id=evalLunne37Ciwejfare7' +
                            '&app_code=RrEcE54Hc6U2VGp70LqoQQ' +
                            '&z=11&c=' + data.GPS_Latitude + ',' + data.GPS_Longitude
                    );


                };
            };

            var sampler = 0;
            var chart = $('#container').highcharts({
                chart: {
                    type: 'spline',
//                    animation: Highcharts.svg, // don't animate in old IE
                    backgroundColor: null,
                    borderWidth: 1,
                    zoomType: 'x',

                    events: {
                        load: function () {

                            // set up the updating of the chart each second

                            var series = this.series[0];

                            chartContext = this;

                            $socket.on('vehicle-data', function(data) {

                                sampler++;
                                videoTime = data.Extra_NormalizedTimeStamp;

//                                console.log(video.currentTime + ', ' + videoTime);
                                if(video.currentTime < videoTime/1000) {
                                    video.play();
                                } else {
                                    video.pause();
                                }

                                if(sampler % 5 == 0) {
                                    series.addPoint([
                                        startTime + data.Extra_NormalizedTimeStamp,
                                        data.Vehicle_Speed
                                    ], true, true);

                                    Highcharts.charts[0].xAxis[0].update();
                                    $scope.map.setCenter({
                                        lat: data.GPS_Latitude,
                                        lng: data.GPS_Longitude
                                    });

                                    carMarker.setPosition({
                                        lat: data.GPS_Latitude,
                                        lng: data.GPS_Longitude
                                    });

                                }

                                // Check for velocity drop
                                if(!crashed) {
                                    checkVelocity(data);
                                }


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

                plotOptions: {
                    series: {
                        hover: {
                            enabled: true
                        },
                        marker: {
                            enabled: false
                        }
                    }
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
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    },
                    //data: null
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;
                        startTime = time;

                        for (i = 0; i <= 5; i ++) {
                            var velocity = Math.random() * 20 + 120;
                            data.push({
                                x: time + i * 1000,
                                y: velocity
                            });
                            velocities.push(velocity);
                        }
                        return data;
                    }())
                }]
            });

            function crashResponse(data) {
                crashed = true;
                $scope.exportSVG(data);

            }

            function checkVelocity(data) {

                var newVelocity = data.Vehicle_Speed;

                velocities.push(newVelocity);
                velocities = velocities.slice(-5);

                var result = 0;
                angular.forEach(velocities, function(v) {
                    result += Math.abs(v - newVelocity);
                });

                if(result > drop) {
                    drop = result;
                    crashResponse(data);
                }
            }

            $scope.responses = [];

            $http.get('json/export1.json').
                success(function(data, status, headers, config) {

                    $scope.dataLoaded = true;
                    initializeMap();

                    $socket.emit('data-loaded');
                    video.play();

                    // this callback will be called asynchronously
                    // when the response is available
                    $scope.responses = data;

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

                    $scope.map.setZoom(17);

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
                carMarker = new H.map.DomMarker({lat: 41.8625, lng: -87.6166}, {
                    icon: domIcon
                });
                map.addObject(carMarker);

            }

        }
    ]
);
