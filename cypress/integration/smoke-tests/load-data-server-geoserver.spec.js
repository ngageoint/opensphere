/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var dialogs = require('../../support/selectors/dialogs.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var settings = require('../../support/selectors/settings.js');
var shared = require('../../support/selectors/shared.js');

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
    cy.get(core.statusBar.SERVERS_BUTTON).click();
    cy.get(settings.settingsDialog.Tabs.dataServers.ADD_SERVER_BUTTON).click();
    cy.get(imports.importURLDialog.ENTER_A_URL_INPUT)
        .type('https://gdp-geoserver.dev.dev.east.paas.geointservices.io/geoserver/ows');
    cy.get(imports.importURLDialog.NEXT_BUTTON).click();
    cy.get(dialogs.addGeoServerDialog.TITLE_INPUT).clear();
    cy.get(dialogs.addGeoServerDialog.TITLE_INPUT).type('GDP GeoServer');
    cy.get(dialogs.addGeoServerDialog.SAVE_BUTTON).click();
    cy.get(settings.settingsDialog.Tabs.dataServers.SERVER_1)
        .should('contain', 'GDP GeoServer');
    cy.get(settings.settingsDialog.Tabs.dataServers.SERVER_1)
        .find(settings.settingsDialog.Tabs.dataServers.SERVER_ONLINE_BADGE)
        .should('be.visible');
    cy.get(settings.settingsDialog.DIALOG_CLOSE).click();

    // Load a layer
    cy.get(core.Toolbar.addData.BUTTON).click();
    cy.get(dialogs.addDataDialog.DIALOG).within(function() {
      cy.get(dialogs.addDataDialog.SEARCH_INPUT).type('viirs');
      cy.get(shared.Tree.ROW_1).should('contain', 'VIIRS Detection');
      cy.get(shared.Tree.ROW_1)
          .find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH)
          .should('have.class', dialogs.addDataDialog.Tree.LAYER_IS_OFF_CLASS);
      cy.get(shared.Tree.ROW_1)
          .find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH)
          .click();
      cy.get(shared.Tree.ROW_1)
          .find(dialogs.addDataDialog.Tree.LAYER_TOGGLE_SWITCH)
          .should('have.class', dialogs.addDataDialog.Tree.LAYER_IS_ON_CLASS);
      cy.get(dialogs.addDataDialog.CLOSE_BUTTON).click();
    });

    cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');
    cy.get(shared.Tree.ROW_4)
        .should('contain', 'VIIRS Detection Features (0)');

    // Import and activate a query area
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.MOST_RECENT).click();
    cy.get(layers.areasTab.TAB).click();
    cy.get(layers.areasTab.Import.BUTTON).click();
    cy.upload('smoke-tests/load-data-server-geoserver/test-area.geojson');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.geoJSONAreaImportDialog.Tabs.areaOptions.TITLE_COLUMN_INPUT).should('be.visible');
    cy.get(imports.geoJSONAreaImportDialog.DONE_BUTTON).click();
    cy.get(shared.Tree.ROW_1).should('contain', 'temp area 1');
    cy.get(shared.Tree.ROW_1).rightClick();
    cy.get(layers.areasTab.Tree.contextMenu.ZOOM).click();
    cy.get(shared.Tree.ROW_1).rightClick();
    cy.get(layers.areasTab.Tree.contextMenu.Query.LOAD).click();
    cy.get(layers.layersTab.TAB).click();
    cy.get(shared.Tree.ROW_4).should('contain', 'VIIRS Detection');
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

    // Open the timeline and animate the data (view window animates)
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('be.visible');
    cy.get(core.Timeline.HISTOGRAM_POINTS).should('be.visible');
    cy.get(core.Timeline.VIEW_WINDOW).invoke('position').then(function(elementPosition) {
      cy.get(core.Timeline.PLAY_BUTTON).click();
      cy.get(core.Timeline.VIEW_WINDOW).invoke('position').should('not.equal', elementPosition);
    });
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('not.exist');

    // Open the timeline and animate the data (feature count changes)
    cy.get(shared.Tree.ROW_4)
        .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
        .invoke('text')
        .then(function(featureCount) {
          cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force: true}); // TODO: Remove force: true workaround after #732 fixed
          cy.get(core.Timeline.PANEL).should('be.visible');
          cy.get(core.Timeline.PLAY_BUTTON).click();
          cy.get(core.Timeline.PAUSE_BUTTON).click();
          cy.get(shared.Tree.ROW_4)
              .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
              .invoke('text')
              .should('match', new RegExp('\\([0-9]\\d{0,3}\\/' + featureCount + '\\)'));
        });
  });
});
