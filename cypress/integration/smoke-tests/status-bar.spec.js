/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Status bar', function() {
  before('Login', function() {
    cy.login();
  });

  it('Altitude', function() {
    // Setup
    cy.get(os.Application.PAGE).type('v');

    // Test
    cy.get(os.statusBar.ALTITUDE).should('contain', 'Altitude:');
    cy.get(os.statusBar.ALTITUDE).then(function($altitude) {
      var INITIAL_ALTITUDE = $altitude.text();
      cy.get(os.Application.PAGE).type('++++');
      cy.get(os.statusBar.ALTITUDE).should('not.contain', INITIAL_ALTITUDE);
    });

    // Clean up
    cy.get(os.Application.PAGE).type('v');
  });

  it('Zoom', function() {
    // Setup
    cy.get(os.Application.PAGE).type('v');

    // Test
    cy.get(os.statusBar.ZOOM).should('contain', 'Zoom:');
    cy.get(os.statusBar.ZOOM).then(function($zoom) {
      var INITIAL_ZOOM = $zoom.text();
      cy.get(os.Application.PAGE).type('++++');
      cy.get(os.statusBar.ZOOM).should('not.contain', INITIAL_ZOOM);
    });

    // Clean up
    cy.get(os.Application.PAGE).type('v');
  });

  it('Scale', function() {
    // Setup
    cy.get(os.Application.PAGE).type('v');

    // Test
    cy.get(os.statusBar.Scale.BAR).then(function($scale) {
      var INITIAL_SCALE = $scale.text();
      cy.get(os.Application.PAGE).type('++++');
      cy.get(os.statusBar.Scale.BAR).should('not.contain', INITIAL_SCALE);
    });

    // Clean up
    cy.get(os.Application.PAGE).type('v');
  });

  it('Scale options', function() {
    // Setup
    cy.get(os.statusBar.Scale.MENU).should('not.be.visible');

    // Test
    cy.get(os.statusBar.Scale.BAR).click();
    cy.get(os.statusBar.Scale.MENU).should('be.visible');
    cy.get(os.statusBar.Scale.IMPERIAL).should('be.visible');
    cy.get(os.statusBar.Scale.METRIC).should('be.visible');
    cy.get(os.statusBar.Scale.NAUTICAL).should('be.visible');
    cy.get(os.statusBar.Scale.NAUTICAL_MILES_ONLY).should('be.visible');
    cy.get(os.statusBar.Scale.MILES_ONLY).should('be.visible');
    cy.get(os.statusBar.Scale.YARDS_ONLY).should('be.visible');
    cy.get(os.statusBar.Scale.FEET_ONLY).should('be.visible');

    // Clean up
    cy.get(os.statusBar.Scale.BAR).click();
    cy.get(os.statusBar.Scale.MENU).should('not.be.visible');
  });

  it('Scale units', function() {
    // Setup
    cy.get(os.Application.PAGE).type('v');
    cy.get(os.statusBar.Scale.BAR).should('not.contain', 'mi');

    // Test
    cy.get(os.statusBar.Scale.BAR).click();
    cy.get(os.statusBar.Scale.IMPERIAL).click();
    cy.get(os.statusBar.Scale.MENU).should('not.be.visible');
    cy.get(os.statusBar.Scale.BAR).should('contain', 'mi');

    // Clean up
    cy.get(os.statusBar.Scale.BAR).click();
    cy.get(os.statusBar.Scale.METRIC).click();
  });

  it('Coordinates', function() {
    // Setup
    cy.get(os.layersDialog.DIALOG_CLOSE).click();
    cy.get(os.Application.PAGE).type('+++++++++++++++++++');
    cy.get(os.statusBar.COORDINATES).should('contain', 'No coordinate');

    // Test
    cy.get(os.statusBar.COORDINATES).then(function($coordinates) {
      var INITIAL_COORDINATES = $coordinates.text();
      cy.get(os.Application.PAGE)
          .trigger('mouseenter')
          .trigger('mousemove', 500, 500);

      cy.get(os.statusBar.COORDINATES).should('not.contain', INITIAL_COORDINATES);
    });

    // Clean up
    cy.get(os.Application.PAGE).type('v');
  });

  it('Coordinates format', function() {
    // Setup
    cy.get(os.Application.PAGE).type('+++++++++++++++++++');
    cy.get(os.Application.PAGE)
        .trigger('mouseenter')
        .trigger('mousemove', 500, 500);
    cy.get(os.statusBar.COORDINATES).should('contain', '(DD)');

    // Test
    cy.get(os.statusBar.COORDINATES).click();
    cy.get(os.statusBar.COORDINATES).should('contain', '(DMS)');
    cy.get(os.statusBar.COORDINATES).click();
    cy.get(os.statusBar.COORDINATES).should('contain', '(DDM)');
    cy.get(os.statusBar.COORDINATES).click();
    cy.get(os.statusBar.COORDINATES).should('contain', '(MGRS)');

    // Clean up
    cy.get(os.statusBar.COORDINATES).click();
    cy.get(os.statusBar.COORDINATES).should('contain', '(DD)');
    cy.get(os.Application.PAGE).type('v');
  });

  it('Settings dialog', function() {
    // Setup
    cy.get(os.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(os.statusBar.SETTINGS_BUTTON).click();
    cy.get(os.settingsDialog.DIALOG).should('visible');

    // Clean up
    cy.get(os.settingsDialog.CLOSE_BUTTON).click();
    cy.get(os.settingsDialog.DIALOG).should('not.be.visible');
  });

  it('Legend', function() {
    // Setup
    cy.get(os.legendWidget.WIDGET).should('not.be.visible');

    // Test
    cy.get(os.statusBar.LEGEND_BUTTON).click();
    cy.get(os.legendWidget.WIDGET).should('be.visible');

    // Clean up
    cy.get(os.legendWidget.WIDGET_CLOSE).click();
    cy.get(os.legendWidget.WIDGET).should('not.be.visible');
  });

  it('Data servers', function() {
    // Setup
    cy.get(os.settingsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(os.statusBar.SERVERS_BUTTON).click();
    cy.get(os.settingsDialog.DIALOG).should('be.visible');
    cy.get(os.settingsDialog.Tabs.ACTIVE_TAB).should('contain', 'Data Servers');
    cy.get(os.settingsDialog.Tabs.Map.INTERPOLATION_TAB).click();
    cy.get(os.settingsDialog.Tabs.ACTIVE_TAB).should('contain', 'Interpolation');

    // Clean up
    cy.get(os.settingsDialog.CLOSE_BUTTON).click();
    cy.get(os.settingsDialog.DIALOG).should('not.be.visible');
  });

  it('Alerts dialog', function() {
    // Setup
    cy.get(os.alertsDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(os.statusBar.ALERTS_BUTTON).click();
    cy.get(os.alertsDialog.DIALOG).should('be.visible');
    cy.get(os.alertsDialog.DIALOG).should('contain', 'There are no alerts to view');

    // Clean up
    cy.get(os.alertsDialog.DIALOG_CLOSE).click();
    cy.get(os.alertsDialog.DIALOG).should('not.be.visible');
  });

  it('History dialog', function() {
    // Setup
    cy.get(os.historyDialog.DIALOG).should('not.be.visible');

    // Test
    cy.get(os.statusBar.HISTORY_BUTTON).click();
    cy.get(os.historyDialog.DIALOG).should('be.visible');
    cy.get(os.historyDialog.DIALOG).should('contain', 'There is no history to view');

    // Clean up
    cy.get(os.historyDialog.DIALOG_CLOSE).click();
    cy.get(os.historyDialog.DIALOG).should('not.be.visible');
  });

  it('Sounds', function() {
    // Setup
    cy.get(os.statusBar.Mute.BUTTON).should('have.class', os.statusBar.Mute.SOUND_ON);

    // Test
    cy.get(os.statusBar.Mute.BUTTON).click();
    cy.get(os.statusBar.Mute.BUTTON).should('have.class', os.statusBar.Mute.SOUND_OFF);

    // Clean up
    cy.get(os.statusBar.Mute.BUTTON).click();
    cy.get(os.statusBar.Mute.BUTTON).should('have.class', os.statusBar.Mute.SOUND_ON);
  });
});
