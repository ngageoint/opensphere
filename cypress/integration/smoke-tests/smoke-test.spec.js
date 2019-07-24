/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var layers = require('../../support/selectors/layers.js');

describe('Application startup', function() {
  before('Login', function() {
    cy.login();
  });

  it('Major GUI components', function() {
    cy.get(core.Toolbar.PANEL).should('be.visible');
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(core.statusBar.PANEL).should('be.visible');
  });

  it('Toolbar', function() {
    cy.get(core.Toolbar.addData.BUTTON).should('be.visible');
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).should('be.visible');
    cy.get(core.Toolbar.addData.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.LAYERS_TOGGLE_BUTTON).should('be.visible');
    cy.get(core.Toolbar.Drawing.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Drawing.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Measure.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Measure.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.CLEAR_BUTTON).should('be.visible');
    cy.get(core.Toolbar.PREVIOUS_DAY_BUTTON).should('be.visible');
    cy.get(core.Toolbar.Date.INPUT).should('be.visible');
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(core.Toolbar.NEXT_DAY_BUTTON).should('be.visible');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('be.visible');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(core.Toolbar.timeFilter.BUTTON).should('be.visible');
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).should('be.visible');
    cy.get(core.Toolbar.Save.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.States.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Search.Menu.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Search.INPUT).should('be.visible');
    cy.get(core.Toolbar.Search.CLEAR_BUTTON).should('be.visible');
    cy.get(core.Toolbar.Search.BUTTON).should('be.visible');
    cy.get(core.Toolbar.Support.Menu.BUTTON).should('be.visible');
  });

  it('Map controls', function() {
    cy.get(core.Map.OVERVIEW_MAP).should('be.visible');
    cy.get(core.Map.OVERVIEW_MAP_TOGGLE_BUTTON).should('be.visible');
    cy.get(core.Map.ZOOM_IN_BUTTON).should('be.visible');
    cy.get(core.Map.ZOOM_OUT_BUTTON).should('be.visible');
    cy.get(core.Map.ROTATION_BUTTON).should('be.visible');
    cy.get(core.Map.MAP_MODE_BUTTON).should('be.visible');
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
    cy.get(core.statusBar.ALTITUDE_TEXT).should('be.visible');
    cy.get(core.statusBar.ZOOM_TEXT).should('be.visible');
    cy.get(core.statusBar.Scale.BAR).should('be.visible');
    cy.get(core.statusBar.COORDINATES_TEXT).should('be.visible');
    cy.get(core.statusBar.SETTINGS_BUTTON).should('be.visible');
    cy.get(core.statusBar.LEGEND_BUTTON).should('be.visible');
    cy.get(core.statusBar.SERVERS_BUTTON).should('be.visible');
    cy.get(core.statusBar.ALERTS_BUTTON).should('be.visible');
    cy.get(core.statusBar.HISTORY_BUTTON).should('be.visible');
    cy.get(core.statusBar.Mute.BUTTON).should('be.visible');
  });

  it('Alerts', function() {
    cy.get(core.statusBar.ALERTS_UNREAD_BADGE).should('not.exist');
  });
});
