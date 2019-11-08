/// <reference types="Cypress" />
var opensphere = require('../../support/selectors/opensphere.js');

describe('Map controls', function() {
  before('Login', function() {
    cy.login();
  });

  it('Map overview', function() {
    // Setup
    cy.get(opensphere.Map.OVERVIEW_MAP).should('be.visible');

    // Test
    cy.get(opensphere.Map.OVERVIEW_MAP_TOGGLE_BUTTON).click();
    cy.get(opensphere.Map.OVERVIEW_MAP).should('not.be.visible');

    // Clean up
    cy.get(opensphere.Map.OVERVIEW_MAP_TOGGLE_BUTTON).click();
    cy.get(opensphere.Map.OVERVIEW_MAP).should('be.visible');
  });

  it('Navigate via overview - left', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('not.contain', 'No coordinate');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Test
    cy.get(opensphere.Map.OVERVIEW_MAP).click('left');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('left');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('left');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('left');
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-167');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+02.');

    // Cleanup
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');
  });

  it('Navigate via overview - right', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('not.contain', 'No coordinate');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Test
    cy.get(opensphere.Map.OVERVIEW_MAP).click('right');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('right');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('right');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('right');
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+167');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+02.');

    // Cleanup
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');
  });

  it('Navigate via overview - top', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('not.contain', 'No coordinate');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Test
    cy.get(opensphere.Map.OVERVIEW_MAP).click('top');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('top');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('top');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('top');
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+65');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Cleanup
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');
  });

  it('Navigate via overview - bottom', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('not.contain', 'No coordinate');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Test
    cy.get(opensphere.Map.OVERVIEW_MAP).click('bottom');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('bottom');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('bottom');
    cy.get(opensphere.Map.OVERVIEW_MAP).click('bottom');
    cy.get(opensphere.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-63');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');

    // Clean up
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '+00.');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '-000.');
  });

  it('Context menu items', function() {
    cy.get(opensphere.Map.CANVAS_2D).rightclick();
    cy.get(opensphere.Map.contextMenu.PANEL).should('be.visible');
    cy.get(opensphere.Map.contextMenu.RESET_VIEW).should('be.visible');
    cy.get(opensphere.Map.contextMenu.RESET_ROTATION).should('be.visible');
    cy.get(opensphere.Map.contextMenu.TOGGLE_2D_3D_VIEW).should('be.visible');
    cy.get(opensphere.Map.contextMenu.SHOW_LEGEND).should('be.visible');
    cy.get(opensphere.Map.contextMenu.CLEAR_SELECTION).should('be.visible');
    cy.get(opensphere.Map.contextMenu.BACKGROUND_COLOR).should('be.visible');
    cy.get(opensphere.Map.contextMenu.COPY_COORDINATES).should('be.visible');
    cy.get(opensphere.Map.contextMenu.CREATE_BUFFER_REGION).should('be.visible');
    cy.get(opensphere.Map.contextMenu.SUN_MOON_INFO).should('be.visible');
    cy.get(opensphere.Map.contextMenu.CREATE_PLACE).should('be.visible');
    cy.get(opensphere.Map.contextMenu.CREATE_TEXT_BOX).should('be.visible');
    cy.get(opensphere.Map.contextMenu.QUICK_ADD_PLACES).should('be.visible');
  });

  it('Zoom via buttons', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.ZOOM_TEXT).should('contain', 'Zoom:');

    // Test
    cy.get(opensphere.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(opensphere.Map.ZOOM_IN_BUTTON)
          .click()
          .click()
          .click()
          .click()
          .click();
      cy.get(opensphere.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });

    cy.get(opensphere.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(opensphere.Map.ZOOM_OUT_BUTTON)
          .click()
          .click()
          .click()
          .click()
          .click();
      cy.get(opensphere.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });
  });

  it('Zoom via double click', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');

    // Test
    cy.get(opensphere.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(opensphere.Map.CANVAS_2D)
          .dblclick()
          .dblclick()
          .dblclick()
          .dblclick()
          .dblclick();
      cy.get(opensphere.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });

    cy.get(opensphere.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(opensphere.Application.PAGE).type('{ctrl}', {release: false});
      cy.get(opensphere.Map.CANVAS_2D)
          .dblclick()
          .dblclick()
          .dblclick()
          .dblclick()
          .dblclick();
      cy.get(opensphere.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });
  });
});
