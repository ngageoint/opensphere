/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('KML import', function() {
  before('Login', function() {
    cy.login();
  });

  it('Load data from KML', function() {
    // Upload a file
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(imports.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-data-file-kml/test-features.kmz');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.importKMLDialog.DIALOG).should('be.visible');
    cy.get(imports.importKMLDialog.LAYER_TITLE_INPUT).should('be.visible');
    cy.get(imports.importKMLDialog.OK_BUTTON).click();

    // Load a layer
    cy.get(shared.Tree.ROW_4)
        .should('contain', 'smoke-tests/load-data-file-kml/test-features.kmz Features (291)');
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.MOST_RECENT).click();
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.GO_TO).click();
    cy.imageComparison('features loaded');

    // Open the timeline and animate the data (view window animates)
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force:true}); // TODO: Remove force:true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('be.visible');
    cy.get(core.Timeline.HISTOGRAM_POINTS).should('be.visible');
    cy.get(core.Timeline.VIEW_WINDOW).invoke('position').then(function(elementPosition) {
      cy.get(core.Timeline.PLAY_BUTTON).click();
      cy.get(core.Timeline.VIEW_WINDOW).invoke('position').should('not.equal', elementPosition);
    });
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force:true}); // TODO: Remove force:true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('not.exist');

    // Open the timeline and animate the data (feature count changes)
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force:true}); // TODO: Remove force:true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('be.visible');
    cy.get(core.Timeline.PLAY_BUTTON).click();
    cy.get(core.Timeline.PAUSE_BUTTON).click();
    cy.get(shared.Tree.ROW_4)
        .find(layers.layersTab.Tree.FEATURE_COUNT_TEXT)
        .invoke('text')
        .should('match', new RegExp('\\([0-9]\\d{0,3}\\/' + '291\\)'));
  });
});
