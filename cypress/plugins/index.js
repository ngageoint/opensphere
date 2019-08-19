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
var os = require('os');

/** This is a description of the foo function.
 *
 * @param {string} on - used to hook into various events Cypress emits
 * @param {string} config - is the resolved Cypress config
 */
module.exports = function(on, config) {
  addMatchImageSnapshotPlugin(on, config);
  on('before:browser:launch', function(browser, args) {
    if (browser.name === 'chrome') {
      if (os.platform() === 'win32') {
        args.push('--window-size=1295,1200');
      } else {
        args.push('--window-size=1280,1200');
      }
      return args;
    }

    if (browser.name === 'electron') {
      if (process.env.CI) {
        args['width'] = 1920;
        args['height'] = 1200;
      } else {
        args['width'] = 1280;
        args['height'] = 1200;
      }

      args['resizable'] = false;
      return args;
    }
  });
};


