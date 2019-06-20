/// <reference types="Cypress" />
var os = require('../../../support/selectors.js');

os.layerFeaturesDialog = {
  CELLS: '.slick-cell',
  DESCRIPTION_CELL: '[data-testid=\'featurelist\'] .slick-viewport .slick-cell',
  DIALOG: '[data-testid=\'featurelist\']',
  FOOTER_STATUS_TEXT: '[ng-if=\'ctrl.status\']',
  FULL_FOOTER_STATUS_TEXT: '[data-testid=\'featurelist\'] [ng-if=\'ctrl.status\']',
  GRID: '[data-testid=\'featurelist\'] .slick-grid',
  HEADER_CELLS: '.slick-column-name',
  HEADER_ROW: '.slick-header',
  ROWS_CELLS: '[data-testid=\'featurelist\'] .slick-cell.l5',
  SOURCE_GRID: '.js-source-grid',
  VIEWPORT: '.slick-viewport',
  buttons: {
    CLOSE: '[ng-click=\'ctrl.close()\']'
  },
  contextMenu: {
    EXPORT: '[title=\'Exports data to a file\']',
    DESELECT_ALL: '[title=\'Deselects all items\']',
    INVERT_SELECTION: '[title=\'Inverts the selection\']',
    SELECT_ALL: '[title=\'Selects all items\']',
    HIDE_SELECTED: '[title=\'Hides selected items\']',
    DISPLAY_ALL: '[title=\'Displays all items\']',
    HIDE_UNSELECTED: '[title=\'Hides unselected items\']',
    REMOVE_SELECTED: '[title=\'Removes selected items\']',
    REMOVE_UNSELECTED: '[title=\'Removes the unselected items\']'
  }
};

var TEST_FIXTURE_DATA = 'regression-tests/layers-dialog/layer-features/feat.kml';

describe('Feature grid', function() {
  before('Login', function() {
    cy.login();
  });

  it('Shows data', function() {
    // Upload a file
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload(TEST_FIXTURE_DATA);
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importKMLDialog.DIALOG).should('be.visible');
    cy.get(os.importKMLDialog.LAYER_TITLE_INPUT).should('be.visible');
    cy.get(os.importKMLDialog.OK_BUTTON).click();

    // Load a layer
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', TEST_FIXTURE_DATA + ' Features (7)');

    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Local.contextMenu.menuOptions.SHOW_FEATURES).click();
    cy.get('[title=\'' + TEST_FIXTURE_DATA + '\']').should('be.visible');

    // Check status bar
    cy.get(os.layerFeaturesDialog.DIALOG).within(function() {
      cy.get(os.layerFeaturesDialog.FOOTER_STATUS_TEXT).should('be.visible');
      cy.get(os.layerFeaturesDialog.FOOTER_STATUS_TEXT).should('contain', '7 records');
    });

    cy.get(os.layerFeaturesDialog.DIALOG).within(function() {
      cy.get(os.layerFeaturesDialog.SOURCE_GRID).should('be.visible');
      cy.get(os.layerFeaturesDialog.SOURCE_GRID).within(function() {
        cy.get(os.layerFeaturesDialog.HEADER_ROW).should('be.visible');
        // Check column headers
        cy.get(os.layerFeaturesDialog.HEADER_ROW).within(function() {
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).should('have.length', 15);
          cy.get(os.layerFeaturesDialog.HEADER_CELLS + ':empty').should('exist');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('TIME');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('MGRS');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LAT_DMS');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LON_DMS');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LAT');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LON');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LAT_DDM');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('LON_DDM');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('line');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('name');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('notes');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('objectid');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('ID');
          cy.get(os.layerFeaturesDialog.HEADER_CELLS).contains('description');
        });
      });

      // Check data
      cy.get(os.layerFeaturesDialog.VIEWPORT).should('be.visible');
      cy.get(os.layerFeaturesDialog.VIEWPORT).within(function() {
        cy.get(os.layerFeaturesDialog.CELLS).contains('18TWL8884215339');
      });
    });

    cy.get(os.layerFeaturesDialog.DESCRIPTION_CELL).should('be.visible');
    cy.get(os.layerFeaturesDialog.DESCRIPTION_CELL).contains('Show');
    cy.get(os.layerFeaturesDialog.DESCRIPTION_CELL).contains('Show').click();
    cy.get(os.descriptionInfoDialog.DIALOG, {timeout: 5000}).should('be.visible');
    cy.get(os.descriptionInfoDialog.DIALOG).within(function() {
      // Check description content
      cy.get(os.descriptionInfoDialog.CONTENT).should('be.visible');
      // https://github.com/cypress-io/cypress/issues/136 for why this is needed
      cy.get(os.descriptionInfoDialog.CONTENT).then(function($iframe) {
        var $body = $iframe.contents().find('body');
        expect($body.text()).to.equal('This is the description text.');
      });
      cy.get(os.descriptionInfoDialog.CLOSE_BUTTON).click();
    });
    cy.get(os.descriptionInfoDialog.DIALOG, {timeout: 5000}).should('not.exist');

    // Check selection
    cy.get(os.layerFeaturesDialog.ROWS_CELLS).should('be.visible');
    cy.get(os.layerFeaturesDialog.ROWS_CELLS).first().click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (1 selected)');

    // Check context menu works.
    cy.get(os.layerFeaturesDialog.ROWS_CELLS).first().rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.EXPORT).should('be.visible');

    cy.get(os.layerFeaturesDialog.contextMenu.DESELECT_ALL).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records');

    cy.get(os.layerFeaturesDialog.ROWS_CELLS).first().click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (1 selected)');

    cy.get(os.layerFeaturesDialog.ROWS_CELLS).first().rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.INVERT_SELECTION).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (6 selected)');

    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.SELECT_ALL).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (7 selected)');

    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.DESELECT_ALL).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records');

    cy.get(os.layerFeaturesDialog.ROWS_CELLS).last().click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (1 selected)');
    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.HIDE_SELECTED).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '6 records (1 hidden)');

    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.DISPLAY_ALL).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records');

    cy.get(os.layerFeaturesDialog.ROWS_CELLS).last().click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (1 selected)');
    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.HIDE_UNSELECTED).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '1 record (1 selected, 6 hidden)');
    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.DISPLAY_ALL).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '7 records (1 selected)');

    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.REMOVE_SELECTED).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '6 records');

    cy.get(os.layerFeaturesDialog.ROWS_CELLS).last().click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '6 records (1 selected)');
    cy.get(os.layerFeaturesDialog.GRID).rightClick();
    cy.get(os.layerFeaturesDialog.contextMenu.REMOVE_UNSELECTED).click();
    cy.get(os.layerFeaturesDialog.FULL_FOOTER_STATUS_TEXT).should('contain', '1 record (1 selected)');

    // Check Close button works
    cy.get(os.layerFeaturesDialog.DIALOG).within(function() {
      cy.get(os.layerFeaturesDialog.buttons.CLOSE).should('be.visible');
      cy.get(os.layerFeaturesDialog.buttons.CLOSE).click();
    });
    cy.get('[title=\'' + TEST_FIXTURE_DATA + '\']').should('not.exist');

    // Clean up
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).should('contain', TEST_FIXTURE_DATA + ' Features (1)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD).click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', TEST_FIXTURE_DATA + ' Features');
    cy.get(os.Application.PAGE).type('v');
  });
});
