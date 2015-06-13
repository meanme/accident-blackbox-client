'use strict';

angular
    .module('blackboxApp', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'highcharts-ng',
        'angular-here-maps'
    ])
    .config(['$routeProvider', 'MapConfigProvider',
        function ($routeProvider, MapConfigProvider) {

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
