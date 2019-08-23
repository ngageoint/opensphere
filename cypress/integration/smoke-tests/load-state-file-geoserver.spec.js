/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var dialogs = require('../../support/selectors/dialogs.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('Import state file', function() {
  before('Login', function() {
    cy.login();

    cy.server();
    cy.route('**/geoserver/wfs?SERVICE=WFS**', 'fx:/smoke-tests/load-state-file-geoserver/wfsservice.stub.xml')
        .as('getLayer');
    cy.route('POST', '**/geoserver/wfs', 'fx:/smoke-tests/load-state-file-geoserver/wfs.stub.json')
        .as('getFeatures');
  });

  it('Load data from state file', function() {
    // Setup
    cy.get(core.Toolbar.Date.INPUT).should('not.have.value', '2019-01-27');
    cy.get(core.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'VIIRS Detection Features');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'VIIRS Detection Tiles');
    cy.get(layers.areasTab.TAB).click();
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'test exclude area');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'test include area');
    cy.get(layers.filtersTab.TAB).click();
    cy.get(layers.Dialog.DIALOG).should('contain', 'No results');
    cy.get(layers.layersTab.TAB).click();

    // Test
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(imports.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-geoserver/test-state-geoserver_state.xml');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.importStateDialog.DIALOG).should('be.visible');
    cy.get(imports.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(imports.importStateDialog.OK_BUTTON).click();
    cy.get(core.Toolbar.Date.INPUT).should('have.value', '2019-01-27');
    cy.get(core.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(core.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '+016');
    cy.get(shared.Tree.ROW_4)
        .should('contain', 'VIIRS Detection Features (19)');
    cy.imageComparison('features loaded');
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.FEATURE_ACTIONS).click();
    cy.get(dialogs.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(dialogs.featureActionsDialog.DIALOG).should('contain', 'high confidence');
    cy.get(dialogs.featureActionsDialog.DIALOG_CLOSE).click();
    cy.get(layers.areasTab.TAB).click();
    cy.get(shared.Tree.ROW_1).should('contain', 'test exclude area');
    cy.get(shared.Tree.ROW_2).should('contain', 'test include area');
  });
});
