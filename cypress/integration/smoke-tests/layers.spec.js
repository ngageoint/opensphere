/// <reference types="Cypress" />

var os = require('../../support/selectors.js');

describe('Layers dialog', function() {
  before('Login', function() {
    cy.login();
  });

  it('Layers tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.ACTIVE_TAB).should('contain', 'Layers');
    cy.get(os.layersDialog.Layers.ADD_DATA_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Layers.SEARCH_FIELD).should('be.visible');
    cy.get(os.layersDialog.Layers.Tree.LAYER_1).should('contain', 'Feature Layers');
    cy.get(os.layersDialog.Layers.Tree.LAYER_4).should('contain', 'Map Layers');
  });

  it('Areas tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.AREAS_TAB).click();
    cy.get(os.layersDialog.ACTIVE_TAB).should('contain', 'Areas');
    cy.get(os.layersDialog.Areas.SEARCH_FIELD).should('be.visible');
    cy.get(os.layersDialog.Areas.EXPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Areas.IMPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Areas.ADVANCED_BUTTON).should('be.visible');
  });

  it('Filters tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.FILTERS_TAB).click();
    cy.get(os.layersDialog.ACTIVE_TAB).should('contain', 'Filters');
    cy.get(os.layersDialog.Filters.SEARCH_FIELD).should('be.visible');
    cy.get(os.layersDialog.Filters.IMPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Filters.EXPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Filters.ADVANCED_BUTTON).should('be.visible');
  });

  it('Places tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.PLACES_TAB).click();
    cy.get(os.layersDialog.ACTIVE_TAB).should('contain', 'Places');
    cy.get(os.layersDialog.Places.ADD_FOLDER_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Places.ADD_PLACE_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Places.EXPORT_BUTTON).should('be.visible');
  });
});
