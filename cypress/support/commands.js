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
var addMatchImageSnapshotCommand = require('cypress-image-snapshot/command')
    .addMatchImageSnapshotCommand;

addMatchImageSnapshotCommand({
  customDiffConfig: {threshold: 0.2},
  failureThreshold: 0.0005,
  failureThresholdType: 'percent',
  customSnapshotsDir: 'cypress/comparisons',
  blackout: [os.Toolbar.PANEL,
    os.statusBar.PANEL,
    '.ol-overviewmap',
    os.Map.ATTRIBUTION,
    os.layersDialog.DIALOG,
    '.ol-zoom',
    os.Map.ROTATION_BUTTON,
    os.Map.MAP_MODE_BUTTON]
});

Cypress.Commands.add('imageComparison', function(name) {
  cy.wait(2500);
  cy.matchImageSnapshot(name);
});

Cypress.Commands.add('login', function(clearLocalStorage) {
  // allows the tester to toggle reload off temporarily
  clearLocalStorage = clearLocalStorage || true;

  if (clearLocalStorage) {
    indexedDB.deleteDatabase(config.IndexedDB.FILES);
    indexedDB.deleteDatabase(config.IndexedDB.SETTINGS);
  }
  cy.visit(config.HIDE_TIPS);
  cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES, {timeout: 15000}).should('be.visible');
});

Cypress.Commands.add('upload', function(fileName) {
  cy.get(os.Application.HIDDEN_FILE_INPUT).then(function(subject) {
    cy.fixture(fileName, 'base64')
        .then(Cypress.Blob.base64StringToBlob)
        .then(function(blob) {
          var el = subject[0];
          var testFile = new File([blob], fileName);
          var dataTransfer = new DataTransfer();
          dataTransfer.items.add(testFile);
          el.files = dataTransfer.files;
          return cy.wrap(subject).trigger('change', {force: true});
        });
  });
});

Cypress.Commands.add('rightClick', {prevSubject: 'element'}, function(subject) {
  cy.wrap(subject).trigger('contextmenu');
});
