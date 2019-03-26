/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Toolbar right', function() {
  before('Login', function() {
    cy.login();
  });

  describe('Save menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(os.Toolbar.Save.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.Save.Menu.BUTTON).click();
      cy.get(os.Toolbar.Save.Menu.PANEL).should('be.visible');
      cy.get(os.Toolbar.Save.Menu.menuOptions.STATE).should('be.visible');
      cy.get(os.Toolbar.Save.Menu.menuOptions.SCREENSHOT).should('be.visible');

      // Clean up
      cy.get(os.Toolbar.Save.Menu.BUTTON).click();
      cy.get(os.Toolbar.Save.Menu.PANEL).should('not.be.visible');
    });

    it('Save state (from save menu)', function() {
      // Setup
      cy.get(os.saveStateDialog.DIALOG).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.Save.Menu.BUTTON).click();
      cy.get(os.Toolbar.Save.Menu.menuOptions.STATE).click();
      cy.get(os.saveStateDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(os.saveStateDialog.DIALOG_CLOSE).click();
      cy.get(os.saveStateDialog.DIALOG).should('not.be.visible');
      cy.get(os.Toolbar.Save.Menu.PANEL).should('not.be.visible');
    });

    // TODO: Skipping test of screenshot.
    // https://github.com/cypress-io/cypress/issues/949
    it.skip('Screenshot', function() {
      // Setup

      // Test

      // Clean up
    });
  });

  describe('State menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(os.Toolbar.States.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.States.Menu.BUTTON).click();
      cy.get(os.Toolbar.States.Menu.PANEL).should('be.visible');
      cy.get(os.Toolbar.States.Menu.menuOptions.IMPORT_STATE).should('be.visible');
      cy.get(os.Toolbar.States.Menu.menuOptions.SAVE_STATE).should('be.visible');
      cy.get(os.Toolbar.States.Menu.menuOptions.DISABLE_STATES).should('be.visible');

      // Clean up
      cy.get(os.Toolbar.States.Menu.BUTTON).click();
      cy.get(os.Toolbar.States.Menu.PANEL).should('not.be.visible');
    });

    it('Import state', function() {
      // Setup
      cy.get(os.importDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.States.Menu.BUTTON).click();
      cy.get(os.Toolbar.States.Menu.menuOptions.IMPORT_STATE).click();
      cy.get(os.importDataDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(os.importDataDialog.CANCEL_BUTTON).click();
      cy.get(os.importDataDialog.DIALOG).should('not.exist');
      cy.get(os.Toolbar.States.Menu.PANEL).should('not.exist');
    });

    it('Save state (from state menu)', function() {
      // Setup
      cy.get(os.saveStateDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.States.Menu.BUTTON).click();
      cy.get(os.Toolbar.States.Menu.menuOptions.SAVE_STATE).click();
      cy.get(os.saveStateDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(os.saveStateDialog.CANCEL_BUTTON).click();
      cy.get(os.saveStateDialog.DIALOG).should('not.exist');
      cy.get(os.Toolbar.States.Menu.PANEL).should('not.be.visible');
    });

    it('Disable state', function() {
      // Setup
      cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
      cy.get(os.importDataDialog.DIALOG).should('be.visible');
      cy.upload('smoke-tests/load-state-file-test-state_state.xml');
      cy.get(os.importDataDialog.NEXT_BUTTON).click();
      cy.get(os.importStateDialog.DIALOG).should('be.visible');
      cy.get(os.importStateDialog.CLEAR_CHECKBOX).check();
      cy.get(os.importStateDialog.OK_BUTTON).click();
      cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'Police Stations Features (3)');
      cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_5).should('contain', 'Fire Hydrants Features (747)');
      cy.get(os.layersDialog.Tabs.Areas.TAB).click();
      cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_2).should('contain', 'Aurora Hydrant Include');
      cy.get(os.layersDialog.Tabs.Areas.Tree.AREA_4).should('contain', 'Aurora Police Include');
      cy.get(os.layersDialog.Tabs.Filters.TAB).click();
      cy.get(os.layersDialog.Tabs.Filters.Tree.FILTER_2).should('contain', 'East Hydrants');

      // Test
      cy.get(os.Toolbar.States.Menu.BUTTON).click();
      cy.get(os.Toolbar.States.Menu.menuOptions.DISABLE_STATES).click();
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Tiles');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Tiles');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fire Hydrants Features');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Police Stations Features');
      cy.get(os.layersDialog.Tabs.Areas.TAB).click();
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Include');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Police Exclude');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Include');
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'Aurora Hydrant Exclude');
      cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
      cy.get(os.layersDialog.Tabs.Filters.TAB).click();
      cy.get(os.layersDialog.DIALOG).should('not.contain', 'East Hydrants');
      cy.get(os.layersDialog.DIALOG).should('contain', 'No results');

      // Clean up
      cy.get(os.layersDialog.Tabs.Layers.TAB).click();
      cy.get(os.Application.PAGE).type('v');
      cy.get(os.Toolbar.Date.INPUT).clear();
      cy.get(os.Toolbar.Date.INPUT).type(Cypress.moment().format('YYYY[-]MM[-]DD'));
      cy.get(os.Toolbar.Date.INPUT).type('{esc}');
    });
  });

  describe('Search tool', function() {
    it('Search provider', function() {
      // Setup
      cy.get(os.Toolbar.Search.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.Search.Menu.BUTTON).click();
      cy.get(os.Toolbar.Search.Menu.PANEL).should('be.visible');
      cy.get(os.Toolbar.Search.Menu.searchTypes.COORDINATES_CHECKBOX).should('be.visible');
      cy.get(os.Toolbar.Search.Menu.searchTypes.LAYERS_CHECKBOX).should('be.visible');

      // Clean up
      cy.get(os.Toolbar.Search.Menu.BUTTON).click();
      cy.get(os.Toolbar.Search.Menu.PANEL).should('not.be.visible');
    });

    it('Search', function() {
      // Setup
      cy.get(os.Toolbar.Search.INPUT).should('be.empty');
      cy.get(os.Toolbar.Search.Results.PANEL).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.Search.INPUT).type('street{enter}');
      cy.get(os.Toolbar.Search.Results.PANEL).should('be.visible');
      cy.get(os.Toolbar.Search.Results.PANEL).should('contain', 'Street Map');
      cy.get(os.Toolbar.Search.Menu.BUTTON).click();
      cy.get(os.Toolbar.Search.Menu.PANEL).should('contain', 'street (All Search Types)');

      // Clean up
      cy.get(os.Toolbar.Search.Menu.BUTTON).click();
      cy.get(os.Toolbar.Search.Menu.PANEL).should('not.be.visible');
      cy.get(os.Toolbar.Search.CLEAR_BUTTON).click();
      cy.get(os.Toolbar.Search.Results.PANEL).should('not.be.visible');
      cy.get(os.Toolbar.Search.INPUT).should('be.empty');
    });
  });

  describe('Support menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(os.Toolbar.Support.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.PANEL).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.ABOUT).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.CONTROLS).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.SHOW_TIPS).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.OPENSPHERE_CAPABILITIES).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.VIEW_ALERTS).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.VIEW_LOG).should('be.visible');
      cy.get(os.Toolbar.Support.Menu.menuOptions.RESET_SETTINGS).should('be.visible');

      // Clean up
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.PANEL).should('not.be.visible');
    });

    it('About', function() {
      // Setup
      cy.get(os.aboutDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.ABOUT).click();
      cy.get(os.aboutDialog.DIALOG).should('be.visible');
      cy.get(os.aboutDialog.DIALOG).should('contain', 'AngularJS');
      cy.get(os.aboutDialog.DIALOG).should('contain', 'Cesium');

      // Clean up
      cy.get(os.aboutDialog.CLOSE_BUTTON).click();
      cy.get(os.aboutDialog.DIALOG).should('not.exist');
    });

    it('Controls', function() {
      // Setup
      cy.get(os.controlsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.CONTROLS).click();
      cy.get(os.controlsDialog.DIALOG).should('be.visible');
      cy.get(os.controlsDialog.DIALOG).should('contain', 'General Controls');
      cy.get(os.controlsDialog.DIALOG).should('contain', '3D Controls');

      // Clean up
      cy.get(os.controlsDialog.DIALOG_CLOSE).click();
      cy.get(os.controlsDialog.DIALOG).should('not.exist');
    });

    it('Onboarding', function() {
      // Setup
      cy.get(os.welcomeToOpenSphereDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.SHOW_TIPS).click();
      cy.get(os.welcomeToOpenSphereDialog.DIALOG).should('be.visible');
      cy.get(os.welcomeToOpenSphereDialog.DIALOG)
          .should('contain', 'OpenSphere is a map-driven analysis tool');

      // Clean up
      cy.get(os.welcomeToOpenSphereDialog.STOP_SHOWING_TIPS_BUTTON).click();
      cy.get(os.welcomeToOpenSphereDialog.DIALOG).should('not.exist');
    });

    it('OpenSphere capabilities', function() {
      // Setup
      cy.get(os.openSphereCapabilitiesDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.OPENSPHERE_CAPABILITIES).click();
      cy.get(os.openSphereCapabilitiesDialog.DIALOG).should('be.visible');
      cy.get(os.openSphereCapabilitiesDialog.Tree.CAPABILITY_2)
          .should('contain', 'Add Data');
      cy.get(os.openSphereCapabilitiesDialog.Tree.CAPABILITY_5).should('contain', 'Map');
      cy.get(os.openSphereCapabilitiesDialog.Tree.CAPABILITY_9).should('contain', 'Tracks');
      cy.get(os.openSphereCapabilitiesDialog.SEARCH_INPUT).should('be.empty');

      // Clean up
      cy.get(os.openSphereCapabilitiesDialog.CLOSE_BUTTON).click();
      cy.get(os.openSphereCapabilitiesDialog.DIALOG).should('not.exist');
    });

    it('Alerts', function() {
      // Setup
      cy.get(os.alertsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.VIEW_ALERTS).click();
      cy.get(os.alertsDialog.DIALOG).should('be.visible');
      cy.get(os.alertsDialog.DIALOG).should('contain', 'There are no alerts to view');

      // Clean up
      cy.get(os.alertsDialog.DIALOG_CLOSE).click();
      cy.get(os.alertsDialog.DIALOG).should('not.exist');
    });

    // https://docs.cypress.io/guides/references/trade-offs.html#Multiple-tabs
    it.skip('View log', function() {
      // Setup

      // Test

      // Clean up
    });

    // Note that this test doesn't reset settings
    it('Reset settings', function() {
      // Setup
      cy.get(os.resetSettingsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(os.Toolbar.Support.Menu.BUTTON).click();
      cy.get(os.Toolbar.Support.Menu.menuOptions.RESET_SETTINGS).click();
      cy.get(os.resetSettingsDialog.DIALOG).should('be.visible');
      cy.get(os.resetSettingsDialog.DIALOG)
          .should('contain', 'Are you sure you want to clear your settings and reload');

      // Clean up
      cy.get(os.resetSettingsDialog.CANCEL_BUTTON).click();
      cy.get(os.resetSettingsDialog.DIALOG).should('not.exist');
    });
  });
});
