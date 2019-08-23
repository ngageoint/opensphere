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
    cy.get(core.Toolbar.Date.INPUT).should('not.have.value', '2019-01-07');
    cy.get(core.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Police Stations Features');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Fire Hydrants Features');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Police Stations Tiles');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Fire Hydrants Tiles');
    cy.get(layers.areasTab.TAB).click();
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Aurora Hydrant Include');
    cy.get(layers.Dialog.DIALOG).should('not.contain', 'Aurora Police Include');
    cy.get(layers.filtersTab.TAB).click();
    cy.get(layers.Dialog.DIALOG).should('contain', 'No results');
    cy.get(layers.layersTab.TAB).click();

    // Test
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(imports.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-arcgis/test-state-arcgis_state.xml');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.importStateDialog.DIALOG).should('be.visible');
    cy.get(imports.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(imports.importStateDialog.OK_BUTTON).click();
    cy.wait(1000); // TODO: Remove this flaky workaround after https://github.com/cypress-io/cypress/issues/4460 is fixed
    cy.route('POST', '**/OpenData/MapServer/3/query', 'fx:/smoke-tests/load-state-file-arcgis/query-3-2.stub.json')
        .as('getFeatureDetails-13_second');
    cy.route('POST', '**/OpenData/MapServer/234/query', 'fx:/smoke-tests/load-state-file-arcgis/query-234-2.stub.json')
        .as('getFeatureDetails-234_second');
    cy.get(core.Toolbar.Date.INPUT).should('have.value', '2019-01-07');
    cy.get(core.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(core.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '+39');
    cy.get(shared.Tree.ROW_4).should('contain', 'Police Stations Features (3)');
    cy.get(shared.Tree.ROW_5).should('contain', 'Fire Hydrants Features (747)');
    cy.imageComparison('features loaded');
    cy.get(shared.Tree.ROW_5).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.FEATURE_ACTIONS).click();
    cy.get(dialogs.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(dialogs.featureActionsDialog.DIALOG).should('contain', 'Private Hydrant');
    cy.get(dialogs.featureActionsDialog.DIALOG_CLOSE).click();
    cy.get(layers.areasTab.TAB).click();
    cy.get(shared.Tree.ROW_2).should('contain', 'Aurora Hydrant Include');
    cy.get(shared.Tree.ROW_4).should('contain', 'Aurora Police Include');
    cy.get(layers.areasTab.ADVANCED_BUTTON).click();
    cy.get(dialogs.advancedDialog.DIALOG).should('be.visible');
    cy.get(dialogs.advancedDialog.ADVANCED_CHECKBOX).should('be.checked');
    cy.get(dialogs.advancedDialog.DIALOG_CLOSE).click();
    cy.get(layers.filtersTab.TAB).click();
    cy.get(shared.Tree.ROW_2).should('contain', 'East Hydrants');
  });
});
