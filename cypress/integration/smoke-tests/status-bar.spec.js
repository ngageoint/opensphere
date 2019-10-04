/// <reference types="Cypress" />
var opensphere = require('../../support/selectors/opensphere.js');
var dialogs = require('../../support/selectors/dialogs.js');
var layers = require('../../support/selectors/layers.js');
var settings = require('../../support/selectors/settings.js');

describe('Status bar', function() {
  before('Login', function() {
    cy.login();
  });

  it('Altitude', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');

    // Test
    cy.get(opensphere.statusBar.ALTITUDE_TEXT).should('contain', 'Altitude:');
    cy.get(opensphere.statusBar.ALTITUDE_TEXT).then(function($altitude) {
      var INITIAL_ALTITUDE = $altitude.text();
      cy.get(opensphere.Application.PAGE).type('++++');
      cy.get(opensphere.statusBar.ALTITUDE_TEXT).should('not.contain', INITIAL_ALTITUDE);
    });

    // Clean up
    cy.get(opensphere.Application.PAGE).type('v');
  });

  it('Zoom', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');

    // Test
    cy.get(opensphere.statusBar.ZOOM_TEXT).should('contain', 'Zoom:');
    cy.get(opensphere.statusBar.ZOOM_TEXT).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(opensphere.Application.PAGE).type('++++');
      cy.get(opensphere.statusBar.ZOOM_TEXT).should('not.contain', INITIAL_ZOOM);
    });

    // Clean up
    cy.get(opensphere.Application.PAGE).type('v');
  });

  it('Scale', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');

    // Test
    cy.get(opensphere.statusBar.Scale.BAR).then(function($scale) {
      var INITIAL_SCALE = $scale.text();
      cy.get(opensphere.Application.PAGE).type('++++');
      cy.get(opensphere.statusBar.Scale.BAR).should('not.contain', INITIAL_SCALE);
    });

    // Clean up
    cy.get(opensphere.Application.PAGE).type('v');
  });

  it('Scale options', function() {
    // Setup
    cy.get(opensphere.statusBar.Scale.Menu.PANEL).should('not.be.visible');

    // Test
    cy.get(opensphere.statusBar.Scale.BAR).click();
    cy.get(opensphere.statusBar.Scale.Menu.PANEL).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.IMPERIAL).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.METRIC).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.NAUTICAL).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.NAUTICAL_MILES_ONLY).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.MILES_ONLY).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.YARDS_ONLY).should('be.visible');
    cy.get(opensphere.statusBar.Scale.Menu.FEET_ONLY).should('be.visible');

    // Clean up
    cy.get(opensphere.statusBar.Scale.BAR).click();
    // cy.get(opensphere.statusBar.Scale.Menu.PANEL).should('not.be.visible'); TODO: Uncomment after #746 fixed
  });

  it('Scale units', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('v');
    cy.get(opensphere.statusBar.Scale.BAR).should('not.contain', 'mi');

    // Test
    cy.get(opensphere.statusBar.Scale.BAR).click();
    cy.get(opensphere.statusBar.Scale.Menu.IMPERIAL).click();
    cy.get(opensphere.statusBar.Scale.Menu.PANEL).should('not.be.visible');
    cy.get(opensphere.statusBar.Scale.BAR).should('contain', 'mi');

    // Clean up
    cy.get(opensphere.statusBar.Scale.BAR).click();
    cy.get(opensphere.statusBar.Scale.Menu.METRIC).click();
  });

  it('Coordinates', function() {
    // Setup
    cy.get(layers.Dialog.DIALOG_CLOSE).click();
    cy.get(opensphere.Application.PAGE).type('+++++++++++++++++++');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');

    // Test
    cy.get(opensphere.statusBar.COORDINATES_TEXT).then(function($coordinates) {
      var INITIAL_COORDINATES = $coordinates.text();
      cy.get(opensphere.Application.PAGE)
          .trigger('mouseenter')
          .trigger('mousemove', 500, 500);

      cy.get(opensphere.statusBar.COORDINATES_TEXT).should('not.contain', INITIAL_COORDINATES);
    });

    // Clean up
    cy.get(opensphere.Application.PAGE).type('v');
  });

  it('Coordinates format', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('+++++++++++++++++++');
    cy.get(opensphere.Application.PAGE)
        .trigger('mouseenter')
        .trigger('mousemove', 500, 500);
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '(DD)');

    // Test
    cy.get(opensphere.statusBar.COORDINATES_TEXT).click();
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '(DMS)');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).click();
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '(DDM)');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).click();
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '(MGRS)');

    // Clean up
    cy.get(opensphere.statusBar.COORDINATES_TEXT).click();
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('contain', '(DD)');
    cy.get(opensphere.Application.PAGE).type('v');
  });

  it('Settings dialog', function() {
    // Setup
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(opensphere.statusBar.SETTINGS_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('visible');

    // Clean up
    cy.get(settings.settingsDialog.CLOSE_BUTTON).click();
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');
  });

  it('Legend', function() {
    // Setup
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('not.be.visible');

    // Test
    cy.get(opensphere.statusBar.LEGEND_BUTTON).click();
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('be.visible');

    // Clean up
    cy.get(dialogs.legendDialog.DIALOG_CLOSE).click();
    cy.get(dialogs.legendDialog.DIALOG_TEXT).should('not.be.visible');
  });

  it('Data servers', function() {
    // Setup
    cy.get(settings.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(opensphere.statusBar.SERVERS_BUTTON).click();
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
    cy.get(opensphere.statusBar.ALERTS_BUTTON).click();
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
    cy.get(opensphere.statusBar.HISTORY_BUTTON).click();
    cy.get(dialogs.historyDialog.DIALOG).should('be.visible');
    cy.get(dialogs.historyDialog.DIALOG).should('contain', 'There is no history to view');

    // Clean up
    cy.get(dialogs.historyDialog.DIALOG_CLOSE).click();
    cy.get(dialogs.historyDialog.DIALOG).should('not.be.visible');
  });

  it('Sounds', function() {
    // Setup
    cy.get(opensphere.statusBar.Mute.BUTTON).should('have.class', opensphere.statusBar.Mute.SOUND_ON_CLASS);

    // Test
    cy.get(opensphere.statusBar.Mute.BUTTON).click();
    cy.get(opensphere.statusBar.Mute.BUTTON).should('have.class', opensphere.statusBar.Mute.SOUND_OFF_CLASS);

    // Clean up
    cy.get(opensphere.statusBar.Mute.BUTTON).click();
    cy.get(opensphere.statusBar.Mute.BUTTON).should('have.class', opensphere.statusBar.Mute.SOUND_ON_CLASS);
  });
});
