/// <reference types="Cypress" />

var os = require('../../support/selectors.js');

describe('Layers dialog', function() {
  before('Login', function() {
    cy.login();
  });

  it('Layers tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.ACTIVE).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.Layers.addData.BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Layers.SEARCH_INPUT).should('be.visible');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_1).should('contain', 'Feature Layers');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', 'Map Layers');
  });

  it('Areas tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.Tabs.ACTIVE).should('contain', 'Areas');
    cy.get(os.layersDialog.Tabs.Areas.SEARCH_INPUT).should('be.visible');
    cy.get(os.layersDialog.Tabs.Areas.EXPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Areas.Import.BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Areas.ADVANCED_BUTTON).should('be.visible');
  });

  it('Filters tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.Filters.TAB).click();
    cy.get(os.layersDialog.Tabs.ACTIVE).should('contain', 'Filters');
    cy.get(os.layersDialog.Tabs.Filters.SEARCH_INPUT).should('be.visible');
    cy.get(os.layersDialog.Tabs.Filters.IMPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Filters.EXPORT_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Filters.ADVANCED_BUTTON).should('be.visible');
  });

  it('Places tab', function() {
    cy.get(os.layersDialog.DIALOG).should('be.visible');
    cy.get(os.layersDialog.DIALOG_HEADER).should('contain', 'Layers');
    cy.get(os.layersDialog.Tabs.Places.TAB).click();
    cy.get(os.layersDialog.Tabs.ACTIVE).should('contain', 'Places');
    cy.get(os.layersDialog.Tabs.Places.ADD_FOLDER_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Places.ADD_PLACE_BUTTON).should('be.visible');
    cy.get(os.layersDialog.Tabs.Places.EXPORT_BUTTON).should('be.visible');
  });
});
