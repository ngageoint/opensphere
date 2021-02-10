/* eslint-env es6 */
/* eslint-disable max-len */

const path = require('path');
const resolver = require('opensphere-build-resolver/utils');
const closureLibJsPattern = resolver.resolveModulePath('google-closure-library/**/*.js', __dirname);

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
      {pattern: '.build/gcc-defines-test-debug.js', watched: false, included: true, served: true},
      {pattern: '.build/modernizr.js', watched: false, included: true, served: true},
      {pattern: '.build/xml-lexer.min.js', watched: false, included: true, served: true},
      {pattern: '.build/webgl-mock.min.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('opensphere-asm/dist/os-load.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('opensphere-asm/dist/*', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('jquery/dist/jquery.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular/angular.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular-animate/angular-animate.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular-sanitize/angular-sanitize.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('angular-mocks/angular-mocks.js', __dirname), watched: false, included: true, served: true},
      {pattern: 'vendor/angular-ui/angular-ui.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('d3/d3.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('jsts/dist/jsts.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('proj4/dist/proj4.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('bootstrap/dist/js/bootstrap.bundle.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('moment/min/moment.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('crossfilter2/crossfilter.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('papaparse/papaparse.min.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('cesium/Build/CesiumUnminified/Cesium.js', __dirname), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('cesium/Build/CesiumUnminified/**/*', __dirname), watched: false, included: false, served: true},
      {pattern: resolver.resolveModulePath('xmllint/xmllint.js', __dirname), watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/WMM.txt', watched: false, included: false, served: true},
      {pattern: 'vendor/geomag/cof2Obj.js', watched: false, included: true, served: true},
      {pattern: 'vendor/geomag/geomag.js', watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('css-element-queries/src/ResizeSensor.js'), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('chardetng-wasm/dist/es5/chardetng.es5.min.js'), watched: false, included: true, served: true},
      {pattern: resolver.resolveModulePath('chardetng-wasm/dist/es5/*'), watched: false, included: false, served: true},
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

      // Load Angular templates. These will be preprocessed into JS by ng-html2js.
      'views/**/*.html',

      // test resources
      {pattern: 'test/**/*.test.worker.js', included: false},
      {pattern: 'test/**/*.json', included: false},
      {pattern: 'test/**/*.xml', included: false},
      {pattern: 'test/resources/**/*', included: false},
      {pattern: 'images/**/*', included: false},

      // onboarding to avoid 404 warnings
      {pattern: 'onboarding/*.json', included: false},

      // serve files asynchronously loaded by worker tests
      {pattern: 'src/os/job/**/*.js', watched: false, included: false, served: true},
      {pattern: closureLibJsPattern, watched: false, included: false, served: true},

      // load the test dependency bundle generated by webpack
      path.join('.build', 'test.bundle.js'),

      // load tests
      'test/**/*.test.js'
    ],

    mime: {
      'application/wasm': ['wasm']
    },

    proxies: {
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
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage-istanbul'
    reporters: ['dots', 'junit', 'coverage-istanbul'],

    //
    // Preprocessors:
    //  - coverage provides test coverage reports
    //
    preprocessors: {
      // preprocess Angular templates
      'views/**/*.html': ['ng-html2js']
    },

    //
    // Angular template preprocessor.
    //
    // In debug/tests, templateUrl paths have os.ROOT prepended. This config adds each preloaded template to the
    // template cache using the debug path so Angular will not try to request it.
    //
    // Tests using Angular directives should load this module before each test with:
    //
    //   beforeEach(module('app'));
    //
    ngHtml2JsPreprocessor: {
      // Prepend os.ROOT to the preprocessed template path
      prependPrefix: '../opensphere/',
      // Register templates with the 'app' module
      moduleName: 'app'
    },

    //
    // Configuration for karma-coverage-istanbul-reporter.
    // @see https://www.npmjs.com/package/karma-coverage-istanbul-reporter
    //
    coverageIstanbulReporter: {
      dir: path.join('.build', 'test', 'coverage'),
      reports: ['html', 'text-summary'],
      fixWebpackSourcePaths: true,
      'report-config': {
        // all options available at: https://github.com/istanbuljs/istanbuljs/blob/73c25ce79f91010d1ff073aa6ff3fd01114f90db/packages/istanbul-reports/lib/html/index.js#L257-L261
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }
      }
    },

    junitReporter: {
      outputDir: '.build/test',
      outputFile: 'test-results.xml',
      useBrowserName: false
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
