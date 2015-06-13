'use strict';

angular.module('blackboxApp')
  .factory('polling', ['$http', '$interval',
        function ($http, $interval) {
        var defaultPollingTime = 10000;
        var polls = {};

        return {
            startPolling: function(name, url, pollingTime, callback) {

                // Check to make sure poller doesn't already exist
                if (!polls[name]) {
                    var poller = function() {
                        $http.get(url).then(callback);
                    };
                    poller();
                    polls[name] = $interval(poller, pollingTime || defaultPollingTime);
                }
            },

            stopPolling: function(name) {
                clearInterval(polls[name]);
                delete polls[name];
            }
        }
  }]);
