/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Add GeoServer', function() {
  before('Login', function() {
    cy.login();
    cy.server();
    cy.route('**/geoserver/ows', 'fx:/smoke-tests/load-data-server-geoserver/ows.stub.xml')
        .as('getServer');
    cy.route('**/geoserver/ows?service=WMS**',
        'fx:/smoke-tests/load-data-server-geoserver/owsservice=wms.stub.xml')
        .as('getWMSCapabilities');
    cy.route('**/geoserver/ows?service=WFS**',
        'fx:/smoke-tests/load-data-server-geoserver/owsservice=wfs.stub.xml')
        .as('getWFSCapabilities');
    cy.route('**/geoserver/wfs?SERVICE=WFS**',
        'fx:/smoke-tests/load-data-server-geoserver/wfsservice=wfs.stub.xml')
        .as('getLayer');
    cy.route('POST', '**/geoserver/wfs',
        'fx:/smoke-tests/load-data-server-geoserver/wfs.stub.xml')
        .as('getLayerDetails');
  });

  it('Load data from GeoServer', function() {
    // Add a server
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.ADD_SERVER_BUTTON).click();
    cy.get(os.importURLDialog.ENTER_A_URL_INPUT)
        .type('https://gdp-geoserver.dev.dev.east.paas.geointservices.io/geoserver/ows');
    cy.get(os.importURLDialog.NEXT_BUTTON).click();
    cy.get(os.addGeoServerDialog.TITLE_INPUT).clear();
    cy.get(os.addGeoServerDialog.TITLE_INPUT).type('GDP GeoServer');
    cy.get(os.addGeoServerDialog.SAVE_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('contain', 'GDP GeoServer');
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(os.settingsDialog.Tabs.dataServers.SERVER_ONLINE_BADGE_WILDCARD)
        .should('be.visible');
    cy.get(os.settingsDialog.DIALOG_CLOSE).click();

    // Load a layer
    cy.get(os.Toolbar.addData.BUTTON).click();
    cy.get(os.addDataDialog.SEARCH_INPUT).type('viirs');
    cy.get(os.addDataDialog.Tree.LAYER_1).should('contain', 'VIIRS Detection');
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_OFF_CLASS_WILDCARD);
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD)
        .click();
    cy.get(os.addDataDialog.Tree.LAYER_1)
        .find(os.addDataDialog.Tree.LAYER_TOGGLE_SWITCH_WILDCARD)
        .should('have.class', os.addDataDialog.Tree.LAYER_IS_ON_CLASS_WILDCARD);
    cy.get(os.addDataDialog.CLOSE_BUTTON).click();
    cy.get(os.addDataDialog.DIALOG).should('not.exist');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .should('contain', 'VIIRS Detection Features (0)');

    // Import and activate a query area
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Server.contextMenu.menuOptions.MOST_RECENT).click();
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.Areas.Import.BUTTON).click();
    cy.upload('smoke-tests/load-data-server-geoserver/test-area.geojson');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.geoJSONAreaImportDialog.Tabs.areaOptions.TITLE_COLUMN_INPUT).should('be.visible');
    cy.get(os.geoJSONAreaImportDialog.DONE_BUTTON).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).should('contain', 'temp area 1');
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Tabs.Areas.Tree.contextMenu.menuOptions.ZOOM).click();
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).rightClick();
    cy.get(os.layersDialog.Tabs.Areas.Tree.contextMenu.menuOptions.Query.LOAD).click();
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.STREET_MAP_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.mapLayer.WORLD_IMAGERY_TILES)
        .find(os.layersDialog.Tabs.Layers.Tree.LAYER_TOGGLE_CHECKBOX_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'VIIRS Detection');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD, {timeout: 8000})
        .should('not.contain', 'Loading...'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .should('not.contain', '(0)'); // wait for feature count value to stabilize
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD, {timeout: 8000})
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.wait(1500);
    cy.matchImageSnapshot('features loaded', {
      failureThreshold: 0.01, // Minor rendering variation GUI vs CLI
      failureThresholdType: 'percent'
    });

    // Open the timeline and animate the data (view window animates)
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('be.visible');
    cy.get(os.Timeline.HISTOGRAM_POINTS).should('be.visible');
    cy.get(os.Timeline.VIEW_WINDOW).invoke('position').then(function(elementPosition) {
      cy.get(os.Timeline.PLAY_BUTTON).click();
      cy.get(os.Timeline.VIEW_WINDOW).invoke('position').should('not.equal', elementPosition);
    });
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('not.exist');

    // Open the timeline and animate the data (feature count changes)
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .invoke('text')
        .then(function(featureCount) {
          cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
          cy.get(os.Timeline.PANEL).should('be.visible');
          cy.get(os.Timeline.PLAY_BUTTON).click();
          cy.get(os.Timeline.PAUSE_BUTTON).click();
          cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
              .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
              .invoke('text')
              .should('match', new RegExp('\\([0-9]\\d{0,3}\\/' + featureCount + '\\)'));
        });

    // Clean up
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('not.exist');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.FEATURE_COUNT_TEXT_WILDCARD)
        .invoke('text')
        .should('match', /\([1-9]\d{0,3}\)/); // Any number 1-9999, surrounded by ()
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD)
        .click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .should('not.contain', 'VIIRS Detection Features');
    cy.wait(1500);
    cy.matchImageSnapshot('features removed');
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
    cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_1).should('not.contain', 'temp area 1');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(os.settingsDialog.Tabs.dataServers.DELETE_SERVER_BUTTON_WILDCARD).click();
    cy.get(os.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('not.contain', 'GDP GeoServer');
    cy.get(os.settingsDialog.CLOSE_BUTTON).click();
  });
});
