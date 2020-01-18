#!/usr/bin/env node

const path = require('path');

const provideToFile = new Map();
const provideToProvidesWhichRequireIt = new Map();

if (process.argv.length < 4) {
  console.log('Usage: scripts/whydep.js <entryPointProvide> <dep> <optionalLoaderFile>');
  console.log('The loader file defaults to ./.build/app-loader.js');
  console.log('e.g. scripts/whydep.js osmain os.layer.preset');
  process.exit(0);
}

// mock up goog a bit
global.goog = {
  addDependency: (file, providesList, requiresList) => {
    providesList.forEach((provide) => {
      provideToFile.set(provide, file);
      requiresList.forEach((require) => {
        let itemsRequiringProvide = provideToProvidesWhichRequireIt.get(require);
        if (!itemsRequiringProvide) {
          itemsRequiringProvide = new Set();
        }

        itemsRequiringProvide.add(provide);
        provideToProvidesWhichRequireIt.set(require, itemsRequiringProvide);
      });
    });
  },
  DebugLoader_: function() {},
  Dependency: {},
  bootstrap: () => {}
};

// load the app-loader.js file
require(path.resolve(process.cwd(), process.argv[4] || './.build/app-loader.js'));

const getFile = (dep) => provideToFile.get(dep);
const getItemsRequiringDep = (dep) => provideToProvidesWhichRequireIt.get(dep);

const findPath = (startDep, endDep, path) => {
  const startFile = getFile(startDep);
  path = path || [endDep];

  const itemsWhichRequireEnd = getItemsRequiringDep(endDep);
  if (itemsWhichRequireEnd) {
    itemsWhichRequireEnd.forEach((dep) => {
      if (dep.startsWith('goog.')) {
        return;
      }

      const depFile = getFile(dep);
      if (startFile === depFile) {
        addPath(path);
      } else if (path.indexOf(dep) === -1) {
        path.push(dep);
        findPath(startDep, dep, path);
        path.pop();
      }
    });
  }
};

const paths = new Set();

const addPath = (path) => {
  if (path.length > 1) {
    let str = '';
    for (let i = 0, n = path.length; i < n; i++) {
      str += ((i === 0) ? 'Found ' : '     ') + getFile(path[i]) + '\n';
    }
    paths.add(str);
  }
};

findPath(process.argv[2], process.argv[3]);

paths.forEach((path) => {
  console.log(path);
});

console.log('Found', paths.size, 'unique paths');
