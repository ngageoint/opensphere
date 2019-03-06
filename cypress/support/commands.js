// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
var os = require('./selectors.js');
var config = require('./index.js');

Cypress.Commands.add('login', function(clearLocalStorage) {
  // allows the tester to toggle reload off temporarily
  clearLocalStorage = clearLocalStorage || true;

  if (clearLocalStorage) {
    indexedDB.deleteDatabase(config.IndexedDB.FILES);
    indexedDB.deleteDatabase(config.IndexedDB.SETTINGS);
  }
  cy.visit(config.HIDE_TIPS);
  cy.get(os.layersDialog.Layers.Tree.STREET_MAP_TILES, {timeout: 15000}).should('be.visible');
});

Cypress.Commands.add('upload', function(fileName) {
  cy.get(os.Application.FILE_INPUT).then(function(subject) {
    cy.fixture(fileName, 'base64')
        .then(Cypress.Blob.base64StringToBlob)
        .then(function(blob) {
          var el = subject[0];
          var testFile = new File([blob], fileName);
          var dataTransfer = new DataTransfer();
          dataTransfer.items.add(testFile);
          el.files = dataTransfer.files;
        });
  });
});

Cypress.Commands.add('rightClick', {prevSubject: 'element'}, function(subject) {
  cy.wrap(subject).trigger('contextmenu');
});
