#!/usr/bin/env node

'use strict';

const resolver = require('opensphere-build-resolver/utils');
const shell = require('shelljs');


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

  var opLevel = opt_optimzationLevel || 'SIMPLE_OPTIMIZATIONS';
  var args = '--compilation_level ' + opLevel + ' ' + fileList.join(' ') + ' --js_output_file ' + output;
  console.log(args);
  shell.exec(resolver.resolveModulePath('opensphere-build-closure-helper') + '/os-compile.js ' + args);
};

vendorMinify(tuiEditorResources, 'vendor/os-minified/os-tui-editor.min.js');
