/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Application startup', function() {
  before('Login', function() {
    cy.login();
  });

  it('Major GUI components', function() {
    cy.get(os.Toolbar.TOOLBAR).should('be.visible');
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.statusBar.STATUSBAR).should('be.visible');
  });

  it('Toolbar', function() {
    cy.get(os.Toolbar.addData.BUTTON).should('be.visible');
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).should('be.visible');
    cy.get(os.Toolbar.addData.Dropdown.BUTTON).should('be.visible');
    cy.get(os.Toolbar.LAYERS_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Drawing.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Drawing.Dropdown.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Measure.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Measure.Dropdown.BUTTON).should('be.visible');
    cy.get(os.Toolbar.CLEAR_BUTTON).should('be.visible');
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Date.FIELD).should('be.visible');
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).should('be.visible');
    cy.get(os.Toolbar.DURATION_SELECT).should('be.visible');
    cy.get(os.Toolbar.DURATION_SELECT).should('have.value', 'day');
    cy.get(os.Toolbar.timeFilter.BUTTON).should('be.visible');
    cy.get(os.Toolbar.TIMELINE_TOGGLE).should('be.visible');
    cy.get(os.Toolbar.Save.BUTTON).should('be.visible');
    cy.get(os.Toolbar.States.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.Dropdown.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.FIELD).should('be.visible');
    cy.get(os.Toolbar.Search.CLEAR_BUTTON).should('be.visible');
    cy.get(os.Toolbar.Search.BUTTON).should('be.visible');
    cy.get(os.Toolbar.Support.BUTTON).should('be.visible');
  });

  it('Map controls', function() {
    cy.get(os.Map.OVERVIEW_MAP).should('be.visible');
    cy.get(os.Map.OVERVIEW_MAP_TOGGLE).should('be.visible');
    cy.get(os.Map.ZOOM_IN_BUTTON).should('be.visible');
    cy.get(os.Map.ZOOM_OUT_BUTTON).should('be.visible');
    cy.get(os.Map.ROTATION_BUTTON).should('be.visible');
    cy.get(os.Map.MAP_MODE_BUTTON).should('be.visible');
  });

  it('Layers dialog', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.ACTIVE_TAB).should('contain', 'Layers');
    cy.get(os.layersDialog.AREAS_TAB).should('be.visible');
    cy.get(os.layersDialog.FILTERS_TAB).should('be.visible');
    cy.get(os.layersDialog.PLACES_TAB).should('be.visible');
  });

  it('Status bar', function() {
    cy.get(os.statusBar.ALTITUDE).should('be.visible');
    cy.get(os.statusBar.ZOOM).should('be.visible');
    cy.get(os.statusBar.Scale.BAR).should('be.visible');
    cy.get(os.statusBar.COORDINATES).should('be.visible');
    cy.get(os.statusBar.SETTINGS_BUTTON).should('be.visible');
    cy.get(os.statusBar.LEGEND_BUTTON).should('be.visible');
    cy.get(os.statusBar.SERVERS_BUTTON).should('be.visible');
    cy.get(os.statusBar.ALERTS_BUTTON).should('be.visible');
    cy.get(os.statusBar.HISTORY_BUTTON).should('be.visible');
    cy.get(os.statusBar.Mute.BUTTON).should('be.visible');
  });

  it('Alerts', function() {
    cy.get(os.statusBar.ALERTS_UNREAD).should('not.exist');
  });
});
