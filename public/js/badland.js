(function() {
    'use strict';
    angular.module('Badland', [
        'ngRoute',
    ])  
    .config(function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'partials/index.html',
            controller:  'BadlandController'
        })  
        .otherwise({
            redirectTo: '/' 
        }); 
    }); 
})();



(function() {
    'use strict';
    angular.module('Badland')
    .controller('BadlandController', Badland);

    Badland.$inject = ['$scope', 'BadlandFactory', '$sce'];

    function Badland($scope, bf, $sce) {

        $scope.getSongs = function() {
            bf.getSongs().then(function(data) {
    
                $scope.songs = data.badlands;

                $('.content').masonry({
                    itemSelector : '.ascii',
                    columnWidth : 200 
                });
            });
        };

        $scope.updateScore = function(index) {
            bf.updateScore($scope.songs[index]).then(function(data) {

                $scope.songs[index].score = data.score;

            });   
        };

        // Avoiding https://docs.angularjs.org/error/$interpolate/noconcat?p0= 
        $scope.interpolateMp3 = function(mp3) {
            return $sce.trustAsResourceUrl("/mp3/" + mp3);
        };

        $scope.interpolateOgg = function(ogg) {
            return $sce.trustAsResourceUrl("/mp3/" + ogg);
        };


        $scope.getSongs();

        $('body').css('background-color', rand_hex_color());
        $('body').css('opacity', '0.4');

    }
})();


(function() {
    'use strict';
    angular.module('Badland')
    .factory('BadlandFactory', Badland);

    Badland.$inject = ['$http', '$q'];

    function Badland ($http, $q) {

        var service = {
            getSongs: getSongs,
            updateScore: updateScore,
        };

        return service;


        function getSongs() {
            var deferred = $q.defer();

            $http.get('/badland')
            .success(function(data) {
                deferred.resolve(data);
            })
            .error(function(reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        }

        function updateScore(song) {
            var deferred = $q.defer();

            $http.post('/update/' + song.id)
            .success(function(data) {
                deferred.resolve(data);
            })
            .error(function(reason) {
                deferred.reject(reason);
            });
            return deferred.promise;
        }
    }
})();


(function() {
    'use strict';
    angular.module('Badland')
    .directive('changeColor', ChangeColor);
    
    function ChangeColor() {

        return {
            restrict: 'A',
            link: function(scope, element, attr, ctrl) {

                element.css({
                    'background-color': rand_hex_color(),
                    'color':            rand_hex_color()
                });
                $(element).children('.score').css({
                    'background-color': rand_hex_color(),
                });

                element.on("mouseover", function() {
                    element.everyTime(100, function() {
                        // everyTime is from jquery.timers.js
                        element.css({
                            'background-color': rand_hex_color(),
                            'color':            rand_hex_color()
                        });
                        $(element).children('.score').css({
                            'background-color': rand_hex_color()
                        });
                    });
                });
                element.on("mouseout", function() {
                    element.stopTime();
                });
            }
        };
    }
})();



function rand(i) {
    return Math.floor(Math.random()*i);
}   

function rand_hex_color() {
    // http://paulirish.com/2009/random-hex-color-code-snippets/
    // return '#'+ ('000000' + rand(16777215).toString(16)).slice(-6);
    var colors = ["#000000", "#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888", "#999999"];
    // var colors = ["#414a4c", "#3b444b", "#353839", "#232b2b","#0e1111", "white"];
    return colors[Math.floor(Math.random() * colors.length)]
}   
