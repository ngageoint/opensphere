/* eslint-env es6 */

const path = require('path');
const helper = require('opensphere-build-closure-helper');

module.exports = function(config) {
  var closureFiles = helper.readManifest(path.resolve('.build', 'gcc-test-manifest'))
    .filter(function(item) {
      return item.indexOf('/src/core/debugutil.js') === -1 &&
        item.indexOf('test/') !== 0;
    });

  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      {pattern: '.build/modernizr.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/opensphere-asm/dist/os-wasm.*', watched: false, included: false, served: true},
      {pattern: 'node_modules/opensphere-asm/dist/os-asm.*', watched: false, included: false, served: true},
      {pattern: 'node_modules/opensphere-asm/dist/os-load.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/jquery/dist/jquery.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/angular/angular.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/angular-sanitize/angular-sanitize.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/angular-mocks/angular-mocks.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/d3/d3.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/jsts/dist/jsts.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/proj4/dist/proj4.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/moment/min/moment.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/crossfilter2/crossfilter.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/papaparse/papaparse.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/cesium/Build/Cesium/Cesium.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/xmllint/xmllint.js', watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/geomag.min.js', watched: false, included: true, served: true},
      {pattern: 'node_modules/opensphere-state-schema/src/main/**/*.xsd', watched: false, included: false, served: true}
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
      {pattern: 'node_modules/google-closure-library/closure/goog/bootstrap/webworkers.js', included: false}
    ]),

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

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // If the browser takes a nap, wait for it
    browserNoActivityTimeout: 60000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
