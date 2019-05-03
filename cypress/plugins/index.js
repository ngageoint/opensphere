// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

var addMatchImageSnapshotPlugin = require('cypress-image-snapshot/plugin').addMatchImageSnapshotPlugin;

/** This is a description of the foo function.
* @param {string} on - used to hook into various events Cypress emits
* @param {string} config - is the resolved Cypress config
*/
module.exports = function(on, config) {
  addMatchImageSnapshotPlugin(on, config);
  on('before:browser:launch', function(browser, args) {
    console.log(browser.name); // TODO: Remove when done debugging
    if (browser.name === 'chrome') {
      args.push('--window-size=1920,1200');
      return args;
    }

    if (browser.name === 'electron') {
      console.log('running electron'); // TODO: Remove when done debugging
      args['width'] = 1920;
      args['height'] = 1200;
      args['resizable'] = false;

      return args;
    }
  });
};


