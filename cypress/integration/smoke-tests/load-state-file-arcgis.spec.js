/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Import state file', function() {
  before('Login', function() {
    cy.login();

    cy.server();
    cy.route('**/OpenData/MapServer/export*', 'fx:/smoke-tests/load-state-file-arcgis/export.stub.png')
        .as('getPNG');
    cy.route('**/OpenData/MapServer/3?f=json', 'fx:/smoke-tests/load-state-file-arcgis/3f=json.stub.json')
        .as('getLayerDetails-3');
    cy.route('**/OpenData/MapServer/234?f=json', 'fx:/smoke-tests/load-state-file-arcgis/234f=json.stub.json')
        .as('getLayerDetails-234');
    cy.route('POST', '**/OpenData/MapServer/3/query', 'fx:/smoke-tests/load-state-file-arcgis/query-3-1.stub.json')
        .as('getFeatureList-3_first');
    cy.route('POST', '**/OpenData/MapServer/234/query', 'fx:/smoke-tests/load-state-file-arcgis/query-234-1.stub.json')
        .as('getFeatureList-234_first');
  });

  it('Load data from state file', function() {
    // Setup
    cy.get(os.Toolbar.Date.INPUT).should('not.have.value', '2019-01-07');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Features');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Features');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Tiles');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Tiles');
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Include');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Include');
    cy.get(os.layersDialog.Tabs.Filters.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();

    // Test
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-arcgis/test-state-arcgis_state.xml');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importStateDialog.DIALOG).should('be.visible');
    cy.get(os.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(os.importStateDialog.OK_BUTTON).click();
    cy.wait(1400);
    cy.route('POST', '**/OpenData/MapServer/3/query', 'fx:/smoke-tests/load-state-file-arcgis/query-3-2.stub.json')
        .as('getFeatureDetails-13_second');
    cy.route('POST', '**/OpenData/MapServer/234/query', 'fx:/smoke-tests/load-state-file-arcgis/query-234-2.stub.json')
        .as('getFeatureDetails-234_second');
    cy.get(os.Toolbar.Date.INPUT).should('have.value', '2019-01-07');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', '+39');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'Police Stations Features (3)', {timeout: 8000});
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_5).should('contain', 'Fire Hydrants Features (747)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.wait(1000);
    cy.imageComparison('features loaded');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_5).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Server.contextMenu.menuOptions.FEATURE_ACTIONS).click();
    cy.get(os.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(os.featureActionsDialog.DIALOG).should('contain', 'Private Hydrant');
    cy.get(os.featureActionsDialog.DIALOG_CLOSE).click();
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_2).should('contain', 'Aurora Hydrant Include');
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_4).should('contain', 'Aurora Police Include');
    cy.get(os.layersDialog.Tabs.Areas.ADVANCED_BUTTON).click();
    cy.get(os.advancedDialog.DIALOG).should('be.visible');
    cy.get(os.advancedDialog.ADVANCED_CHECKBOX).should('be.checked');
    cy.get(os.advancedDialog.DIALOG_CLOSE).click();
    cy.get(os.layersDialog.Tabs.Filters.TAB).click();
    cy.get(os.layersDialog.Tabs.Filters.Tree.FILTER_2).should('contain', 'East Hydrants');
  });
});
