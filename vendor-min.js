#!/usr/bin/env node

'use strict';

const resolver = require('opensphere-build-resolver/utils');
const Compiler = require('google-closure-compiler').compiler;


/**
 * Resources for tuiEditor
 * @type {Array<Object>}
 */
const tuiEditorResources = [
  {
    source: resolver.resolveModulePath('to-mark/dist', __dirname),
    scripts: ['to-mark.min.js']
  },
  {
    source: resolver.resolveModulePath('highlight.js/lib', __dirname),
    scripts: ['highlight.js']
  },
  {
    source: resolver.resolveModulePath('squire-rte/build', __dirname),
    scripts: ['squire.js']
  },
  {
    source: resolver.resolveModulePath('codemirror/lib', __dirname),
    scripts: ['codemirror.js']
  },
  {
    source: resolver.resolveModulePath('tui-code-snippet/dist', __dirname),
    scripts: ['tui-code-snippet.min.js']
  },
  {
    source: resolver.resolveModulePath('tui-editor/dist', __dirname),
    scripts: [
      'tui-editor-Editor.min.js',
      'tui-editor-extTable.min.js'
    ]
  }
];


/**
 * @param {Array<Object>} resources
 * @param {string} output
 * @param {string=} opt_optimzationLevel
 */
var vendorMinify = function(resources, output, opt_optimzationLevel) {
  var fileList = [];
  resources.forEach(function(lib) {
    lib.scripts.forEach(function(script) {
      fileList = fileList.concat(lib.source + '/' + script);
    });
  });

  var compiler = new Compiler({
    js: fileList,
    compilation_level: opt_optimzationLevel || 'SIMPLE_OPTIMIZATIONS',
    js_output_file: output
  });

  compiler.run((exit, out, err) => {
    if (exit) {
      process.stderr.write(err, () => process.exit(1))
    } else {
      process.stderr.write(err);
      process.stdout.write(out);
    }
  })
};

vendorMinify(tuiEditorResources, 'vendor/os-minified/os-tui-editor.min.js');
