// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
require('./commands');

Cypress.Server.defaults({
  delay: 500,
  force404: false,
  whitelist: (xhr) => {
    return xhr.method === 'GET' && /(workspace|arcgisonline|\.(jsx?|html|css)(\?.*)?$)/.test(xhr.url);
  }
});

exports.IndexedDB = {
  FILES: 'opensphere.files',
  SETTINGS: 'opensphere.settings'
};

exports.HIDE_TIPS = '?tips=false';
