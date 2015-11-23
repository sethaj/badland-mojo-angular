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

                $('body').css('background-color', rand_hex_color());
                $('body').css('opacity', '0.4');
            
            });
        };

        $scope.updateScore = function(index) {
            bf.updateScore($scope.songs[index]).then(function(data) {

                $scope.songs[index].score = data.score;
console.log($scope.songs[index]);
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

            $http.get('/update/' + song.id)
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
    
    ChangeColor.$inject = ['$document'];
    
    function ChangeColor($document) {

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
                        // everyyTime is from jquery.timers.js
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
    return '#'+ ('000000' + rand(16777215).toString(16)).slice(-6);
}   
