/// <reference types="Cypress" />
var core = require('../../../support/selectors/core.js');
var dialogs = require('../../../support/selectors/dialogs.js');
var imports = require('../../../support/selectors/imports.js');
var layers = require('../../../support/selectors/layers.js');
var shared = require('../../../support/selectors/shared.js');

describe('Feature list', function() {
  before('Login', function() {
    cy.login();

    // Import test data
    cy.get(core.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.upload('regression-tests/layers-dialog/feature-list/feat.kml');
    cy.get(imports.importDataDialog.NEXT_BUTTON).click();
    cy.get(imports.importKMLDialog.OK_BUTTON).click();
    cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (7)');

    // Open features list dialog
    cy.get(shared.Tree.ROW_4).rightClick();
    cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
  });

  it('Status bar', function() {
    cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records');
    cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
  });

  it('Column headers', function() {
    cy.get(dialogs.featureListDialog.DIALOG).within(function() {
      cy.get(shared.Grid.GRID).should('be.visible');
      cy.get(shared.Grid.HEADER_ROW).should('be.visible');
      cy.get(shared.Grid.HEADER_CELL_1).should('have.text', '');
      cy.get(shared.Grid.HEADER_CELL_2).contains('TIME');
      cy.get(shared.Grid.HEADER_CELL_3).contains('MGRS');
      cy.get(shared.Grid.HEADER_CELL_4).contains('LAT_DMS');
      cy.get(shared.Grid.HEADER_CELL_5).contains('LON_DMS');
      cy.get(shared.Grid.HEADER_CELL_6).contains('LAT');
      cy.get(shared.Grid.HEADER_CELL_7).contains('LON');
      cy.get(shared.Grid.HEADER_CELL_8).contains('LAT_DDM');
      cy.get(shared.Grid.HEADER_CELL_9).contains('LON_DDM');
      cy.get(shared.Grid.HEADER_CELL_10).contains('name');
      cy.get(shared.Grid.HEADER_CELL_11).contains('description');
      cy.get(shared.Grid.HEADER_CELL_12).contains('line');
      cy.get(shared.Grid.HEADER_ROW).contains('notes'); // Columns reversed GUI vs CLI, less specific selector
      cy.get(shared.Grid.HEADER_ROW).contains('objectid'); // Columns reversed GUI vs CLI, less specific selector
      cy.get(shared.Grid.HEADER_CELL_15).contains('ID');
    });
  });

  it('Spot check data', function() {
    cy.get(dialogs.featureListDialog.DIALOG).within(function() {
      cy.get(shared.Grid.ROW_1).within(function() {
        cy.get(shared.Grid.CELL_3).contains('18TWL8884215339');
        cy.get(shared.Grid.CELL_5).contains('073° 56\' 49.44" W');
        cy.get(shared.Grid.CELL_7).contains('-73.9470660219183');
        cy.get(shared.Grid.CELL_9).contains('073° 56.82\' W');
      });

      cy.get(shared.Grid.ROW_3).within(function() {
        cy.get(shared.Grid.CELL_2).should('have.text', '');
        cy.get(shared.Grid.CELL_4).should('contain', '40° 39\' 52.97" N');
        cy.get(shared.Grid.CELL_6).should('contain', '40.66471445143568');
        cy.get(shared.Grid.CELL_8).should('contain', '40° 39.88\' N');
      });

      cy.get(shared.Grid.ROW_5).within(function() {
        cy.get(shared.Grid.CELL_3).should('contain', '18TWL8449008066');
        cy.get(shared.Grid.CELL_4).should('contain', '40° 43\' 09.08" N');
        cy.get(shared.Grid.CELL_5).should('contain', '073° 59\' 58.63" W');
        cy.get(shared.Grid.CELL_6).should('contain', '40.71919');
      });
    });
  });

  it('Description dialog', function() {
    // Setup
    cy.wait(100); // Link not immediately ready when dialog loads

    // Test
    cy.get(dialogs.featureListDialog.DIALOG)
        .find(shared.Grid.CELL_11)
        .contains('Show')
        .click();
    cy.get(dialogs.descriptionInfoDialog.DIALOG).should('be.visible');

    // See https://github.com/cypress-io/cypress/issues/136 for why this is needed
    cy.get(dialogs.descriptionInfoDialog.CONTENT).then(function($iframe) {
      var $body = $iframe.contents().find('body');
      expect($body.text()).to.equal('This is the description text.');
    });

    // Clean up
    cy.get(dialogs.descriptionInfoDialog.CLOSE_BUTTON).click();
    cy.get('body').type('{ctrl}', {release: false});
    cy.get(dialogs.featureListDialog.DIALOG)
        .find(shared.Grid.ROW_1)
        .find(shared.Grid.CELL_2)
        .click();
  });

  describe('Selections (mouse/keyboard)', function() {
    before('Login', function() {
      // Setup
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Make single selection', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Change single selection', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Remove single selection', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
    });

    it('Make multiple selection (ctrl)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Change multiple selection (ctrl)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_6)
            .find(shared.Grid.CELL_2)
            .click();
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Remove multiple selection (ctrl)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
    });

    it('Make multiple selection (shift)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{shift}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (3 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Change multiple selection (shift)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{shift}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{shift}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_2).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (3 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_4)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Remove multiple selection (shift)', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_1)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{shift}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{shift}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (3 selected)');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_1)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
    });
  });

  describe('Context menu', function() {
    before('Login', function() {
      // Setup
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Menu options without selection', function() {
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).should('be.visible');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Select All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Deselect All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Invert');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).should('not.contain', 'Sort Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Hide Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Hide Unselected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Display All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Remove Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Remove Unselected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Export');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).should('not.contain', 'Go To');
    });

    it('Menu options with selection', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');

      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).should('be.visible');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Select All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Deselect All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Invert');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Sort Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Hide Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Hide Unselected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Display All');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Remove Selected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Remove Unselected');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Export');
      cy.get(dialogs.featureListDialog.contextMenu.PANEL).contains('Go To');

      // Clean up
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .find(shared.Grid.CELL_2)
          .click();
    });

    it('Select All', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.GRID)
            .rightClick();
      });
      cy.get(dialogs.featureListDialog.contextMenu.SELECT_ALL).click();
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (7 selected)');

      // Clean up
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DESELECT_ALL).click();
    });

    it('Deselect All', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.SELECT_ALL).click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (7 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DESELECT_ALL).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'selected');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });
    });

    it('Invert', function() {
      // Setup
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.GRID).rightClick();
      });
      cy.get(dialogs.featureListDialog.contextMenu.INVERT).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (5 selected)');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
      });

      // Clean up
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DESELECT_ALL).click();
    });

    it('Sort Selected', function() {
      // Setup
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_1)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8884215339');
        cy.get(shared.Grid.ROW_2)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL9489920441');
        cy.get(shared.Grid.ROW_3)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL9341202125');
        cy.get(shared.Grid.ROW_4)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8661903835');
        cy.get(shared.Grid.ROW_5)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8449008066');
        cy.get(shared.Grid.ROW_6)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8444208022');
        cy.get(shared.Grid.ROW_7)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8519809280');
        cy.get(shared.Grid.GRID).rightClick();
      });
      cy.get(dialogs.featureListDialog.contextMenu.SORT_SELECTED).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');
      cy.get(dialogs.featureListDialog.DIALOG).within(function() {
        cy.get(shared.Grid.ROW_1).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_2).should('have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_3).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_4).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_5).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_6).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_7).should('not.have.class', shared.Grid.ROW_IS_SELECTED_CLASS);
        cy.get(shared.Grid.ROW_1)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8449008066');
        cy.get(shared.Grid.ROW_2)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8519809280');
        cy.get(shared.Grid.ROW_3)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8884215339');
        cy.get(shared.Grid.ROW_4)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL9489920441');
        cy.get(shared.Grid.ROW_5)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL9341202125');
        cy.get(shared.Grid.ROW_6)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8661903835');
        cy.get(shared.Grid.ROW_7)
            .find(shared.Grid.CELL_3)
            .should('contain', '18TWL8444208022');
      });

      // Clean up
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Hide Selected', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_3)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.HIDE_SELECTED).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '6 records (1 hidden)');
      cy.get(dialogs.featureListDialog.DIALOG).should('not.contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (6/7)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DISPLAY_ALL).click();
    });

    it('Hide Unselected', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_3)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_1)
          .should('contain', '18TWL8884215339');
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.HIDE_UNSELECTED).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '1 record (1 selected, 6 hidden)');
      cy.get(dialogs.featureListDialog.DIALOG).should('not.contain', '18TWL8884215339');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_1)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (1/7)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DISPLAY_ALL).click();
    });

    it('Display All (after hide)', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.HIDE_SELECTED).click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DISPLAY_ALL).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .should('contain', '18TWL9341202125');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .should('contain', '18TWL8449008066');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (7)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Display All (after remove)', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_3)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_5)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.REMOVE_SELECTED).click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.DISPLAY_ALL).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '4 records');
      cy.get(dialogs.featureListDialog.DIALOG)
          .should('not.contain', '18TWL9341202125')
          .should('not.contain', '18TWL8449008066')
          .should('not.contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (4)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.REFRESH).click();
      cy.wait(200); // Row not immediately ready after refresh
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Remove Selected', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_3)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (1 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.REMOVE_SELECTED).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '6 records');
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'hidden');
      cy.get(dialogs.featureListDialog.DIALOG).should('not.contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (6)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.REFRESH).click();
      cy.wait(200); // Row not immediately ready after refresh
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Remove Unselected', function() {
      // Setup
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_3)
          .click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .find(shared.Grid.CELL_3)
          .click();

      // Test
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '7 records (2 selected)');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .should('contain', '18TWL8444208022');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_7)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.REMOVE_UNSELECTED).click();
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('contain', '2 records');
      cy.get(dialogs.featureListDialog.DIALOG_FOOTER).should('not.contain', 'hidden');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_1)
          .should('contain', '18TWL8444208022');
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_2)
          .should('contain', '18TWL8519809280');
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).should('contain', 'feat.kml Features (2)');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.REFRESH).click();
      cy.wait(200); // Row not immediately ready after refresh
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
    });

    it('Export', function() {
      // Test
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.EXPORT).click();
      cy.get(dialogs.exportDataDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.exportDataDialog.CANCEL_BUTTON).click();
    });

    it('Go to', function() {
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.get(shared.Tree.ROW_4).click;
      cy.get(shared.layerStyle.BUTTON).click();
      cy.get(shared.layerStyle.SIZE_SLIDER)
          .type('{rightarrow}{rightarrow}{rightarrow}{rightarrow}');
      cy.imageComparison('Before go to');
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_2)
          .click();
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.GRID)
          .rightClick();
      cy.get(dialogs.featureListDialog.contextMenu.GO_TO).click();
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
      cy.imageComparison('After go to');

      // Clean up
      cy.get(shared.Tree.ROW_4).rightClick();
      cy.get(layers.layersTab.Tree.contextMenu.SHOW_FEATURES).click();
      cy.get('body').type('{ctrl}', {release: false});
      cy.get(dialogs.featureListDialog.DIALOG)
          .find(shared.Grid.ROW_6)
          .find(shared.Grid.CELL_3)
          .click();
    });
  });

  it('Close button', function() {
    cy.get(dialogs.featureListDialog.DIALOG).should('be.visible');
    cy.get(dialogs.featureListDialog.DIALOG).within(function() {
      cy.get(dialogs.featureListDialog.CLOSE_BUTTON).click();
    });
    cy.get(dialogs.featureListDialog.DIALOG).should('not.exist');
  });
});
