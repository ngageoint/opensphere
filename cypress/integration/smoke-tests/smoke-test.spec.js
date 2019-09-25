/// <reference types="Cypress" />
var opensphere = require('../../support/selectors/opensphere.js');
var layers = require('../../support/selectors/layers.js');

describe('Application startup', function() {
  before('Login', function() {
    cy.login();
  });

  it('Major GUI components', function() {
    cy.get(opensphere.Toolbar.PANEL).should('be.visible');
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(opensphere.statusBar.PANEL).should('be.visible');
  });

  it('Toolbar', function() {
    cy.get(opensphere.Toolbar.addData.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.addData.OPEN_FILE_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.addData.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.LAYERS_TOGGLE_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Drawing.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Measure.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Measure.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.CLEAR_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.PREVIOUS_DAY_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Date.INPUT).should('be.visible');
    cy.get(opensphere.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(opensphere.Toolbar.NEXT_DAY_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('be.visible');
    cy.get(opensphere.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(opensphere.Toolbar.timeFilter.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.TIMELINE_TOGGLE_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Save.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.States.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Search.Menu.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Search.INPUT).should('be.visible');
    cy.get(opensphere.Toolbar.Search.CLEAR_BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Search.BUTTON).should('be.visible');
    cy.get(opensphere.Toolbar.Support.Menu.BUTTON).should('be.visible');
  });

  it('Map controls', function() {
    cy.get(opensphere.Map.OVERVIEW_MAP).should('be.visible');
    cy.get(opensphere.Map.OVERVIEW_MAP_TOGGLE_BUTTON).should('be.visible');
    cy.get(opensphere.Map.ZOOM_IN_BUTTON).should('be.visible');
    cy.get(opensphere.Map.ZOOM_OUT_BUTTON).should('be.visible');
    cy.get(opensphere.Map.ROTATION_BUTTON).should('be.visible');
    cy.get(opensphere.Map.MAP_MODE_BUTTON).should('be.visible');
  });

  it('Layers dialog', function() {
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(layers.Dialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Layers');
    cy.get(layers.areasTab.TAB).should('be.visible');
    cy.get(layers.filtersTab.TAB).should('be.visible');
    cy.get(layers.placesTab.TAB).should('be.visible');
  });

  it('Status bar', function() {
    cy.get(opensphere.statusBar.ALTITUDE_TEXT).should('be.visible');
    cy.get(opensphere.statusBar.ZOOM_TEXT).should('be.visible');
    cy.get(opensphere.statusBar.Scale.BAR).should('be.visible');
    cy.get(opensphere.statusBar.COORDINATES_TEXT).should('be.visible');
    cy.get(opensphere.statusBar.SETTINGS_BUTTON).should('be.visible');
    cy.get(opensphere.statusBar.LEGEND_BUTTON).should('be.visible');
    cy.get(opensphere.statusBar.SERVERS_BUTTON).should('be.visible');
    cy.get(opensphere.statusBar.ALERTS_BUTTON).should('be.visible');
    cy.get(opensphere.statusBar.HISTORY_BUTTON).should('be.visible');
    cy.get(opensphere.statusBar.Mute.BUTTON).should('be.visible');
  });

  it('Alerts', function() {
    cy.get(opensphere.statusBar.ALERTS_WARNING_BADGE).should('not.exist');
    cy.get(opensphere.statusBar.ALERTS_ERROR_BADGE).should('not.exist');
  });
});
