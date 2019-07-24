/// <reference types="Cypress" />
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('Layers dialog', function() {
  before('Login', function() {
    cy.login();
  });

  it('Layers tab', function() {
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(layers.Dialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Layers');
    cy.get(layers.layersTab.addData.BUTTON).should('be.visible');
    cy.get(layers.layersTab.SEARCH_INPUT).should('be.visible');
    cy.get(shared.Tree.ROW_1).should('contain', 'Feature Layers');
    cy.get(shared.Tree.ROW_4).should('contain', 'Map Layers');
  });

  it('Areas tab', function() {
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(layers.Dialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(layers.areasTab.TAB).click();
    cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Areas');
    cy.get(layers.areasTab.SEARCH_INPUT).should('be.visible');
    cy.get(layers.areasTab.EXPORT_BUTTON).should('be.visible');
    cy.get(layers.areasTab.Import.BUTTON).should('be.visible');
    cy.get(layers.areasTab.ADVANCED_BUTTON).should('be.visible');
  });

  it('Filters tab', function() {
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(layers.Dialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(layers.filtersTab.TAB).click();
    cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Filters');
    cy.get(layers.filtersTab.SEARCH_INPUT).should('be.visible');
    cy.get(layers.filtersTab.IMPORT_BUTTON).should('be.visible');
    cy.get(layers.filtersTab.EXPORT_BUTTON).should('be.visible');
    cy.get(layers.filtersTab.ADVANCED_BUTTON).should('be.visible');
  });

  it('Places tab', function() {
    cy.get(layers.Dialog.DIALOG).should('be.visible');
    cy.get(layers.Dialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(layers.placesTab.TAB).click();
    cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Places');
    cy.get(layers.placesTab.ADD_FOLDER_BUTTON).should('be.visible');
    cy.get(layers.placesTab.ADD_PLACE_BUTTON).should('be.visible');
    cy.get(layers.placesTab.EXPORT_BUTTON).should('be.visible');
  });
});
