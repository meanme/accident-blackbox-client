'use strict';

angular
    .module('blackboxApp', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'ngSocket',
        'angular-here-maps'
    ])
    .config(['$routeProvider', 'MapConfigProvider',
        '$socketProvider',
        function ($routeProvider, MapConfigProvider,
                  $socketProvider) {

            $socketProvider.setUrl("http://localhost:3000");

            Highcharts.setOptions({
                global : {
                    useUTC : false
                }
            });

        MapConfigProvider.setOptions({
            appId: 'evalLunne37Ciwejfare7',
            appCode: 'RrEcE54Hc6U2VGp70LqoQQ',
            libraries: 'ui,mapevents,pano',
            streetViewControl: false,
            pixelRatio: 2, // Optional (Default: 1)
            pixelPerInch: 320 // Optional (Default: 72)
        });

        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    }]);
