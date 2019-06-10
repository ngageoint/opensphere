/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Add ARCGIS server', function() {
  before('Login', function() {
    cy.login();
    cy.server();

    cy.route('**/OpenData/MapServer', 'fx:/smoke-tests/load-data-server-arcgis/mapserver.stub.xml')
        .as('getServer');
    cy.route('**/OpenData/MapServer?f=json', 'fx:/smoke-tests/load-data-server-arcgis/mapserverf=json.stub.json')
        .as('getLayers');
    cy.route('**/OpenData/MapServer/layers?f=json', 'fx:/smoke-tests/load-data-server-arcgis/layersf=json.stub.json')
        .as('getLayerDetails');
    cy.route('**/OpenData/MapServer/export?F=image*', 'fx:/smoke-tests/load-data-server-arcgis/export.png')
        .as('enableLayer');
    cy.route('POST', '**/OpenData/MapServer/5/query', 'fx:/smoke-tests/load-data-server-arcgis/query-1.stub.json')
        .as('getFeatureList');
  });

  it('Load data from ARCGIS server', function() {
    // Add a server
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.ADD_SERVER_BUTTON).click();
    cy.get(os.importURLDialog.ENTER_A_URL_INPUT)
        .type('https://ags.auroragov.org/aurora/rest/services/OpenData/MapServer');
    cy.get(os.importURLDialog.NEXT_BUTTON).click();
    cy.get(os.addArcServerDialog.TITLE_INPUT).clear();
    cy.get(os.addArcServerDialog.TITLE_INPUT).type('Aurora ArcGIS Server');
    cy.get(os.addArcServerDialog.SAVE_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('contain', 'Aurora ArcGIS Server');
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(os.settingsDialog.Tabs.dataServers.SERVER_ONLINE_BADGE_WILDCARD)
        .should('be.visible');
    cy.get(os.settingsDialog.DIALOG_CLOSE).click();

    // Load a layer
    cy.get(os.Toolbar.addData.BUTTON).click();
    cy.get(os.addDataDialog.SEARCH_INPUT).type('fire station');
    cy.get(os.addDataDialog.Tree.LAYER_1).should('contain', 'Fire Stations');
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_OFF_CLASS_WILDCARD);
    cy.get(os.addDataDialog.Tree.LAYER_1).find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD).click();
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_ON_CLASS_WILDCARD);
    cy.get(os.addDataDialog.CLOSE_BUTTON).click();
    cy.get(os.addDataDialog.DIALOG).should('not.exist');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'Fire Stations Features (0)');

    // Import and activate a query area
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.Areas.Import.BUTTON).click();
    cy.upload('smoke-tests/load-data-server-arcgis/test-area.geojson');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.geoJSONAreaImportDialog.Tabs.areaOptions.TITLE_COLUMN_INPUT).should('be.visible');
    cy.get(os.geoJSONAreaImportDialog.DONE_BUTTON).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).should('contain', 'temp area 5');
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Tabs.Areas.Tree.contextMenu.menuOptions.ZOOM).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Tabs.Areas.Tree.contextMenu.menuOptions.Query.LOAD).click(); // THIS LINE CAUSES TWO REQUESTS TO BE SENT
    cy.wait(400);
    cy.route('POST', '**/OpenData/MapServer/5/query', 'fx:/smoke-tests/load-data-server-arcgis/query-2.stub.json')
        .as('getFeatureDetails');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'Fire Station');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .should('not.contain', 'Loading...'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .should('not.contain', '(0)'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.imageComparison('features loaded');

    // Clean up
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('not.contain', 'Fire Stations Features');
    cy.imageComparison('features removed');
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.Application.PAGE).type('v');
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1)
        .find(os.layersDialog.Tabs.Areas.Tree.REMOVE_AREA_BUTTON_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).should('not.contain', 'temp area 5');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(os.settingsDialog.Tabs.dataServers.DELETE_SERVER_BUTTON_WILDCARD)
        .click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('not.contain', 'Aurora ArcGIS Server');
    cy.get(os.settingsDialog.CLOSE_BUTTON).click();
  });
});
