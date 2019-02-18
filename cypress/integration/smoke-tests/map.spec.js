/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Map controls', function() {
  before('Login', function() {
    cy.login();
  });

  it('Map mode (3D/2D)', function() {
    // Setup
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
    cy.get(os.Map.CANVAS_3D).should('be.visible');
    // Not checking the visibility for 2D as it's always visible (it just stops rendering)

    // Test
    cy.get(os.Map.MAP_MODE_BUTTON).click();
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.Map.CANVAS_2D).should('be.visible');
    cy.get(os.Map.CANVAS_3D).should('not.be.visible');

    // Clean up
    cy.get(os.Map.MAP_MODE_BUTTON).click();
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
    cy.get(os.Map.CANVAS_3D).should('be.visible');
    // Not checking the visibility for 2D as it's always visible (it just stops rendering)
  });

  describe('3D Tests', function() {
    before('Ensure map is in 3D mode', function() {
      cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
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

    it('Reset orientation', function() {
      // Setup
      cy.get(os.Application.PAGE).type('v');
      cy.get(os.Map.ROTATION_BUTTON)
          .should('have.attr', 'style', 'transform: rotate(6.28319rad);');
      cy.get(os.Map.CANVAS_3D).invoke('attr', 'contenteditable', true);

      // Test
      cy.get(os.Map.CANVAS_3D)
          .type('{shift}{rightarrow}')
          .type('{shift}{rightarrow}')
          .type('{shift}{rightarrow}')
          .type('{shift}{rightarrow}')
          .type('{shift}{rightarrow}')
          .type('{shift}{rightarrow}');
      cy.get(os.Map.ROTATION_BUTTON)
          .should('not.have.attr', 'style', 'transform: rotate(6.28319rad);');
      cy.get(os.Map.ROTATION_BUTTON).click();
      cy.get(os.Map.ROTATION_BUTTON)
          .should('have.attr', 'style', 'transform: rotate(6.28319rad);');
      cy.get(os.Map.CANVAS_3D)
          .type('{shift}{leftarrow}')
          .type('{shift}{leftarrow}')
          .type('{shift}{leftarrow}')
          .type('{shift}{leftarrow}')
          .type('{shift}{leftarrow}')
          .type('{shift}{leftarrow}');
      cy.get(os.Map.ROTATION_BUTTON)
          .should('not.have.attr', 'style', 'transform: rotate(6.28319rad);');

      // Clean up
      cy.get(os.Application.PAGE).type('v');
    });
  });

  describe('2D Tests', function() {
    before('Ensure map is in 2D mode', function() {
      cy.get(os.Map.MAP_MODE_BUTTON).click();
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

  after('Ensure map is in 3D mode', function() {
    cy.get(os.Map.MAP_MODE_BUTTON).click();
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
  });
});
