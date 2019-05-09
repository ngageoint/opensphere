/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Generate heatmap from CSV', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data, then generate heatmap', function() {
    // Setup
    cy.get(os.layersDialog.DIALOG).should('not.contain', '(Image');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Heatmap');

    // Upload a file
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/generate-heatmap/chicago-traffic-counts.csv');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importCSVDialog.DIALOG).should('be.visible');
    cy.get(os.importCSVDialog.NEXT_BUTTON).click();
    cy.get(os.importCSVDialog.NEXT_BUTTON).click();
    cy.get(os.importCSVDialog.NEXT_BUTTON).click();
    cy.get(os.importCSVDialog.Tabs.Options.LAYER_TITLE_INPUT).clear();
    cy.get(os.importCSVDialog.Tabs.Options.LAYER_TITLE_INPUT).type('Chicago Traffic Counts');
    cy.get(os.importCSVDialog.DONE_BUTTON).click();

    // Load a layer
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .should('contain', 'Chicago Traffic Counts Features (1279)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.GO_TO).click();
    cy.wait(1500); // Wait for the go to operation to complete
    cy.matchImageSnapshot('features loaded');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.GENERATE_HEATMAP).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_1).should('contain', 'Image (1)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).should('contain', 'Heatmap - Chicago Traffic Counts');
    cy.matchImageSnapshot('heatmap loaded', {
      failureThreshold: 0.017, // Minor rendering variation GUI vs CLI
      failureThresholdType: 'percent'
    });

    // Clean up
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.imageLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).should('not.contain', 'Heatmap - Chicago Traffic Counts');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Chicago Traffic Counts Features (1279)');
    cy.get(os.Application.PAGE).type('v');
  });
});
