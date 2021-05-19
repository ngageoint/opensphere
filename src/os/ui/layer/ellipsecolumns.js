goog.module('os.ui.layer.EllipseColumnsUI');
goog.module.declareLegacyNamespace();

const {getValues} = goog.require('goog.object');
const {ROOT} = goog.require('os');
const Units = goog.require('os.math.Units');
const Module = goog.require('os.ui.Module');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const AbstractMapping = goog.requireType('os.im.mapping.AbstractMapping');


/**
 * Convolve form directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',

  scope: {
    'layer': '='
  },

  templateUrl: ROOT + 'views/layer/ellipsecolumns.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the mist module
 */
Module.directive('ellipsecolumns', [directive]);


/**
 * Controller for the Ellipse Column Form.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {?angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Source
     * @type {*}
     * @private
     */
    this.source_ = this.scope_['layer'].getSource();

    /**
     * Importer
     * @type {*}
     * @private
     */
    this.importer_ = this.source_.getImporter();

    /**
     * Whether the user selected Circle or Ellipse
     * 0 - Circle || 1 - Ellipse
     * @type {boolean}
     */
    this['inputType'] = 0;

    /**
     * Column Options for the source
     * @type {Array<ColumnDefinition>}
     */
    this['columnOptions'] = this.source_ ? this.source_.getColumns() : [];

    /**
     * Array of the units available
     * @type {Array<string>}
     */
    this['unitOptions'] = getValues(Units);

    /**
     * The name of the circle Column
     * @type {string}
     */
    this['radiusColumn'] = undefined;

    /**
     * Units selected for circle
     * @type {string}
     */
    this['radiusUnits'] = undefined;

    /**
     * The name of the semi major Column
     * @type {string}
     */
    this['semiMajorColumn'] = undefined;

    /**
     * Units selected for semi major
     * @type {string}
     */
    this['semiMajorUnits'] = undefined;

    /**
     * The name of the semi minor Column
     * @type {string}
     */
    this['semiMinorColumn'] = undefined;

    /**
     * Units selected for semi minor
     * @type {string}
     */
    this['semiMinorUnits'] = undefined;

    /**
     * The name of the orientation Column
     * @type {string}
     */
    this['orientation'] = undefined;

    /**
     * Boolean for if we overwrite data or not
     * @type {boolean}
     */
    this['overwriteData'] = false;

    /**
     * Popover Text
     * @type {Object<string, string>}
     */
    this['help'] = {
      'circle': `Select a column that will be used as the Radius for this layer. This mapping will be applied to all new
        features loaded into or queried form this layer. Also select the units for the column, this will be converted to
        nmi or m for the resulting column.`,
      'ellipse': `Select a column for Semi Minor, Semi Major, and Orientation that will be used for this layer. This
        mapping will be applied to all new features loaded into or queried form this layer. Also select the units for
        the column, this will be converted to nmi or m for the resulting column.`,
      'overwriteData': `If there is already data in the feature's column for Radius, Semi Minor, Semi Major, or
        Orientation then it will be overwritten by the data in the selected column.`
    };

    this.scope_.$watchGroup(['ctrl.radiusColumn', 'ctrl.radiusUnits', 'ctrl.inputType', 'ctrl.semiMajorColumn',
      'ctrl.semiMajorUnits', 'ctrl.semiMinorColumn', 'ctrl.semiMinorUnits', 'ctrl.inputType', 'ctrl.orientation',
      'ctrl.overwriteData'], this.updateMappings.bind(this));

    this.init();
  }

  /**
   * Initialize the form
   */
  init() {
    var Mappings = this.importer_.getMappings();

    Mappings.forEach((mapping) => {
      const id = mapping.getId();
      const field = mapping.field;

      const column = this.columnOptions.find(({name}) => name === field);

      if (id == RadiusMapping.ID) {
        this['inputType'] = 0;
        this['radiusColumn'] = column;
        this['radiusUnits'] = mapping.units;
      } else if (id == SemiMajorMapping.ID) {
        this['inputType'] = 1;
        this['semiMajorColumn'] = column;
        this['semiMajorUnits'] = mapping.units;
      } else if (id == SemiMinorMapping.ID) {
        this['semiMinorColumn'] = column;
        this['semiMinorUnits'] = mapping.units;
      } else if (id == OrientationMapping.ID) {
        this['orientation'] = column;
      }
    });
  }


  /**
   * Update the Mappings
   */
  updateMappings() {
    const importerMappings = this.importer_.getMappings();
    const mappings = this.createMappings();

    let result = [...importerMappings];

    if (mappings.length != 0 && importerMappings.length != 0) {
      mappings.forEach((mapping) => {
        const im = result.findIndex(({toField}) => toField === mapping.toField);
        if (im >= 0) {
          result[im] = mapping;
        } else {
          result.push(mapping);
        }
      });
    } else if (importerMappings.length == 0) {
      result = mappings;
    }

    this.scope_.$parent['confirmValue'] = result;
  }

  /**
   * Create Mappings for Ellipse Data
   * @return {Array<AbstractMapping>}
   * @override
   */
  createMappings() {
    const mappings = [];
    const type = this['inputType'];

    if (type == 0 && this['radiusColumn'] && this['radiusUnits']) {
      const rm = new RadiusMapping();
      rm.field = this['radiusColumn'].name;
      rm.setUnits(this['radiusUnits']);
      mappings.push(rm);
    }
    if (type == 1 && this['semiMajorColumn'] && this['semiMajorUnits']) {
      var smaj = new SemiMajorMapping();
      smaj.field = this['semiMajorColumn'].name;
      smaj.setUnits(this['semiMajorUnits']);
      mappings.push(smaj);
    }
    if (type == 1 && this['semiMinorColumn'] && this['semiMinorUnits']) {
      var smin = new SemiMinorMapping();
      smin.field = this['semiMinorColumn'].name;
      smin.setUnits(this['semiMinorUnits']);
      mappings.push(smin);
    }
    if (type == 1 && this['orientation']) {
      var om = new OrientationMapping();
      om.field = this['orientation'].name;
      mappings.push(om);
    }

    return mappings;
  }
}


/**
 * Settings key for if this capability is enabled in configs
 * @type {string}
 */
const ALLOW_ELLIPSE_CONFIG = 'allowEllipseConfiguration';


/**
 * Launches the window to configure ellipse columns
 * @param {*} layer
 * @param {function()=} opt_confirmCallback
 */
const launchConfigureWindow = function(layer, opt_confirmCallback) {
  const confirm = opt_confirmCallback || callback_.bind(this, layer);
  const scopeOptions = {
    'layer': layer
  };

  const options = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    prompt: '<ellipsecolumns layer="layer"></ellipsecolumns>',
    windowOptions: {
      'label': 'Map Ellipse Columns',
      'x': 'center',
      'y': 'center',
      'width': '300',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    }
  });

  os.ui.window.ConfirmUI.launchConfirm(options, scopeOptions);
};


/**
 * The default callback that sets the mappings and re-imports data
 * @param {*} layer
 * @param {Array<AbstractMapping>} value
 * @private
 */
const callback_ = function(layer, value) {
  const source = layer ? layer.getSource() : undefined;
  const importer = source ? source.getImporter() : undefined;

  importer.setMappings(value);
  source.loadRequest();
};


exports = {
  Controller,
  directive,
  ALLOW_ELLIPSE_CONFIG,
  launchConfigureWindow
};
