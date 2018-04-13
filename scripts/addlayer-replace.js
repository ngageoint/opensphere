#!/usr/bin/env node
var fs = require('fs');

var needle = 'os.NAMESPACE=';
var defines = require('../.build/gcc-args').define
  .filter(function(str) {
    return str.startsWith(needle);
  });

if (defines.length) {
  var name = 'addlayer.js';
  var value = defines[0].substring(needle.length).replace(/'/g, '');
  var file = fs.readFileSync(name, 'utf8');

  file = file.replace(/var to = 'opensphere'/, "var to = '" + value + "'");
  fs.writeFileSync('./.build/' + name, file, 'utf8');
}
