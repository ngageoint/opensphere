const compile = require('opensphere-build-closure-helper').compile;
const resolver = require('opensphere-build-resolver/utils');
const options = require('./gcc-args.json');

const resolvePath = function(path) {
  const isNegation = path[0] === '!';
  const resolved = resolver.resolveModulePath(isNegation ? path.substr(1) : path, __dirname);
  if (resolved) {
    return (isNegation ? '!' : '') + resolved;
  }
  return path;
};

const resolveAndUpdate = function(key) {
  if (Array.isArray(options[key])) {
    options[key] = options[key].map(resolvePath);
  } else if (typeof options[key] === 'string') {
    options[key] = resolvePath(options[key]);
  }
};

const pathKeys = ['js'];
pathKeys.forEach(resolveAndUpdate);

compile(options);
