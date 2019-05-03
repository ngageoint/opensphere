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
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.GO_TO).click();
    cy.wait(10000); // Need to wait for the canvas to stabilize TODO: set this to a lower value
    cy.get(os.Map.ZOOM_IN_BUTTON).click(); // TODO: Remove workaround for #510
    cy.wait(2000); // TODO: Remove workaround for #510
    cy.matchImageSnapshot('features loaded');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.GENERATE_HEATMAP).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_1).should('contain', 'Image (1)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).should('contain', 'Heatmap - Chicago Traffic Counts');
    cy.matchImageSnapshot('heatmap loaded', {
      failureThreshold: 0.052,
      failureThresholdType: 'percent'
    });

    // Clean up
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.imageLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_2).should('not.contain', 'Heatmap - Chicago Traffic Counts');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Chicago Traffic Counts Features (1279)');
    cy.get(os.Application.PAGE).type('v');
  });
});
