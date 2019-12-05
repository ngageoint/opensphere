/* eslint-env es6 */
/* eslint-disable max-len */

const path = require('path');
const resolver = require('opensphere-build-resolver/utils');

/**
 * Karma configuration for OpenSphere.
 *
 * Development Note:
 * This configuration uses a script loader to avoid pending request limits in Chrome. To limit which tests run during
 * development, use `ddescribe` and `iit` to instruct Jasmine to only run those specs.
 *
 * @param {Object} config The config.
 */
module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      {pattern: '.build/modernizr.js', watched: false, included: true, served: true},
      {pattern: '.build/xml-lexer.min.js', watched: false, included: true, served: true},
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
      {pattern: resolver.resolveModulePath('bootstrap/dist/js/bootstrap.bundle.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('moment/min/moment.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('crossfilter2/crossfilter.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('papaparse/papaparse.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('cesium/Build/CesiumUnminified/Cesium.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('xmllint/xmllint.js', __dirname), watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/WMM.COF', watched: false, included: false, served: true},
      {pattern: 'vendor/geomag/cof2Obj.js', watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/geomag.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('css-element-queries/src/ResizeSensor.js'), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('jschardet/dist/jschardet.min.js'), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('oboe/dist/oboe-browser.min.js'), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('lolex/lolex.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('zip-js/WebContent/zip.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('zip-js/WebContent/zip-ext.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('zip-js/WebContent/deflate.js', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('zip-js/WebContent/inflate.js', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('zip-js/WebContent/z-worker.js', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('opensphere-state-schema/src/main/**/*.xsd', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('suncalc/suncalc.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('markdown-it/dist/markdown-it.min.js', __dirname), watched: false, included: true, served: true},

      // initialization to run prior to tests
      'test/init.js',

      // test resources
      {pattern: 'test/**/*.test.worker.js', included: false},
      {pattern: 'test/**/*.json', included: false},
      {pattern: 'test/**/*.xml', included: false},
      {pattern: 'test/resources/**/*', included: false},

      // source files for the script loader
      {pattern: 'src/**/*.js', watched: false, included: false, served: true},
      {pattern: 'test/**/*.js', watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('google-closure-library/**/*.js', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('openlayers/**/*.js', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('ol-cesium/**/*.js', __dirname), watched: false, included: false, served: true},

      // serve the test manifest and include the script loader
      {pattern: '.build/gcc-test-manifest', watched: false, included: false, served: true},
      resolver.resolveModulePath('opensphere-build-index/karma-test-loader.js', __dirname)
    ],

    proxies: {
      // the test loader uses this path to resolve the manifest
      '/karma-test-scripts': path.resolve(__dirname, '.build', 'gcc-test-manifest'),
      // some tests load resources with an absolute path from these modules
      '/opensphere': path.resolve(__dirname),
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

    //
    // Preprocessors:
    //  - googmodule wraps goog.module files so they are loaded correctly by the browser
    //  - coverage provides test coverage reports
    //
    preprocessors: {
      'src/**/*.js': ['googmodule', 'coverage'],
      'test/**/*.mock.js': ['googmodule']
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
