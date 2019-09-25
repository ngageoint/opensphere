/// <reference types="Cypress" />
var opensphere = require('../../support/selectors/opensphere.js');
var dialogs = require('../../support/selectors/dialogs.js');
var imports = require('../../support/selectors/imports.js');
var layers = require('../../support/selectors/layers.js');
var shared = require('../../support/selectors/shared.js');

describe('Toolbar left', function() {
  before('Login', function() {
    cy.login();
  });

  describe('Add data buttons', function() {
    it('Add data dialog (via button)', function() {
      // Setup
      cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.BUTTON).click();
      cy.get(dialogs.addDataDialog.DIALOG).should('be.visible');
      cy.get(dialogs.addDataDialog.DIALOG_HEADER).should('contain', 'Add Data');

      // Clean up
      cy.get(dialogs.addDataDialog.DIALOG_CLOSE).click();
      cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');
    });

    it('Import file (via button)', function() {
      // Setup
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.OPEN_FILE_BUTTON).click();
      cy.get(imports.importDataDialog.DIALOG).should('be.visible');
      cy.get(imports.importDataDialog.DIALOG_HEADER).should('contain', 'Import Data');

      // Clean up
      cy.get(imports.importDataDialog.DIALOG_CLOSE).click();
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');
    });
  });

  describe('Add data dropdown', function() {
    it('Menu options', function() {
      // Setup
      cy.get(opensphere.Toolbar.addData.Menu.PANEL).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.PANEL).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.ADD_DATA).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.OPEN_FILE_OR_URL).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.ADD_CESIUM_ION_ASSET).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_WORLD_IMAGERY).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_STREET_MAP).should('be.visible');

      // Clean up
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.PANEL).should('not.exist');
    });

    it('Add data dialog (via dropdown)', function() {
      // Setup
      cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.ADD_DATA).click();
      cy.get(dialogs.addDataDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.addDataDialog.CLOSE_BUTTON).click();
      cy.get(dialogs.addDataDialog.DIALOG).should('not.exist');
    });

    it('Import file (via dropdown)', function() {
      // Setup
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.OPEN_FILE_OR_URL).click();
      cy.get(imports.importDataDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(imports.importDataDialog.CANCEL_BUTTON).click();
      cy.get(imports.importDataDialog.DIALOG).should('not.exist');
    });

    it('Cesium ion asset', function() {
      // Setup
      cy.get(imports.importCesiumIonAssetDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.ADD_CESIUM_ION_ASSET).click();
      cy.get(imports.importCesiumIonAssetDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(imports.importCesiumIonAssetDialog.CANCEL_BUTTON).click();
      cy.get(imports.importCesiumIonAssetDialog.DIALOG).should('not.exist');
    });

    it('Recently used layers', function() {
      // Setup
      cy.get(layers.Dialog.DIALOG).should('be.visible');
      cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Layers');
      cy.get(layers.layersTab.Tree.STREET_MAP_TILES).should('be.visible');
      cy.get(layers.layersTab.Tree.WORLD_IMAGERY_TILES).should('be.visible');
      cy.get(layers.layersTab.Tree.STREET_MAP_TILES)
          .find(shared.Tree.ROW_CHECKBOX)
          .should('have.class', shared.Tree.ROW_CHECKED_CLASS);
      cy.get(layers.layersTab.Tree.WORLD_IMAGERY_TILES)
          .find(shared.Tree.ROW_CHECKBOX)
          .should('have.class', shared.Tree.ROW_CHECKED_CLASS);

      // Test
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_STREET_MAP).click();
      cy.get(layers.layersTab.Tree.STREET_MAP_TILES).should('not.exist');
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_WORLD_IMAGERY).click();
      cy.get(layers.layersTab.Tree.WORLD_IMAGERY_TILES).should('not.exist');

      // Clean up
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_STREET_MAP).click();
      cy.get(layers.layersTab.Tree.STREET_MAP_TILES).should('be.visible');
      cy.get(opensphere.Toolbar.addData.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.addData.Menu.RECENT_WORLD_IMAGERY).click();
      cy.get(layers.layersTab.Tree.WORLD_IMAGERY_TILES).should('be.visible');
      cy.get(layers.layersTab.Tree.STREET_MAP_TILES)
          .find(shared.Tree.ROW_CHECKBOX)
          .should('have.class', shared.Tree.ROW_CHECKED_CLASS);
      cy.get(layers.layersTab.Tree.WORLD_IMAGERY_TILES)
          .find(shared.Tree.ROW_CHECKBOX)
          .should('have.class', shared.Tree.ROW_CHECKED_CLASS);
    });
  });

  it('Layers button', function() {
    // Setup
    cy.get(layers.Dialog.DIALOG).should('be.visible');

    // Test
    cy.get(layers.Dialog.DIALOG_CLOSE).click();
    cy.get(layers.Dialog.DIALOG).should('not.exist');
    cy.get(opensphere.Toolbar.LAYERS_TOGGLE_BUTTON).click();
    cy.get(layers.Dialog.DIALOG).should('be.visible');

    // Clean up
    // none - not needed
  });

  it('Drawing tool', function() {
    // Setup
    cy.get(opensphere.Application.PAGE).type('+++++++++++++++++++++++++'); // zoom in
    cy.get(opensphere.Toolbar.Drawing.BUTTON)
        .should('not.have.class', opensphere.Toolbar.Drawing.BUTTON_IS_ACTIVE_CLASS);

    // Test
    cy.get(opensphere.Toolbar.Drawing.BUTTON).click();
    cy.get(opensphere.Toolbar.Drawing.BUTTON).should('have.class', opensphere.Toolbar.Drawing.BUTTON_IS_ACTIVE_CLASS);

    // TODO: The rest of this test needs to be completed.
    // There were problems getting the map to respond to mouse inputs.
    // https://github.com/cypress-io/cypress/issues/2768

    // draw an area
    // drawing tool context menu appears
    // query the area
    // an area was created

    // Clean up
    cy.get(opensphere.Toolbar.Drawing.BUTTON).click();
    cy.get(opensphere.Toolbar.Drawing.BUTTON)
        .should('not.have.class', opensphere.Toolbar.Drawing.BUTTON_IS_ACTIVE_CLASS);
  });

  describe('Drawing tool menu', function() {
    it('Menu options', function() {
      // Setup
      cy.get(opensphere.Toolbar.Drawing.Menu.PANEL).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.Drawing.Menu.PANEL).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.BOX).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.CIRCLE).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.POLYGON).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.LINE).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.CHOOSE_AREA).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.ENTER_COORDINATES).should('be.visible');
      cy.get(opensphere.Toolbar.Drawing.Menu.WHOLE_WORLD).should('be.visible');

      // Clean up
      cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.Drawing.Menu.PANEL).should('not.exist');
    });

    it('Choose area', function() {
      // Setup
      cy.get(dialogs.chooseAreaDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.Drawing.Menu.CHOOSE_AREA).click();
      cy.get(dialogs.chooseAreaDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.chooseAreaDialog.CANCEL_BUTTON).click();
      cy.get(dialogs.chooseAreaDialog.DIALOG).should('not.exist');
    });

    it('Enter coordinates', function() {
      // Setup
      cy.get(dialogs.enterAreaCoordinatesDialog.DIALOG).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.Drawing.Menu.ENTER_COORDINATES).click();
      cy.get(dialogs.enterAreaCoordinatesDialog.DIALOG).should('be.visible');

      // Clean up
      cy.get(dialogs.enterAreaCoordinatesDialog.DIALOG_CLOSE).click();
      cy.get(dialogs.enterAreaCoordinatesDialog.DIALOG).should('not.exist');
    });

    it('Whole world query', function() {
      // Setup
      cy.get(layers.Dialog.DIALOG).should('be.visible');
      cy.get(layers.areasTab.TAB).click();
      cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Areas');
      cy.get(layers.areasTab.Tree.WHOLE_WORLD_AREA).should('not.exist');

      // Test
      cy.get(opensphere.Toolbar.Drawing.Menu.BUTTON).click();
      cy.get(opensphere.Toolbar.Drawing.Menu.WHOLE_WORLD).click();
      cy.get(layers.areasTab.Tree.WHOLE_WORLD_AREA).should('be.visible');

      // Clean up
      cy.get(layers.areasTab.Tree.WHOLE_WORLD_AREA).click();
      cy.get(layers.areasTab.Tree.WHOLE_WORLD_AREA)
          .find(layers.areasTab.Tree.REMOVE_AREA_BUTTON).click();
      cy.get(layers.areasTab.Tree.WHOLE_WORLD_AREA).should('not.exist');
      cy.get(layers.layersTab.TAB).click();
      cy.get(layers.Dialog.ACTIVE_TAB).should('contain', 'Layers');
    });
  });

  it('Measure tool', function() {
    // Setup
    cy.get(opensphere.Toolbar.Measure.BUTTON)
        .should('not.have.class', opensphere.Toolbar.Measure.BUTTON_IS_ACTIVE_CLASS);

    // Test
    cy.get(opensphere.Toolbar.Measure.BUTTON).click();
    cy.get(opensphere.Toolbar.Measure.BUTTON).should('have.class', opensphere.Toolbar.Measure.BUTTON_IS_ACTIVE_CLASS);

    // TODO: The rest of this test needs to be completed.
    // There were problems getting the map to respond to mouse inputs.
    // https://github.com/cypress-io/cypress/issues/2768

    // click a point
    // move the mouse
    // click another point
    // measurement was taken

    // Clean up
    cy.get(opensphere.Toolbar.Measure.BUTTON).click();
    cy.get(opensphere.Toolbar.Measure.BUTTON)
        .should('not.have.class', opensphere.Toolbar.Measure.BUTTON_IS_ACTIVE_CLASS);
  });

  it('Interpolation', function() {
    // Setup
    cy.get(opensphere.Toolbar.Measure.Menu.PANEL).should('not.exist');

    // Test
    cy.get(opensphere.Toolbar.Measure.Menu.BUTTON).click();
    cy.get(opensphere.Toolbar.Measure.Menu.PANEL).should('be.visible');
    cy.get(opensphere.Toolbar.Measure.Menu.MEASURE_GEODESIC).should('be.visible');
    cy.get(opensphere.Toolbar.Measure.Menu.MEASURE_RHUMB_LINE).should('be.visible');

    // Clean up
    cy.get(opensphere.Toolbar.Measure.Menu.BUTTON).click();
    cy.get(opensphere.Toolbar.Measure.Menu.PANEL).should('not.exist');
  });

  it('Clear', function() {
    // Setup
    cy.get(dialogs.clearDialog.DIALOG).should('not.exist');

    // Test
    cy.get(opensphere.Toolbar.CLEAR_BUTTON).click();
    cy.get(dialogs.clearDialog.DIALOG).should('be.visible');
    cy.get(dialogs.clearDialog.Items.ALL).should('be.visible');
    cy.get(dialogs.clearDialog.Items.STATES).should('be.visible');
    cy.get(dialogs.clearDialog.OK_BUTTON).should('be.visible');
    cy.get(dialogs.clearDialog.CANCEL_BUTTON).should('be.visible');

    // Clean up
    cy.get(dialogs.clearDialog.CANCEL_BUTTON).click();
    cy.get(dialogs.clearDialog.DIALOG).should('not.exist');
  });
});
