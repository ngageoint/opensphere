#!/usr/bin/env node

var fs = require('fs');

// read in the current args
var file = fs.readFileSync('./.build/gcc-java-args', 'utf8');

file = file.replace(/--entry_point\s[^\s]+\s/g, '') // ditch all entry points
  .replace(/--externs(\s[^\s]+jquery-\d.\d\.js+\s)/, '--externs-save$1') // save jquery externs
  .replace(/--externs\s[^\s]+\s/g, '') // ditch all externs
  .replace(/--externs-save/g, '--externs') // restore saved externs
  .replace(/--jscomp_error='unknownDefines' /g, "--jscomp_off='unknownDefines' ") // turn off unknownDefines check
  .replace(/opensphere.min/g, 'addlayer.min') // write separate js and map files
  .replace(/gcc-manifest/g, 'gcc-manifest-addlayer') // write separate manifest
  .replace(/--js_output_file/g, '--entry_point goog:plugin.openpage.Page --js_output_file'); // add entry_point for addlayer

fs.writeFileSync('./.build/gcc-java-args-addlayer', file, 'utf8');
