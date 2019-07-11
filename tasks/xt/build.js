#!/usr/bin/env node

var compile = require('opensphere-build-closure-helper').compile;
var resolver = require('opensphere-build-resolver/utils');
var options = require('./gcc-args.json');

var resolvePath = function(path) {
  var isNegation = path[0] === '!';
  var resolved = resolver.resolveModulePath(isNegation ? path.substr(1) : path, __dirname);
  if (resolved) {
    return (isNegation ? '!' : '') + resolved;
  }
  return path;
};

var resolveAndUpdate = function(key) {
  if (Array.isArray(options[key])) {
    options[key] = options[key].map(resolvePath);
  } else if (typeof options[key] === 'string') {
    options[key] = resolvePath(options[key]);
  }
};

var pathKeys = ['js'];
pathKeys.forEach(resolveAndUpdate);

compile(options);
