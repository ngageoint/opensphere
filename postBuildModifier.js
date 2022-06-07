var fs = require('fs');
const fse = require('fs-extra');

const nodeModulesDir = 'vendor';
let srcDir = `../../node_modules/google-closure-library/`;
if (!fs.existsSync(srcDir)) {
  srcDir = './node_modules/google-closure-library/';
}
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
'  "os.APP_ROOT": "REPLACE",\n' +
'  "os.ROOT": "REPLACE",\n' +
'  "os.SETTINGS": "./config/settings.json",\n' +
'  "goog.debug.LOGGING_ENABLED": true,\n' +
'  "os.file.ZIP_PATH": "NODE_MODULES/zip-js",\n' +
'  "plugin.cesium.LIBRARY_BASE_PATH": "NODE_MODULES/cesium",\n' +
'  "JSCHARDET_BASE_PATH": "NODE_MODULES/jschardet"\n' +
'};';

const distDir = './dist/opensphere/';
let buildOutDir = './';
fs.readdirSync(distDir).forEach((file) => {
  if (file.startsWith('v')) {
    buildOutDir += file + '/';
  }
});

definesContent = definesContent.replace('REPLACE', buildOutDir);
definesContent = definesContent.replace('REPLACE', buildOutDir);
definesContent = definesContent.replace('NODE_MODULES', nodeModulesDir);
definesContent = definesContent.replace('NODE_MODULES', nodeModulesDir);
definesContent = definesContent.replace('NODE_MODULES', nodeModulesDir);

fs.writeFile(definesFile, definesContent, 'utf8', function(err) {
  if (err) return console.log(err);
});
