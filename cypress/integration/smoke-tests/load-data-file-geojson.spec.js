/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Geojson import', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data from geojson', function() {
    // Upload a file
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-data-file-geojson/test-features.geojson');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importGeoJSONDialog.DIALOG).should('be.visible');
    cy.get(os.importGeoJSONDialog.NEXT_BUTTON).click();
    cy.get(os.importGeoJSONDialog.DONE_BUTTON).click();

    // Load a layer
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .should('contain', 'smoke-tests/load-data-file-geojson/test-features.geojson Features (291)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.MOST_RECENT).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.GO_TO).click();

    // Open the timeline and animate the data (view window animates)
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('be.visible');
    cy.get(os.Timeline.HISTOGRAM_POINTS).should('be.visible');
    cy.get(os.Timeline.VIEW_WINDOW).invoke('position').then(function(elementPosition) {
      cy.get(os.Timeline.PLAY_BUTTON).click();
      cy.get(os.Timeline.VIEW_WINDOW).invoke('position').should('not.equal', elementPosition);
    });
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('not.exist');

    // Open the timeline and animate the data (feature count changes)
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('be.visible');
    cy.get(os.Timeline.PLAY_BUTTON).click();
    cy.get(os.Timeline.PAUSE_BUTTON).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .invoke('text')
        .should('match', new RegExp('\\([0-9]\\d{0,3}\\/' + '291\\)'));

    // Clean up
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('not.exist');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .should('contain', 'smoke-tests/load-data-file-geojson/test-features.geojson Features (291)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'smoke-tests/load-data-file-test-features.geojson Features');
    cy.get(os.Application.PAGE).type('v');
  });
});
