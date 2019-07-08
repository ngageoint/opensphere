/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

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
    cy.get(os.Toolbar.Date.INPUT).should('not.have.value', '2019-01-27');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'VIIRS Detection Features');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'VIIRS Detection Tiles');
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'test exclude area');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'test include area');
    cy.get(os.layersDialog.Tabs.Filters.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();

    // Test
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-geoserver/test-state-geoserver_state.xml');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importStateDialog.DIALOG).should('be.visible');
    cy.get(os.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(os.importStateDialog.OK_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT).should('have.value', '2019-01-27');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', '+016');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4, {timeout: 8000})
        .should('contain', 'VIIRS Detection Features (19)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.imageComparison('features loaded');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Server.contextMenu.menuOptions.FEATURE_ACTIONS).click();
    cy.get(os.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(os.featureActionsDialog.DIALOG).should('contain', 'high confidence');
    cy.get(os.featureActionsDialog.DIALOG_CLOSE).click();
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).should('contain', 'test exclude area');
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_2).should('contain', 'test include area');
  });
});
