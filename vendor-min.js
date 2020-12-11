#!/usr/bin/env node

'use strict';

const path = require('path');
const {compile} = require('opensphere-build-closure-helper');
const {resolveModulePath} = require('opensphere-build-resolver/utils');


/**
 * Path to the tui-editor module.
 * @type {string}
 */
const tuiPath = resolveModulePath('@toast-ui/editor', __dirname);

/**
 * Resources for tuiEditor
 * @type {Array<Object>}
 */
const tuiEditorResources = [
  {
    source: resolveModulePath('codemirror/lib', __dirname),
    scripts: ['codemirror.js']
  },
  {
    source: path.join(tuiPath, 'dist'),
    scripts: [
      'toastui-editor.js'
    ]
  }
];


/**
 * Minify a set of vendor scripts.
 * @param {Array<Object>} resources List of scripts to minify.
 * @param {string} output The output file.
 * @param {string=} opt_optimizationLevel The optimization level.
 */
const vendorMinify = function(resources, output, opt_optimizationLevel = 'SIMPLE_OPTIMIZATIONS') {
  // Assemble script paths to include in the compilation.
  const fileList = [];
  resources.forEach((lib) => {
    fileList.push(...lib.scripts.map((script) => path.join(lib.source, script)));
  });

  compile({
    'js': fileList,
    'compilation_level': opt_optimizationLevel,
    'hide_warnings_for': ['/node_modules/'],
    'js_output_file': output
  });
};

vendorMinify(tuiEditorResources, 'vendor/os-minified/os-toastui-editor.min.js');
