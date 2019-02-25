/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Map controls', function() {
  before('Login', function() {
    cy.login();
  });

  // Note: 3D tests not supported in CI environment
  describe('2D Tests', function() {
    before('Ensure map is in 2D mode', function() {
      cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    });

    it('Map overview', function() {
      // Setup
      cy.get(os.Map.OVERVIEW_MAP).should('be.visible');

      // Test
      cy.get(os.Map.OVERVIEW_MAP_TOGGLE).click();
      cy.get(os.Map.OVERVIEW_MAP).should('not.be.visible');

      // Clean up
      cy.get(os.Map.OVERVIEW_MAP_TOGGLE).click();
      cy.get(os.Map.OVERVIEW_MAP).should('be.visible');
    });

    // TODO: Finish test after mouse interactions with the map are working.
    // https://github.com/cypress-io/cypress/issues/2768
    it.skip('Navigate via overview', function() {
      // Setup
      // <Enter setup steps here>

      // Test
      // <Enter test steps here>

      // Clean up
      // <Enter clean up steps here>
    });

    it('Zoom', function() {
      // Setup
      cy.get(os.Application.PAGE).type('v');
      cy.get(os.statusBar.ZOOM).should('contain', 'Zoom:');

      // Test
      cy.get(os.statusBar.ZOOM).then(function($zoom) {
        var INITIAL_ZOOM = $zoom.text();
        cy.get(os.Map.ZOOM_IN_BUTTON)
            .click()
            .click()
            .click()
            .click()
            .click();
        cy.get(os.statusBar.ZOOM).should('not.contain', INITIAL_ZOOM);
      });

      cy.get(os.statusBar.ZOOM).then(function($zoom) {
        var INITIAL_ZOOM = $zoom.text();
        cy.get(os.Map.ZOOM_OUT_BUTTON)
            .click()
            .click()
            .click()
            .click()
            .click();
        cy.get(os.statusBar.ZOOM).should('not.contain', INITIAL_ZOOM);
      });

      // Clean up
      cy.get(os.Application.PAGE).type('v');
    });
  });
});
