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

    Badland.$inject = ['$scope', 'BadlandFactory', 'PlayerService', '$interval', '$timeout'];

    function Badland($scope, bf, PlayerService, $interval, $timeout) {

        $scope.player      = PlayerService;
        $scope.dancer      = {
            x: 20,
            y: 80,
            size: 20,
            pose: 'worm',
            fresh: false,
            phrase: 'fresh',
            hat: false,
            hidden: false,
            exiting: false,
        };
        $scope.dancerPhrases = ['fresh'];
        $scope.dancerStyle = {
            left: '20px',
            top: '80px',
            transform: 'scale(1)'
        };

        var danceInterval = null;
        var sizeInterval = null;
        var exitInterval = null;
        var exitTimeout = null;
        var freshTicks = 0;
        var vx = 5;
        var vy = 3;
        var poses = ['worm', 'moonwalk', 'spin-head', 'spin-back', 'wave', 'flare', 'freeze'];

        function randomPose() {
            return poses[Math.floor(Math.random() * poses.length)];
        }

        function randomPhrase() {
            var list = ($scope.dancerPhrases && $scope.dancerPhrases.length)
                ? $scope.dancerPhrases
                : ['fresh'];
            return list[Math.floor(Math.random() * list.length)];
        }

        function viewport() {
            return {
                w: window.innerWidth || 360,
                h: window.innerHeight || 640
            };
        }

        function randomSize() {
            // Keep the dancer small most of the time, with occasional giant moments.
            if (Math.random() < 0.9) {
                return 20 + Math.floor(Math.random() * 80);   // 20..99 (90%)
            }
            return 100 + Math.floor(Math.random() * 401);     // 100..500 (10%)
        }

        function syncDancerStyle() {
            $scope.dancerStyle.left = $scope.dancer.x + 'px';
            $scope.dancerStyle.top = $scope.dancer.y + 'px';
            $scope.dancerStyle.transform = 'scale(' + ($scope.dancer.size / 20) + ')';
        }

        function startDancer() {
            if (danceInterval) return;
            var view = viewport();
            $scope.dancer.size = 20;
            $scope.dancer.x = Math.max(0, Math.floor(Math.random() * (view.w - 30)));
            $scope.dancer.y = Math.max(56, Math.floor(Math.random() * (view.h - 80)));
            $scope.dancer.pose = 'worm';
            $scope.dancer.fresh = false;
            $scope.dancer.phrase = 'fresh';
            $scope.dancer.hat = false;
            $scope.dancer.hidden = false;
            $scope.dancer.exiting = false;
            syncDancerStyle();
            freshTicks = 0;
            vx = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.floor(Math.random() * 6));
            vy = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 5));

            danceInterval = $interval(function() {
                var view = viewport();
                var visualSize = $scope.dancer.size;

                // Chaotic roaming with occasional momentum shifts.
                if (Math.random() < 0.12) vx += (Math.random() < 0.5 ? -4 : 4);
                if (Math.random() < 0.12) vy += (Math.random() < 0.5 ? -3 : 3);
                if (vx > 12) vx = 12;
                if (vx < -12) vx = -12;
                if (vy > 10) vy = 10;
                if (vy < -10) vy = -10;

                $scope.dancer.x += vx;
                $scope.dancer.y += vy;

                // Keep dancer on visible page while allowing full-window travel.
                if ($scope.dancer.x < 0) {
                    $scope.dancer.x = 0;
                    vx = Math.abs(vx);
                }
                if ($scope.dancer.y < 56) {
                    $scope.dancer.y = 56;
                    vy = Math.abs(vy);
                }
                if ($scope.dancer.x > view.w - visualSize) {
                    $scope.dancer.x = Math.max(0, view.w - visualSize);
                    vx = -Math.abs(vx);
                }
                if ($scope.dancer.y > view.h - visualSize) {
                    $scope.dancer.y = Math.max(56, view.h - visualSize);
                    vy = -Math.abs(vy);
                }

                syncDancerStyle();

                if (Math.random() < 0.35) {
                    $scope.dancer.pose = randomPose();
                }

                if (freshTicks > 0) {
                    freshTicks -= 1;
                    if (freshTicks === 0) $scope.dancer.fresh = false;
                } else if (Math.random() < 0.08) {
                    $scope.dancer.fresh = true;
                    $scope.dancer.phrase = randomPhrase();
                    freshTicks = 8;
                }
            }, 90);

            sizeInterval = $interval(function() {
                $scope.dancer.size = randomSize();
                syncDancerStyle();
            }, 2000);
        }

        $scope.onDancerClick = function($event) {
            if ($event && $event.stopPropagation) $event.stopPropagation();
            if ($scope.dancer.exiting || $scope.dancer.hidden) return;

            if (danceInterval) {
                $interval.cancel(danceInterval);
                danceInterval = null;
            }
            if (sizeInterval) {
                $interval.cancel(sizeInterval);
                sizeInterval = null;
            }
            if (exitInterval) {
                $interval.cancel(exitInterval);
                exitInterval = null;
            }
            if (exitTimeout) {
                $timeout.cancel(exitTimeout);
                exitTimeout = null;
            }

            $scope.dancer.exiting = true;
            $scope.dancer.fresh = false;
            $scope.dancer.hat = true;
            $scope.dancer.pose = 'bow';

            exitTimeout = $timeout(function() {
                var view = viewport();
                var distLeft = $scope.dancer.x;
                var distRight = view.w - ($scope.dancer.x + $scope.dancer.size);
                var goRight = distRight > distLeft;

                $scope.dancer.pose = goRight ? 'moonwalk-exit-right' : 'moonwalk-exit-left';

                exitInterval = $interval(function() {
                    $scope.dancer.x += goRight ? 10 : -10;
                    syncDancerStyle();

                    if ($scope.dancer.x > view.w + 40 || $scope.dancer.x < -($scope.dancer.size + 40)) {
                        if (exitInterval) {
                            $interval.cancel(exitInterval);
                            exitInterval = null;
                        }
                        $scope.dancer.hidden = true;
                        $scope.dancer.exiting = false;
                    }
                }, 60);
            }, 520);
        };

        function stopDancer() {
            if (danceInterval) {
                $interval.cancel(danceInterval);
                danceInterval = null;
            }
            if (sizeInterval) {
                $interval.cancel(sizeInterval);
                sizeInterval = null;
            }
            if (exitInterval) {
                $interval.cancel(exitInterval);
                exitInterval = null;
            }
            if (exitTimeout) {
                $timeout.cancel(exitTimeout);
                exitTimeout = null;
            }
            $scope.dancer.fresh = false;
            $scope.dancer.size = 20;
            $scope.dancer.hat = false;
            $scope.dancer.hidden = false;
            $scope.dancer.exiting = false;
            syncDancerStyle();
        }



        $scope.$watch(function() { return PlayerService.isPlaying; }, function(isPlaying) {
            if (isPlaying) {
                startDancer();
            } else {
                stopDancer();
            }
        });

                    syncDancerStyle();
        $scope.$on('$destroy', function() {
            if (danceInterval) { $interval.cancel(danceInterval); }
            if (sizeInterval) { $interval.cancel(sizeInterval); }
            if (exitInterval) { $interval.cancel(exitInterval); }
            if (exitTimeout) { $timeout.cancel(exitTimeout); }
        });

        $scope.getSongs = function() {
            bf.getSongs().then(function(data) {
                $scope.songs = (data.badlands || []).map(function(song) {
                    song.mp3Url = song.file ? '/mp3/' + song.file : null;
                    song.oggUrl = song.ogg ? '/mp3/' + song.ogg : null;
                    return song;
                });
                $scope.dancerPhrases = (data.dancer_phrases && data.dancer_phrases.length)
                    ? data.dancer_phrases
                    : ['fresh'];
                PlayerService.setPlaylist($scope.songs);
            });
        };

        $scope.updateScore = function(index) {
            bf.updateScore($scope.songs[index]).then(function(data) {
                $scope.songs[index].score = data.score;
            });
        };

        $scope.getSongs();
    }
})();


