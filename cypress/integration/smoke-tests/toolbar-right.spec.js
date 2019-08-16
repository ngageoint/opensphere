/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var dialogs = require('../../support/selectors/dialogs.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('Toolbar right', function() {
  before('Login', function() {
    cy.login();
  });

  describe('Save menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(core.Toolbar.Save.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.Save.Menu.BUTTON).click();
      cy.get(core.Toolbar.Save.Menu.PANEL).should('be.visible');
      cy.get(core.Toolbar.Save.Menu.STATE).should('be.visible');
      cy.get(core.Toolbar.Save.Menu.SCREENSHOT).should('be.visible');

      // Clean up
      cy.get(core.Toolbar.Save.Menu.BUTTON).click();
      cy.get(core.Toolbar.Save.Menu.PANEL).should('not.be.visible');
    });

    it('Save state (from save menu)', function() {
      // Setup
      cy.get(dialogs.saveStateDialog.DIALOG).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.Save.Menu.BUTTON).click();
      cy.get(core.Toolbar.Save.Menu.STATE).click();
      cy.get(dialogs.saveStateDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.saveStateDialog.DIALOG_CLOSE).click();
      cy.get(dialogs.saveStateDialog.DIALOG).should('not.be.visible');
      cy.get(core.Toolbar.Save.Menu.PANEL).should('not.be.visible');
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
      cy.get(core.Toolbar.States.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.States.Menu.BUTTON).click();
      cy.get(core.Toolbar.States.Menu.PANEL).should('be.visible');
      cy.get(core.Toolbar.States.Menu.IMPORT_STATE).should('be.visible');
      cy.get(core.Toolbar.States.Menu.SAVE_STATE).should('be.visible');
      cy.get(core.Toolbar.States.Menu.DISABLE_STATES).should('be.visible');

      // Clean up
      cy.get(core.Toolbar.States.Menu.BUTTON).click();
      cy.get(core.Toolbar.States.Menu.PANEL).should('not.be.visible');
    });

    it('Import state', function() {
      // Setup
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.States.Menu.BUTTON).click();
      cy.get(core.Toolbar.States.Menu.IMPORT_STATE).click();
      cy.get(imports.importDataDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(imports.importDataDialog.CANCEL_BUTTON).click();
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');
      cy.get(core.Toolbar.States.Menu.PANEL).should('not.exist');
    });

    it('Save state (from state menu)', function() {
      // Setup
      cy.get(dialogs.saveStateDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.States.Menu.BUTTON).click();
      cy.get(core.Toolbar.States.Menu.SAVE_STATE).click();
      cy.get(dialogs.saveStateDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.saveStateDialog.CANCEL_BUTTON).click();
      cy.get(dialogs.saveStateDialog.DIALOG).should('not.exist');
      cy.get(core.Toolbar.States.Menu.PANEL).should('not.be.visible');
    });

    it('Disable state', function() {
<<<<<<< HEAD
=======
      // TODO: Remove after #736 is fixed
      cy.on('uncaught:exception', function(err) {
        if (err.message.includes('$rootScope')) {
          expect(err.message).to.include('$rootScope');
          return false;
        }
        return true;
      });

>>>>>>> test(cypress): fixes linter errors
      // Setup
      cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
      cy.get(imports.importDataDialog.DIALOG).should('be.visible');
      cy.upload('smoke-tests/toolbar-right/toolbar-right_state.xml');
      cy.get(imports.importDataDialog.NEXT_BUTTON).click();
      cy.get(imports.importStateDialog.DIALOG).should('be.visible');
      cy.get(imports.importStateDialog.CLEAR_CHECKBOX).check();
      cy.get(imports.importStateDialog.OK_BUTTON).click();
      cy.get(layers.areasTab.TAB).click();
      cy.get(shared.Tree.ROW_1).should('contain', 'exclusion');
      cy.get(shared.Tree.ROW_2).should('contain', 'inclusion');
      cy.get(core.Application.PAGE).trigger('mouseenter').trigger('mousemove');
      cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '-33');
      cy.get(core.Toolbar.Date.INPUT).should('have.value', '2019-01-06');

      // Test
      cy.get(core.Toolbar.States.Menu.BUTTON).click();
      cy.get(core.Toolbar.States.Menu.DISABLE_STATES).click();
      cy.get(shared.Tree.ROW_2).should('not.contain', 'exclusion');
      cy.get(shared.Tree.ROW_4).should('not.contain', 'inclusion');

      // Clean up
      cy.get(layers.layersTab.TAB).click();
      cy.get(core.Application.PAGE).type('v');
      cy.get(core.Toolbar.Date.INPUT).clear();
      cy.get(core.Toolbar.Date.INPUT).type(Cypress.moment().format('YYYY[-]MM[-]DD'));
      cy.get(core.Toolbar.Date.INPUT).type('{esc}');
    });
  });

  describe('Search tool', function() {
    it('Search provider', function() {
      // Setup
      cy.get(core.Toolbar.Search.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.Search.Menu.BUTTON).click();
      cy.get(core.Toolbar.Search.Menu.PANEL).should('be.visible');
      cy.get(core.Toolbar.Search.Menu.searchTypes.COORDINATES_CHECKBOX).should('be.visible');
      cy.get(core.Toolbar.Search.Menu.searchTypes.LAYERS_CHECKBOX).should('be.visible');

      // Clean up
      cy.get(core.Toolbar.Search.Menu.BUTTON).click();
      cy.get(core.Toolbar.Search.Menu.PANEL).should('not.be.visible');
    });

    it('Search', function() {
      // Setup
      cy.get(core.Toolbar.Search.INPUT).should('be.empty');
      cy.get(core.Toolbar.Search.Results.PANEL).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.Search.INPUT).type('street{enter}');
      cy.get(core.Toolbar.Search.Results.PANEL).should('be.visible');
      cy.get(core.Toolbar.Search.Results.PANEL).should('contain', 'Street Map');
      cy.get(core.Toolbar.Search.Menu.BUTTON).click();
      cy.get(core.Toolbar.Search.Menu.PANEL).should('contain', 'street (All Search Types)');

      // Clean up
      cy.get(core.Toolbar.Search.Menu.BUTTON).click();
      cy.get(core.Toolbar.Search.Menu.PANEL).should('not.be.visible');
      cy.get(core.Toolbar.Search.CLEAR_BUTTON).click();
      cy.get(core.Toolbar.Search.Results.PANEL).should('not.be.visible');
      cy.get(core.Toolbar.Search.INPUT).should('be.empty');
    });
  });

  describe('Support menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(core.Toolbar.Support.Menu.PANEL).should('not.be.visible');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.PANEL).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.ABOUT).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.CONTROLS).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.SHOW_TIPS).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.OPENSPHERE_CAPABILITIES).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.VIEW_ALERTS).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.VIEW_LOG).should('be.visible');
      cy.get(core.Toolbar.Support.Menu.RESET_SETTINGS).should('be.visible');

      // Clean up
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.PANEL).should('not.be.visible');
    });

    it('About', function() {
      // Setup
      cy.get(dialogs.aboutDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.ABOUT).click();
      cy.get(dialogs.aboutDialog.DIALOG).should('be.visible');
      cy.get(dialogs.aboutDialog.DIALOG).should('contain', 'AngularJS');
      cy.get(dialogs.aboutDialog.DIALOG).should('contain', 'Cesium');

      // Clean up
      cy.get(dialogs.aboutDialog.CLOSE_BUTTON).click();
      cy.get(dialogs.aboutDialog.DIALOG).should('not.exist');
    });

    it('Controls', function() {
      // Setup
      cy.get(dialogs.controlsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.CONTROLS).click();
      cy.get(dialogs.controlsDialog.DIALOG).should('be.visible');
      cy.get(dialogs.controlsDialog.DIALOG).should('contain', 'General Controls');
      cy.get(dialogs.controlsDialog.DIALOG).should('contain', '3D Controls');

      // Clean up
      cy.get(dialogs.controlsDialog.DIALOG_CLOSE).click();
      cy.get(dialogs.controlsDialog.DIALOG).should('not.exist');
    });

    it('Onboarding', function() {
      // Setup
      cy.get(dialogs.welcomeToOpenSphereDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.SHOW_TIPS).click();
      cy.get(dialogs.welcomeToOpenSphereDialog.DIALOG).should('be.visible');
      cy.get(dialogs.welcomeToOpenSphereDialog.DIALOG)
          .should('contain', 'OpenSphere is a map-driven analysis tool');

      // Clean up
      cy.get(dialogs.welcomeToOpenSphereDialog.STOP_SHOWING_TIPS_BUTTON).click();
      cy.get(dialogs.welcomeToOpenSphereDialog.DIALOG).should('not.exist');
    });

    it('OpenSphere capabilities', function() {
      // Setup
      cy.get(dialogs.openSphereCapabilitiesDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.OPENSPHERE_CAPABILITIES).click();
      cy.get(dialogs.openSphereCapabilitiesDialog.DIALOG).should('be.visible');
      cy.get(dialogs.openSphereCapabilitiesDialog.DIALOG).within(function() {
        cy.get(shared.Tree.ROW_2)
            .should('contain', 'Add Data');
        cy.get(shared.Tree.ROW_5).should('contain', 'Map');
        cy.get(shared.Tree.ROW_9).should('contain', 'Tracks');
        cy.get(dialogs.openSphereCapabilitiesDialog.SEARCH_INPUT).should('be.empty');

        // Clean up
        cy.get(dialogs.openSphereCapabilitiesDialog.CLOSE_BUTTON).click();
      });

      cy.get(dialogs.openSphereCapabilitiesDialog.DIALOG).should('not.exist');
    });

    it('Alerts', function() {
      // Setup
      cy.get(dialogs.alertsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.VIEW_ALERTS).click();
      cy.get(dialogs.alertsDialog.DIALOG).should('be.visible');
      cy.get(dialogs.alertsDialog.DIALOG).should('contain', 'There are no alerts to view');

      // Clean up
      cy.get(dialogs.alertsDialog.DIALOG_CLOSE).click();
      cy.get(dialogs.alertsDialog.DIALOG).should('not.exist');
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
      cy.get(dialogs.resetSettingsDialog.DIALOG).should('not.exist');

      // Test
      cy.get(core.Toolbar.Support.Menu.BUTTON).click();
      cy.get(core.Toolbar.Support.Menu.RESET_SETTINGS).click();
      cy.get(dialogs.resetSettingsDialog.DIALOG).should('be.visible');
      cy.get(dialogs.resetSettingsDialog.DIALOG)
          .should('contain', 'Are you sure you want to clear your settings and reload');

      // Clean up
      cy.get(dialogs.resetSettingsDialog.CANCEL_BUTTON).click();
      cy.get(dialogs.resetSettingsDialog.DIALOG).should('not.exist');
    });
  });
});
