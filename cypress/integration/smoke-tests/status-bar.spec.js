/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var dialogs = require('../../support/selectors/dialogs.js');
var layers = require('../../support/selectors/layers.js');
var settings = require('../../support/selectors/settings.js');

describe('Status bar', function() {
  before('Login', function() {
    cy.login();
  });

  it('Altitude', function() {
    // Setup
    cy.get(core.Application.PAGE).type('v');

    // Test
    cy.get(core.statusBar.ALTITUDE_TEXT).should('contain', 'Altitude:');
    cy.get(core.statusBar.ALTITUDE_TEXT).then(function($altitude) {
      var INITIAL_ALTITUDE = $altitude.text();
      cy.get(core.Application.PAGE).type('++++');
      cy.get(core.statusBar.ALTITUDE_TEXT).should('not.contain', INITIAL_ALTITUDE);
    });

    // Clean up
    cy.get(core.Application.PAGE).type('v');
  });

  it('Zoom', function() {
    // Setup
    cy.get(core.Application.PAGE).type('v');

    // Test
    cy.get(core.statusBar.ZOOM_TEXT).should('contain', 'Zoom:');
    cy.get(core.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(core.Application.PAGE).type('++++');
      cy.get(core.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });

    // Clean up
    cy.get(core.Application.PAGE).type('v');
  });

  it('Scale', function() {
    // Setup
    cy.get(core.Application.PAGE).type('v');

    // Test
    cy.get(core.statusBar.Scale.BAR).then(function($scale) {
      var INITIAL_SCALE = $scale.text();
      cy.get(core.Application.PAGE).type('++++');
      cy.get(core.statusBar.Scale.BAR).should('not.contain', INITIAL_SCALE);
    });

    // Clean up
    cy.get(core.Application.PAGE).type('v');
  });

  it('Scale options', function() {
    // Setup
    cy.get(core.statusBar.Scale.Menu.PANEL).should('not.be.visible');

    // Test
    cy.get(core.statusBar.Scale.BAR).click();
    cy.get(core.statusBar.Scale.Menu.PANEL).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.IMPERIAL).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.METRIC).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.NAUTICAL).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.NAUTICAL_MILES_ONLY).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.MILES_ONLY).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.YARDS_ONLY).should('be.visible');
    cy.get(core.statusBar.Scale.Menu.FEET_ONLY).should('be.visible');

    // Clean up
    cy.get(core.statusBar.Scale.BAR).click();
    // cy.get(core.statusBar.Scale.Menu.PANEL).should('not.be.visible'); TODO: Uncomment after #746 fixed
  });

  it('Scale units', function() {
    // Setup
    cy.get(core.Application.PAGE).type('v');
    cy.get(core.statusBar.Scale.BAR).should('not.contain', 'mi');

    // Test
    cy.get(core.statusBar.Scale.BAR).click();
    cy.get(core.statusBar.Scale.Menu.IMPERIAL).click();
    cy.get(core.statusBar.Scale.Menu.PANEL).should('not.be.visible');
    cy.get(core.statusBar.Scale.BAR).should('contain', 'mi');

    // Clean up
    cy.get(core.statusBar.Scale.BAR).click();
    cy.get(core.statusBar.Scale.Menu.METRIC).click();
  });

  it('Coordinates', function() {
    // Setup
    cy.get(layers.Dialog.DIALOG_CLOSE).click();
    cy.get(core.Application.PAGE).type('+++++++++++++++++++');
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');

    // Test
    cy.get(core.statusBar.COORDINATES_TEXT).then(function($coordinates) {
      var INITIAL_COORDINATES = $coordinates.text();
      cy.get(core.Application.PAGE)
          .trigger('mouseenter')
          .trigger('mousemove', 500, 500);

      cy.get(core.statusBar.COORDINATES_TEXT).should('not.contain', INITIAL_COORDINATES);
    });

    // Clean up
    cy.get(core.Application.PAGE).type('v');
  });

  it('Coordinates format', function() {
    // Setup
    cy.get(core.Application.PAGE).type('+++++++++++++++++++');
    cy.get(core.Application.PAGE)
        .trigger('mouseenter')
        .trigger('mousemove', 500, 500);
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '(DD)');

    // Test
    cy.get(core.statusBar.COORDINATES_TEXT).click();
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '(DMS)');
    cy.get(core.statusBar.COORDINATES_TEXT).click();
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '(DDM)');
    cy.get(core.statusBar.COORDINATES_TEXT).click();
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '(MGRS)');

    // Clean up
    cy.get(core.statusBar.COORDINATES_TEXT).click();
    cy.get(core.statusBar.COORDINATES_TEXT).should('contain', '(DD)');
    cy.get(core.Application.PAGE).type('v');
  });

  it('Settings dialog', function() {
    // Setup
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(core.statusBar.SETTINGS_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('visible');

    // Clean up
    cy.get(settings.settingsDialog.CLOSE_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');
  });

  it('Legend', function() {
    // Setup
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('not.be.visible');

    // Test
    cy.get(core.statusBar.LEGEND_BUTTON).click();
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('be.visible');

    // Clean up
    cy.get(dialogs.legendDialog.DIALOG_CLOSE).click();
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('not.be.visible');
  });

  it('Data servers', function() {
    // Setup
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(core.statusBar.SERVERS_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('be.visible');
    cy.get(settings.settingsDialog.Tabs.ACTIVE_TAB).should('contain', 'Data Servers');
    cy.get(settings.settingsDialog.Tabs.Map.Interpolation.TAB).click();
    cy.get(settings.settingsDialog.Tabs.ACTIVE_TAB).should('contain', 'Interpolation');

    // Clean up
    cy.get(settings.settingsDialog.CLOSE_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');
  });

  it('Alerts dialog', function() {
    // Setup
    cy.get(dialogs.alertsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(core.statusBar.ALERTS_BUTTON).click();
    cy.get(dialogs.alertsDialog.DIALOG).should('be.visible');
    cy.get(dialogs.alertsDialog.DIALOG).should('contain', 'There are no alerts to view');

    // Clean up
    cy.get(dialogs.alertsDialog.DIALOG_CLOSE).click();
    cy.get(dialogs.alertsDialog.DIALOG).should('not.be.visible');
  });

  it('History dialog', function() {
    // Setup
    cy.get(dialogs.historyDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(core.statusBar.HISTORY_BUTTON).click();
    cy.get(dialogs.historyDialog.DIALOG).should('be.visible');
    cy.get(dialogs.historyDialog.DIALOG).should('contain', 'There is no history to view');

    // Clean up
    cy.get(dialogs.historyDialog.DIALOG_CLOSE).click();
    cy.get(dialogs.historyDialog.DIALOG).should('not.be.visible');
  });

  it('Sounds', function() {
    // Setup
    cy.get(core.statusBar.Mute.BUTTON).should('have.class', core.statusBar.Mute.SOUND_ON_CLASS);

    // Test
    cy.get(core.statusBar.Mute.BUTTON).click();
    cy.get(core.statusBar.Mute.BUTTON).should('have.class', core.statusBar.Mute.SOUND_OFF_CLASS);

    // Clean up
    cy.get(core.statusBar.Mute.BUTTON).click();
    cy.get(core.statusBar.Mute.BUTTON).should('have.class', core.statusBar.Mute.SOUND_ON_CLASS);
  });
});