(function() {
    'use strict';
    angular.module('Badland')
    .factory('BadlandFactory', Badland);

    Badland.$inject = ['$http'];

    function Badland($http) {

        var service = {
            getSongs: getSongs,
            updateScore: updateScore,
        };

        return service;

        function getSongs() {
            return $http.get('/badland').then(function(response) {
                return response.data;
            });
        }

        function updateScore(song) {
            return $http.post('/update/' + song.id).then(function(response) {
                return response.data;
            });
        }
    }
})();


(function() {
    'use strict';
    angular.module('Badland')
    .factory('PlayerService', PlayerService);

    PlayerService.$inject = ['$rootScope'];

    function PlayerService($rootScope) {
        var currentHowl = null;

        var service = {
            playlist:     [],
            currentIndex: -1,
            currentSong:  null,
            isPlaying:    false,
            setPlaylist:  setPlaylist,
            play:         play,
            pause:        pause,
            toggle:       toggle,
            next:         next,
            prev:         prev,
        };

        return service;

        function safeApply(fn) {
            if ($rootScope.$$phase) {
                fn();
            } else {
                $rootScope.$apply(fn);
            }
        }

        function setPlaylist(songs) {
            service.playlist = songs;
        }

        function play(index) {
            if (index === service.currentIndex && currentHowl) {
                if (service.isPlaying) {
                    currentHowl.pause();
                } else {
                    currentHowl.play();
                }
                return;
            }

            if (currentHowl) {
                currentHowl.stop();
                currentHowl.unload();
            }

            service.currentIndex = index;
            service.currentSong  = service.playlist[index];

            currentHowl = new Howl({
                src: [
                    '/mp3/' + service.currentSong.file,
                    '/mp3/' + service.currentSong.ogg
                ],
                html5: true,
                onend: function() {
                    safeApply(function() {
                        service.isPlaying = false;
                        play((service.currentIndex + 1) % service.playlist.length);
                    });
                },
                onplay: function() {
                    safeApply(function() { service.isPlaying = true; });
                },
                onpause: function() {
                    safeApply(function() { service.isPlaying = false; });
                },
                onstop: function() {
                    safeApply(function() { service.isPlaying = false; });
                },
                onerror: function() {
                    safeApply(function() {
                        service.isPlaying = false;
                        if (service.playlist.length > 1) {
                            play((service.currentIndex + 1) % service.playlist.length);
                        }
                    });
                }
            });
            currentHowl.play();
        }

        function pause() {
            if (currentHowl && service.isPlaying) {
                currentHowl.pause();
            }
        }

        function toggle() {
            if (service.isPlaying) {
                pause();
            } else if (currentHowl && service.currentIndex >= 0) {
                currentHowl.play();
            }
        }

        function next() {
            if (service.playlist.length === 0) return;
            play((service.currentIndex + 1) % service.playlist.length);
        }

        function prev() {
            if (service.playlist.length === 0) return;
            var idx = service.currentIndex <= 0
                ? service.playlist.length - 1
                : service.currentIndex - 1;
            play(idx);
        }
    }
})();
