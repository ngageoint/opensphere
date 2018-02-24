/* eslint-env es6 */

'use strict';

const fs = require('fs');
const path = require('path');
const resolver = require('opensphere-build-resolver/utils');


/**
 * Directory containing build artifacts generated by `bits-resolver`.
 * @type {string}
 */
const buildDir = '.build';


/**
 * Path to the build directory.
 * @type {string}
 */
const buildPath = path.join(__dirname, buildDir);


/**
 * Path to the built version file.
 * @type {string}
 */
const versionFile = path.join(buildPath, 'version');


/**
 * Relative path of the built version directory.
 * @type {string}
 */
const version = fs.readFileSync(versionFile, 'utf8').trim()
    .replace(/.*\//, '');


/**
 * Version value from the package.json file. Used in about/feedback/what's new
 * @type {string}
 */
const packageVersion = require('./package').version;


/**
 * Path to the override version file - exists if a plugin package.json file provides overrideVersion
 * @type {string}
 */
const overrideVersionFile = path.join(buildPath, 'overrideVersion');


/**
 * Allow a plugin to override the app version of opensphere that is passed to index-template.html
 * @type {string}
 */
const overrideVersion = fs.existsSync(overrideVersionFile) ? fs.readFileSync(overrideVersionFile, 'utf8') : undefined;


/**
 * Resources for `bits-index` to include in the distribution and both
 * `index.html` and `tools.html`.
 * @type {Array<Object>}
 */
const sharedResources = [
  {
    source: 'src/electron',
    target: 'electron',
    scripts: ['electronvendorpre.js']
  },
  {
    source: buildPath,
    target: '',
    scripts: ['modernizr.js']
  },
  {
    source: __dirname,
    target: '',
    scripts: ['browserCheck.js']
  },
  {
    source: resolver.resolveModulePath('openlayers/dist', __dirname),
    target: 'vendor/openlayers',
    css: ['ol.css']
  },
  {
    source: resolver.resolveModulePath('jquery/dist', __dirname),
    target: 'vendor/jquery',
    scripts: ['jquery.min.js']
  },
  {
    source: 'src/worker',
    target: 'src/worker',
    files: ['computeframediffs.js', 'dataurltoarray.js']
  },
  {
    source: 'vendor/jquery',
    target: 'vendor/jquery',
    scripts: ['jquery.event.drag-2.2.js', 'jquery.resize.js']
  },
  {
    source: 'vendor/jquery-ui',
    target: 'vendor/jquery-ui',
    css: ['darkness/jquery-ui-1.11.0.min.css'],
    scripts: ['jquery-ui-1.11.4.min.js'],
    files: ['darkness/images']
  },
  {
    source: 'vendor/bootstrap',
    target: 'vendor/bootstrap',
    css: ['slate/bootstrap.min.css'],
    scripts: ['bootstrap.min.js'],
    files: ['img']
  },
  {
    source: 'vendor/select2',
    target: 'vendor/select2',
    css: ['select2.css'],
    scripts: ['select2-3.2-min.js'],
    files: ['*.+(gif|png)']
  },
  {
    source: 'vendor/slick',
    target: 'vendor/slickgrid',
    css: ['slick.grid.css'],
    scripts: [
      'slick.core.js',
      'slick.dataview.js',
      'slick.editors.js',
      'slick.formatters.js',
      'slick.rowselectionmodel.js',
      'slick.grid.js'
    ],
    files: ['images']
  },
  {
    source: resolver.resolveModulePath('simplemde/dist', __dirname),
    target: 'vendor/simplemde',
    css: ['simplemde.min.css'],
    scripts: ['simplemde.min.js']
  },
  {
    source: resolver.resolveModulePath('crossfilter2', __dirname),
    target: 'vendor/crossfilter',
    scripts: ['crossfilter.min.js']
  },
  {
    source: resolver.resolveModulePath('font-awesome', __dirname),
    target: 'vendor/font-awesome',
    css: ['css/font-awesome.min.css'],
    files: ['fonts']
  },
  {
    source: resolver.resolveModulePath('moment/min', __dirname),
    target: 'vendor/moment',
    scripts: ['moment.min.js']
  },
  {
    source: resolver.resolveModulePath('angular', __dirname),
    target: 'vendor/angular',
    scripts: ['angular.min.js']
  },
  {
    source: resolver.resolveModulePath('angular-animate', __dirname),
    target: 'vendor/angular',
    scripts: ['angular-animate.min.js']
  },
  {
    source: resolver.resolveModulePath('angular-sanitize', __dirname),
    target: 'vendor/angular',
    scripts: ['angular-sanitize.min.js']
  },
  {
    source: resolver.resolveModulePath('angular-route', __dirname),
    target: 'vendor/angular',
    scripts: ['angular-route.min.js']
  },
  {
    source: 'vendor/angular-ui',
    target: 'vendor/angular',
    scripts: [
      'angular-ui.js',
      'angular-ui-utils/scroll/ui-scroll.js',
      'angular-ui-utils/scroll/ui-scroll-jqlite.js'
    ]
  },
  {
    source: resolver.resolveModulePath('text-encoding/lib', __dirname),
    target: 'vendor/text-encoding',
    scripts: [
      'encoding-indexes.js',
      'encoding.js']
  },
  {
    source: 'vendor/polyfill',
    target: 'vendor/polyfill',
    scripts: ['blob.js', 'filesaver.js', 'string.js', 'typedarray.js']
  },
  {
    source: 'vendor/zip',
    target: 'vendor/zip',
    scripts: ['zip.js', 'zip-ext.js'],
    files: ['deflate.js', 'inflate.js']
  },
  {
    source: 'vendor/geomag',
    target: 'vendor/geomag',
    scripts: ['cof2Obj.js', 'geomag.js'],
    files: ['WMM.COF']
  },
  {
    source: resolver.resolveModulePath('cesium/Build/Cesium', __dirname),
    target: 'vendor/cesium',
    scripts: ['Cesium.js'],
    files: [
      'Assets',
      'ThirdParty',
      'Workers'
    ]
  },
  {
    source: resolver.resolveModulePath('jsts/dist', __dirname),
    target: 'vendor/jsts',
    scripts: ['jsts.min.js']
  },
  {
    source: resolver.resolveModulePath('navigator.sendbeacon', __dirname),
    target: 'vendor/sendbeacon',
    scripts: ['sendbeacon.js']
  },
  {
    source: 'src/electron',
    target: 'electron',
    scripts: ['electronvendorpost.js']
  }
];

const indexResources = sharedResources.concat([
  {
    source: '',
    target: '',
    files: ['images']
  },
  {
    source: 'styles',
    target: 'styles',
    files: ['icons']
  },
  {
    source: resolver.resolveModulePath('opensphere-asm/dist', __dirname),
    target: '',
    scripts: ['os-load.js'],
    files: [
      'os-wasm.js',
      'os-wasm.wasm',
      'os-asm.js',
      'os-asm.js.mem'
    ]
  },
  {
    source: resolver.resolveModulePath('d3', __dirname),
    target: 'vendor/d3',
    scripts: ['d3.min.js']
  },
  {
    source: 'vendor/d3',
    target: 'vendor/d3',
    scripts: ['d3-tip.js']
  },
  {
    source: resolver.resolveModulePath('save-svg-as-png', __dirname),
    target: 'vendor/save-svg-as-png',
    scripts: ['saveSvgAsPng.js']
  },
  {
    source: resolver.resolveModulePath('papaparse', __dirname),
    target: 'vendor/papaparse',
    scripts: ['papaparse.min.js']
  },
  {
    source: resolver.resolveModulePath('proj4/dist', __dirname),
    target: 'vendor/proj4',
    scripts: ['proj4.js']
  },
  {
    source: resolver.resolveModulePath('suncalc', __dirname),
    target: 'vendor/suncalc',
    scripts: ['suncalc.js']
  },
  {
    source: 'vendor/gif',
    target: 'vendor/gif',
    files: ['gif.js', 'gif.worker.js']
  },
  {
    source: 'vendor/ffmpeg',
    target: 'vendor/ffmpeg',
    files: ['ffmpeg_asm.js']
  }
]);


/**
 * Resources for unsupported browser page to include in `old.html`
 * @type {Array<Object>}
 */
const oldResources = [
  {
    source: __dirname,
    target: '',
    scripts: ['browserCheck.js']
  },
  {
    source: resolver.resolveModulePath('platform', __dirname),
    target: '',
    scripts: ['platform.js']
  },
  {
    source: buildPath,
    target: '',
    scripts: ['modernizr.js']
  },
  {
    source: 'vendor/bootstrap',
    target: 'vendor/bootstrap',
    css: ['slate/bootstrap.min.css']
  },
  {
    source: resolver.resolveModulePath('font-awesome', __dirname),
    target: 'vendor/font-awesome',
    css: ['css/font-awesome.min.css'],
    files: ['fonts']
  }
];


/**
 *
 */
module.exports = {
  appVersion: version,
  packageVersion: packageVersion,
  overrideVersion: overrideVersion,
  basePath: __dirname,
  distPath: path.join('dist', 'opensphere'),
  templates: [
    {
      id: 'index',
      file: 'index-template.html',
      resources: indexResources
    }, {
      id: 'old',
      file: 'old-template.html',
      resources: oldResources
    }
  ],
  debugCss: path.join(buildDir, 'combined.css'),
  compiledCss: path.join(version, 'styles', 'opensphere.min.css'),
  compiledJs: path.join(version, 'opensphere.min.js'),
  sharedResources: sharedResources
};
