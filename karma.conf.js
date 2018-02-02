/* eslint-env es6 */
/* eslint-disable max-len */

const path = require('path');
const helper = require('opensphere-build-closure-helper');
const resolver = require('opensphere-build-resolver/utils');

module.exports = function(config) {
  var closureFiles = helper.readManifest(path.resolve('.build', 'gcc-test-manifest'))
      .filter(function(item) {
        return item.indexOf('/src/core/debugutil.js') === -1 &&
          item.indexOf(__dirname + '/test/') !== 0;
      });

  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      {pattern: '.build/modernizr.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('opensphere-asm/dist/os-wasm.*', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('opensphere-asm/dist/os-asm.*', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('opensphere-asm/dist/os-load.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('jquery/dist/jquery.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular/angular.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular-sanitize/angular-sanitize.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular-mocks/angular-mocks.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('d3/d3.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('jsts/dist/jsts.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('proj4/dist/proj4.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('moment/min/moment.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('crossfilter2/crossfilter.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('papaparse/papaparse.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('cesium/Build/Cesium/Cesium.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('xmllint/xmllint.js', __dirname), watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/WMM.COF', watched: false, included: false, served: true},
      {pattern: 'vendor/geomag/cof2Obj.js', watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/geomag.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('lolex/lolex.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('opensphere-state-schema/src/main/**/*.xsd', __dirname), watched: false, included: false, served: true}
    ].concat(closureFiles).concat([
      // init
      'test/init.js',

      // tests and mocks
      'test/**/*.mock.js',
      'test/**/*.test.js',

      // test resources
      {pattern: 'test/**/*.test.worker.js', included: false},
      {pattern: 'test/**/*.json', included: false},
      {pattern: 'test/**/*.xml', included: false},
      {pattern: 'test/resources/**/*', included: false},
      {pattern: resolver.resolveModulePath('google-closure-library/closure/goog/bootstrap/webworkers.js', __dirname), included: false}
    ]),

    proxies: {
      '/google-closure-library': resolver.resolveModulePath('google-closure-library', __dirname),
      '/opensphere-state-schema': resolver.resolveModulePath('opensphere-state-schema', __dirname)
    },

    // list of files to exclude
    exclude: [
      'src/main.js',
      '**/*.swp'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['dots', 'junit', 'coverage'],

    preprocessors: {
      'src/**/*.js': ['coverage']
    },

    junitReporter: {
      outputDir: '.build/test',
      outputFile: 'test-results.xml',
      useBrowserName: false
    },

    coverageReporter: {
      // TODO: enforce full coverage in the build. For libraries
      // this should probably be 100%, but you can address that
      // per-project.
      /* check: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
          excludes: []
        },
        each: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
          excludes: [],
          overrides: {}
        }
      }, */
      reporters: [{
        type: 'html',
        dir: '.build/test/coverage/html',
        subdir: '.'
      }, {
        type: 'cobertura',
        dir: '.build/test/coverage/cobertura'
      }, {
        type: 'text-summary'
      }]
    },


    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    customLaunchers: {
      ChromeNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['ChromeNoSandbox', 'FirefoxHeadless'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // If the browser takes a nap, wait for it
    browserNoActivityTimeout: 60000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
