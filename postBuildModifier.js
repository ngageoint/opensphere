var fs = require('fs');
const fse = require('fs-extra');

const srcDir = `../../node_modules/google-closure-library/`;
const destDir = `./dist/opensphere/google-closure-library/`;

fs.mkdirSync(destDir);
fse.copySync(srcDir, destDir);

const indexFile = './dist/opensphere/index.html';

fs.readFile(indexFile, 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace('refresh the page.</noscript>',
      'refresh the page.</noscript>\n<script src=\'google-closure-library/closure/goog/base.js\'></script>' +
      '\n<script src=\'defines.js\'></script>');

  fs.writeFile(indexFile, result, 'utf8', function(err) {
    if (err) return console.log(err);
  });
});

const definesFile = './dist/opensphere/defines.js';
let definesContent = '// This file overrides goog.define() calls for <project>.*.ROOT defines in the debug html\n' +
'var CLOSURE_UNCOMPILED_DEFINES = {\n' +
'  "os.APP_ROOT": "./",\n' +
'  "os.ROOT": "REPLACE",\n' +
'  "os.SETTINGS": "./config/settings.json",\n' +
'  "goog.debug.LOGGING_ENABLED": false,\n' +
'  "os.file.ZIP_PATH": "../../node_modules/zip-js/WebContent",\n' +
'  "plugin.cesium.LIBRARY_BASE_PATH": "../../node_modules/cesium/Build/CesiumUnminified",\n' +
'  "JSCHARDET_BASE_PATH": "../../node_modules/jschardet/dist"\n' +
'};';

const distDir = './dist/opensphere/';
let buildOutDir = './';
fs.readdirSync(distDir).forEach((file) => {
  if (file.startsWith('v')) {
    buildOutDir += file + '/';
  }
});

definesContent = definesContent.replace('REPLACE', buildOutDir);

fs.writeFile(definesFile, definesContent, 'utf8', function(err) {
  if (err) return console.log(err);
});
