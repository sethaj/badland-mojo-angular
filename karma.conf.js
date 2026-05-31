module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      // Core dependencies (order matters)
      'node_modules/jquery/dist/jquery.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-mocks/angular-mocks.js',
      // Stubs for non-npm libraries used by badland.js
      'test/stubs/*.js',
      // Application source
      'public/js/badland.js',
      // Test specs
      'test/**/*.spec.js'
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    // FirefoxHeadless using the host Firefox binary (works inside Flatpak sandbox)
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['--headless']
      }
    },
    browsers: ['FirefoxHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};
