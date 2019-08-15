/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var dialogs = require('../../support/selectors/dialogs.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var settings = require('../../support/selectors/settings.js');
var shared = require('../../support/selectors/shared.js');

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
    cy.get(core.statusBar.SERVERS_BUTTON).click();
    cy.get(settings.settingsDialog.Tabs.dataServers.ADD_SERVER_BUTTON).click();
    cy.get(imports.importURLDialog.ENTER_A_URL_INPUT)
        .type('https://ags.auroragov.org/aurora/rest/services/OpenData/MapServer');
    cy.get(imports.importURLDialog.NEXT_BUTTON).click();
    cy.get(dialogs.addArcServerDialog.TITLE_INPUT).clear();
    cy.get(dialogs.addArcServerDialog.TITLE_INPUT).type('Aurora ArcGIS Server');
    cy.get(dialogs.addArcServerDialog.SAVE_BUTTON).click();
    cy.get(settings.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('contain', 'Aurora ArcGIS Server');
    cy.get(settings.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(settings.settingsDialog.Tabs.dataServers.SERVER_ONLINE_BADGE)
        .should('be.visible');
    cy.get(settings.settingsDialog.DIALOG_CLOSE).click();

    // Load a layer
    cy.get(core.Toolbar.addData.BUTTON).click();
    cy.get(dialogs.addDataDialog.DIALOG).within(function() {
      cy.get(dialogs.addDataDialog.SEARCH_INPUT).type('fire station');
      cy.get(shared.Tree.ROW_1).should('contain', 'Fire Stations');
      cy.get(shared.Tree.ROW_1)
          .find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH)
          .should('have.class', dialogs.addDataDialog.Tree.LAYER_IS_OFF_CLASS);
      cy.get(shared.Tree.ROW_1).find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH).click();
      cy.get(shared.Tree.ROW_1)
          .find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH)
          .should('have.class', dialogs.addDataDialog.Tree.LAYER_IS_ON_CLASS);
      cy.get(dialogs.addDataDialog.CLOSE_BUTTON).click();
    });

    cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');
    cy.get(shared.Tree.ROW_4).should('contain', 'Fire Stations Features (0)');

    // Import and activate a query area
    cy.get(layers.areasTab.TAB).click();
    cy.get(layers.areasTab.Import.BUTTON).click();
    cy.upload('smoke-tests/load-data-server-arcgis/test-area.geojson');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.geoJSONAreaImportDialog.Tabs.areaOptions.TITLE_COLUMN_INPUT).should('be.visible');
    cy.get(imports.geoJSONAreaImportDialog.DONE_BUTTON).click();
    cy.get(shared.Tree.ROW_1).should('contain', 'temp area 5');
    cy.get(shared.Tree.ROW_1).rightClick();
    cy.get(layers.areasTab.Tree.contextMenu.ZOOM).click();
    cy.get(shared.Tree.ROW_1).rightClick();
    cy.get(layers.areasTab.Tree.contextMenu.Query.LOAD).click(); // THIS LINE CAUSES TWO REQUESTS TO BE SENT
    cy.wait(400);
    cy.route('POST', '**/OpenData/MapServer/5/query', 'fx:/smoke-tests/load-data-server-arcgis/query-2.stub.json')
        .as('getFeatureDetails');
    cy.get(layers.layersTab.TAB).click();
    cy.get(shared.Tree.ROW_4).should('contain', 'Fire Station');
    cy.get(shared.Tree.ROW_4)
        .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
        .should('not.contain', 'Loading...'); // wait for feature count value to stabilize
    cy.get(shared.Tree.ROW_4)
        .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
        .should('not.contain', '(0)'); // wait for feature count value to stabilize
    cy.get(shared.Tree.ROW_4)
        .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.imageComparison('features loaded');
  });
});
