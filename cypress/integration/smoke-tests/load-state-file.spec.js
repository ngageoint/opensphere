/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Import state file', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data from state file', function() {
    // Setup
    cy.get(os.Toolbar.Date.FIELD).should('not.have.value', '2019-01-07');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
    cy.get(os.Map.MAP_MODE_BUTTON).click();
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.statusBar.COORDINATES).should('contain', 'No coordinate');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Features');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Features');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Tiles');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Tiles');
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Include');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Include');
    cy.get(os.layersDialog.FILTERS_TAB).click();
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.LAYERS_TAB).click();

    // Test
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-test-state_state.xml');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importStateDialog.DIALOG).should('be.visible');
    cy.get(os.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(os.importStateDialog.OK_BUTTON).click();
    cy.get(os.Toolbar.Date.FIELD).should('have.value', '2019-01-07');
    cy.get(os.Map.CANVAS_3D, {timeout: 30000});
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '3D');
    cy.get(os.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(os.statusBar.COORDINATES).should('contain', '+39.7');
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).should('contain', 'Police Stations Features (3)');
    cy.get(os.layersDialog.Layers.Tree.LAYER_5).should('contain', 'Fire Hydrants Features (747)');
    cy.get(os.layersDialog.Layers.Tree.LAYER_5).rightClick();
    cy.get(os.layersDialog.Layers.contextMenu.FEATURE_ACTIONS).click();
    cy.get(os.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(os.featureActionsDialog.DIALOG).should('contain', 'Private Hydrant');
    cy.get(os.featureActionsDialog.DIALOG_CLOSE).click();
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_2).should('contain', 'Aurora Hydrant Include');
    cy.get(os.layersDialog.Areas.Tree.AREA_4).should('contain', 'Aurora Police Include');
    cy.get(os.layersDialog.Areas.ADVANCED_BUTTON).click();
    cy.get(os.advancedDialog.DIALOG).should('be.visible');
    cy.get(os.advancedDialog.ADVANCED_CHECKBOX).should('be.checked');
    cy.get(os.advancedDialog.DIALOG_CLOSE).click();
    cy.get(os.layersDialog.FILTERS_TAB).click();
    cy.get(os.layersDialog.Filters.Tree.FILTER_2).should('contain', 'East Hydrants');

    // Clean up
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_8).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_8)
        .find(os.layersDialog.Layers.Tree.REMOVE_LAYER)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Tiles');
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_7).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_7)
        .find(os.layersDialog.Layers.Tree.REMOVE_LAYER)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Tiles');
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_5).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_5)
        .find(os.layersDialog.Layers.Tree.REMOVE_LAYER)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Features');
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.REMOVE_LAYER)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Features');
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_4).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_4)
        .find(os.layersDialog.Areas.Tree.REMOVE_AREA)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Include');
    cy.get(os.layersDialog.Areas.Tree.AREA_3).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_3)
        .find(os.layersDialog.Areas.Tree.REMOVE_AREA)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Exclude');
    cy.get(os.layersDialog.Areas.Tree.AREA_2).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_2)
        .find(os.layersDialog.Areas.Tree.REMOVE_AREA)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Include');
    cy.get(os.layersDialog.Areas.Tree.AREA_1).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1)
        .find(os.layersDialog.Areas.Tree.REMOVE_AREA)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Exclude');
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.FILTERS_TAB).click();
    cy.get(os.layersDialog.Filters.Tree.FILTER_2).click();
    cy.get(os.layersDialog.Filters.Tree.FILTER_2)
        .find(os.layersDialog.Filters.Tree.REMOVE_FILTER)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'East Hydrants');
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.Application.PAGE).type('v');
    cy.get(os.Toolbar.Date.FIELD).clear();
    cy.get(os.Toolbar.Date.FIELD).type(Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.Date.FIELD).type('{esc}');
    cy.get(os.Toolbar.States.BUTTON).click();
    cy.get(os.Toolbar.States.DISABLE_STATES).click();
  });
});
