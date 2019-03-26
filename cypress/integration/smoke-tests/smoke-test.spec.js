/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Application startup', function() {
  before('Login', function() {
    cy.login();
  });

  it('Major GUI components', function() {
    cy.get(os.Toolbar.PANEL).should('be.visible');
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.statusBar.PANEL).should('be.visible');
  });

  it('Toolbar', function() {
    cy.get(os.Toolbar.addData.BUTTON).should('be.visible');
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).should('be.visible');
    cy.get(os.Toolbar.addData.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.LAYERS_TOGGLE_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Drawing.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Drawing.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Measure.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Measure.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.CLEAR_BUTTON).should('be.visible');
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Date.INPUT).should('be.visible');
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).should('be.visible');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('be.visible');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(os.Toolbar.timeFilter.BUTTON).should('be.visible');
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Save.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.States.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.Menu.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.INPUT).should('be.visible');
    cy.get(os.Toolbar.Search.CLEAR_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Support.Menu.BUTTON).should('be.visible');
  });

  it('Map controls', function() {
    cy.get(os.Map.OVERVIEW_MAP).should('be.visible');
    cy.get(os.Map.OVERVIEW_MAP_TOGGLE_BUTTON).should('be.visible');
    cy.get(os.Map.ZOOM_IN_BUTTON).should('be.visible');
    cy.get(os.Map.ZOOM_OUT_BUTTON).should('be.visible');
    cy.get(os.Map.ROTATION_BUTTON).should('be.visible');
    cy.get(os.Map.MAP_MODE_BUTTON).should('be.visible');
  });

  it('Layers dialog', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.ACTIVE).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.Areas.TAB).should('be.visible');
    cy.get(os.layersDialog.Tabs.Filters.TAB).should('be.visible');
    cy.get(os.layersDialog.Tabs.Places.TAB).should('be.visible');
  });

  it('Status bar', function() {
    cy.get(os.statusBar.ALTITUDE_TEXT).should('be.visible');
    cy.get(os.statusBar.ZOOM_TEXT).should('be.visible');
    cy.get(os.statusBar.Scale.BAR).should('be.visible');
    cy.get(os.statusBar.COORDINATES_TEXT).should('be.visible');
    cy.get(os.statusBar.SETTINGS_BUTTON).should('be.visible');
    cy.get(os.statusBar.LEGEND_BUTTON).should('be.visible');
    cy.get(os.statusBar.SERVERS_BUTTON).should('be.visible');
    cy.get(os.statusBar.ALERTS_BUTTON).should('be.visible');
    cy.get(os.statusBar.HISTORY_BUTTON).should('be.visible');
    cy.get(os.statusBar.Mute.BUTTON).should('be.visible');
  });

  it('Alerts', function() {
    cy.get(os.statusBar.ALERTS_UNREAD_BADGE).should('not.exist');
  });
});
