describe('Badland App', function () {

  // ── Module ──────────────────────────────────────────────────────────────────

  describe('Module', function () {
    it('should define the Badland module', function () {
      expect(function () { angular.module('Badland'); }).not.toThrow();
    });
  });

  // ── BadlandController (with PlayerService) ──────────────────────────────────

  describe('BadlandController', function () {
    var $scope, $controller, $rootScope, $q, $interval, $httpBackend, BadlandFactory, PlayerService;
    var mockSongs;

    beforeEach(module('Badland'));

    beforeEach(inject(function (_$rootScope_, _$controller_, _BadlandFactory_, _$q_, _PlayerService_, _$interval_, _$httpBackend_) {
      $rootScope     = _$rootScope_;
      $q             = _$q_;
      $interval      = _$interval_;
      $httpBackend   = _$httpBackend_;
      BadlandFactory = _BadlandFactory_;
      PlayerService  = _PlayerService_;
      $scope         = $rootScope.$new();
      $httpBackend.whenGET('partials/index.html').respond(200, '');

      // Fresh copy each test so mutations in one test don't bleed into others
      // (Jasmine 4 randomises test order by default)
      mockSongs = [
        { id: 1, file: 'song1.mp3', ogg: 'song1.ogg', song: 'Test Song One', score: 5, ascii: ' o ', asciis: [' o ', '\\o/', ' o ', '\\o/'] },
        { id: 2, file: 'song2.mp3', ogg: 'song2.ogg', song: 'Test Song Two', score: 1, ascii: '/|\\', asciis: ['/|\\', '|||', '/|\\', '|||'] }
      ];

      spyOn(BadlandFactory, 'getSongs').and.returnValue(
        $q.when({ badlands: mockSongs })
      );
      spyOn(BadlandFactory, 'updateScore').and.returnValue(
        $q.when({ score: 6 })
      );

      $controller = _$controller_('BadlandController', { $scope: $scope });
    }));

    it('should call getSongs on initialisation', function () {
      expect(BadlandFactory.getSongs).toHaveBeenCalled();
    });

    it('should populate $scope.songs after getSongs resolves', function () {
      $rootScope.$digest();
      expect($scope.songs).toBeDefined();
      expect($scope.songs.length).toBe(2);
    });

    it('should expose correct song data on $scope', function () {
      $rootScope.$digest();
      expect($scope.songs[0].song).toBe('Test Song One');
      expect($scope.songs[0].score).toBe(5);
    });

    it('should expose PlayerService as $scope.player', function () {
      expect($scope.player).toBe(PlayerService);
    });

    it('should call PlayerService.setPlaylist after getSongs resolves', function () {
      spyOn(PlayerService, 'setPlaylist');
      $rootScope.$digest();
      expect(PlayerService.setPlaylist).toHaveBeenCalled();
      var playlistArg = PlayerService.setPlaylist.calls.mostRecent().args[0];
      expect(playlistArg.length).toBe(2);
      expect(playlistArg[0].song).toBe('Test Song One');
    });

    it('should precompute mp3Url and oggUrl fields for each song', function () {
      $rootScope.$digest();
      expect($scope.songs[0].mp3Url).toBe('/mp3/song1.mp3');
      expect($scope.songs[0].oggUrl).toBe('/mp3/song1.ogg');
      expect($scope.songs[1].mp3Url).toBe('/mp3/song2.mp3');
      expect($scope.songs[1].oggUrl).toBe('/mp3/song2.ogg');
    });

    describe('updateScore()', function () {
      it('should call BadlandFactory.updateScore with the correct song', function () {
        $rootScope.$digest();
        $scope.updateScore(0);
        expect(BadlandFactory.updateScore).toHaveBeenCalledWith($scope.songs[0]);
      });

      it('should update the score in $scope.songs after the promise resolves', function () {
        $rootScope.$digest();
        $scope.updateScore(0);
        $rootScope.$digest();
        expect($scope.songs[0].score).toBe(6);
      });
    });

  });

  // ── BadlandFactory ───────────────────────────────────────────────────────────

  describe('BadlandFactory', function () {
    var BadlandFactory, $httpBackend;

    beforeEach(module('Badland'));

    beforeEach(inject(function (_BadlandFactory_, _$httpBackend_) {
      BadlandFactory = _BadlandFactory_;
      $httpBackend   = _$httpBackend_;
      $httpBackend.whenGET('partials/index.html').respond(200, '');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('getSongs()', function () {
      it('should make a GET request to /badland', function () {
        $httpBackend.expectGET('/badland').respond(200, { badlands: [] });
        BadlandFactory.getSongs();
        $httpBackend.flush();
      });

      it('should resolve the promise with the response data', function () {
        var mockData = { badlands: [{ id: 1, song: 'Test' }] };
        $httpBackend.whenGET('/badland').respond(200, mockData);

        var resolved;
        BadlandFactory.getSongs().then(function (data) { resolved = data; });
        $httpBackend.flush();

        expect(resolved).toEqual(mockData);
      });
    });

    describe('updateScore()', function () {
      it('should make a POST request to /update/:id', function () {
        var song = { id: 42, score: 2 };
        $httpBackend.expectPOST('/update/42').respond(200, { score: 3 });
        BadlandFactory.updateScore(song);
        $httpBackend.flush();
      });

      it('should resolve the promise with the response data', function () {
        var song = { id: 1, score: 0 };
        $httpBackend.whenPOST('/update/1').respond(200, { score: 1 });

        var resolved;
        BadlandFactory.updateScore(song).then(function (data) { resolved = data; });
        $httpBackend.flush();

        expect(resolved).toEqual({ score: 1 });
      });
    });
  });

  // ── PlayerService ─────────────────────────────────────────────────────────

  describe('PlayerService', function () {
    var PlayerService, $rootScope, $httpBackend;
    var mockSongs;

    beforeEach(module('Badland'));

    beforeEach(inject(function (_PlayerService_, _$rootScope_, _$httpBackend_) {
      PlayerService = _PlayerService_;
      $rootScope    = _$rootScope_;
      $httpBackend  = _$httpBackend_;
      $httpBackend.whenGET('partials/index.html').respond(200, '');
      mockSongs = [
        { id: 1, file: 'song1.mp3', ogg: 'song1.ogg', song: 'Test Song One', score: 5 },
        { id: 2, file: 'song2.mp3', ogg: 'song2.ogg', song: 'Test Song Two', score: 1 },
        { id: 3, file: 'song3.mp3', ogg: 'song3.ogg', song: 'Test Song Three', score: 3 }
      ];
      PlayerService.setPlaylist(mockSongs);
    }));

    it('should start with no current song', function () {
      expect(PlayerService.currentSong).toBeNull();
      expect(PlayerService.currentIndex).toBe(-1);
      expect(PlayerService.isPlaying).toBe(false);
    });

    describe('setPlaylist()', function () {
      it('should store the playlist', function () {
        expect(PlayerService.playlist.length).toBe(3);
        expect(PlayerService.playlist[0].song).toBe('Test Song One');
      });
    });

    describe('play()', function () {
      it('should set currentSong and currentIndex', function () {
        PlayerService.play(0);
        expect(PlayerService.currentIndex).toBe(0);
        expect(PlayerService.currentSong).toBe(mockSongs[0]);
      });

      it('should set isPlaying to true via onplay callback', function () {
        PlayerService.play(1);
        expect(PlayerService.isPlaying).toBe(true);
      });

      it('should toggle pause when called on the already-playing index', function () {
        PlayerService.play(0);
        expect(PlayerService.isPlaying).toBe(true);
        PlayerService.play(0); // pause
        expect(PlayerService.isPlaying).toBe(false);
      });

      it('should switch to a different song when called with a new index', function () {
        PlayerService.play(0);
        PlayerService.play(2);
        expect(PlayerService.currentIndex).toBe(2);
        expect(PlayerService.currentSong).toBe(mockSongs[2]);
      });
    });

    describe('next()', function () {
      it('should advance to the next song', function () {
        PlayerService.play(0);
        PlayerService.next();
        expect(PlayerService.currentIndex).toBe(1);
      });

      it('should wrap around from the last song to the first', function () {
        PlayerService.play(2);
        PlayerService.next();
        expect(PlayerService.currentIndex).toBe(0);
      });
    });

    describe('prev()', function () {
      it('should go to the previous song', function () {
        PlayerService.play(2);
        PlayerService.prev();
        expect(PlayerService.currentIndex).toBe(1);
      });

      it('should wrap around from the first song to the last', function () {
        PlayerService.play(0);
        PlayerService.prev();
        expect(PlayerService.currentIndex).toBe(2);
      });
    });

    describe('toggle()', function () {
      it('should pause a playing song', function () {
        PlayerService.play(0);
        PlayerService.toggle();
        expect(PlayerService.isPlaying).toBe(false);
      });

      it('should resume a paused song', function () {
        PlayerService.play(0);
        PlayerService.toggle(); // pause
        PlayerService.toggle(); // resume
        expect(PlayerService.isPlaying).toBe(true);
      });
    });
  });

});
