/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('Generate heatmap from CSV', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data, then generate heatmap', function() {
    // Setup
    cy.get(layers.Dialog.DIALOG).should('not.contain', '(Image');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Heatmap');

    // Upload a file
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(imports.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/generate-heatmap/chicago-traffic-counts.csv');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.importCSVDialog.DIALOG).should('be.visible');
    cy.get(imports.importCSVDialog.NEXT_BUTTON).click();
    cy.get(imports.importCSVDialog.NEXT_BUTTON).click();
    cy.get(imports.importCSVDialog.NEXT_BUTTON).click();
    cy.get(shared.Options.LAYER_TITLE_INPUT).clear();
    cy.get(shared.Options.LAYER_TITLE_INPUT).type('Chicago Traffic Counts');
    cy.get(imports.importCSVDialog.DONE_BUTTON).click();

    // Load a layer
    cy.get(shared.Tree.ROW_4)
        .should('contain', 'Chicago Traffic Counts Features (1279)');
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.GO_TO).click();
    cy.imageComparison('features loaded');
    cy.get(shared.Tree.ROW_4)
        .find(shared.Tree.ROW_CHECKBOX)
        .click();
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.GENERATE_HEATMAP).click();
    cy.get(shared.Tree.ROW_1).should('contain', 'Image (1)');
    cy.get(shared.Tree.ROW_2).should('contain', 'Heatmap - Chicago Traffic Counts');
    cy.imageComparison('heatmap loaded');
  });
});
