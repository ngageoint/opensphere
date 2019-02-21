/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Add ARCGIS server', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data from ARCGIS server', function() {
    // Add a server
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Panel.dataServers.ADD_SERVER_BUTTON).click();
    cy.get(os.importURLDialog.ENTER_A_URL_FIELD)
        .type('https://ags.auroragov.org/aurora/rest/services/OpenData/MapServer');
    cy.get(os.importURLDialog.NEXT_BUTTON).click();
    cy.get(os.addArcServerDialog.TITLE_FIELD).clear();
    cy.get(os.addArcServerDialog.TITLE_FIELD).type('Aurora ArcGIS Server');
    cy.get(os.addArcServerDialog.SAVE_BUTTON).click();
    cy.get(os.settingsDialog.Panel.dataServers.SERVER_1)
        .should('contain', 'Aurora ArcGIS Server');
    cy.get(os.settingsDialog.Panel.dataServers.SERVER_1)
        .find(os.settingsDialog.Panel.dataServers.SERVER_ONLINE)
        .should('be.visible');
    cy.get(os.settingsDialog.DIALOG_CLOSE).click();

    // Load a layer
    cy.get(os.Toolbar.addData.BUTTON).click();
    cy.get(os.addDataDialog.SEARCH_FIELD).type('fire station');
    cy.get(os.addDataDialog.Tree.LAYER_1).should('contain', 'Fire Stations');
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_OFF);
    cy.get(os.addDataDialog.Tree.LAYER_1).find(os.addDataDialog.Tree.LAYER_TOGGLE).click();
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_ON);
    cy.get(os.addDataDialog.CLOSE_BUTTON).click();
    cy.get(os.addDataDialog.DIALOG).should('not.exist');
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).should('contain', 'Fire Stations Features (0)');

    // Import and activate a query area
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.Areas.IMPORT_BUTTON).click();
    cy.upload('smoke-tests/load-data-server-arcgis-test-area.geojson');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.geoJSONAreaImportDialog.areaTab.TITLE_COLUMN_FIELD).should('be.visible');
    cy.get(os.geoJSONAreaImportDialog.DONE_BUTTON).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1).should('contain', 'temp area 5');
    cy.get(os.layersDialog.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Areas.contextMenu.ZOOM).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Areas.contextMenu.LOAD).click();
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).should('contain', 'Fire Station');
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.LAYER_FEATURE_COUNT)
        .should('not.contain', 'Loading...'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.LAYER_FEATURE_COUNT)
        .should('not.contain', '(0)'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.LAYER_FEATURE_COUNT)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()

    // Clean up
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.LAYER_FEATURE_COUNT)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Layers.Tree.REMOVE_LAYER)
        .click();
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).should('not.contain', 'Fire Stations Features');
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1).click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1)
        .find(os.layersDialog.Areas.Tree.REMOVE_AREA)
        .click();
    cy.get(os.layersDialog.Areas.Tree.AREA_1).should('not.contain', 'temp area 5');
    cy.get(os.layersDialog.LAYERS_TAB).click();
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Panel.dataServers.SERVER_1)
        .find(os.settingsDialog.Panel.dataServers.DELETE_SERVER)
        .click();
    cy.get(os.settingsDialog.Panel.dataServers.SERVER_1)
        .should('not.contain', 'Aurora ArcGIS Server');
    cy.get(os.settingsDialog.CLOSE_BUTTON).click();
  });
});
