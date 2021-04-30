goog.module('os.ui.layer.EllipseColumnsUI');

const {getValues} = goog.require('goog.object');
const {ROOT} = goog.require('os');
const Units = goog.require('os.math.Units');
const Module = goog.require('os.ui.Module');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * Convolve form directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',

  scope: {
    'columns': '=',
    'prevConfig': '='
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
     * Whether the user selected Circle or Ellipse
     * 0 - Circle || 1 - Ellipse
     * @type {boolean}
     */
    this['inputType'] = 0;

    /**
     * Column Options for the source
     * @type {Array<ColumnDefinition>}
     */
    this['columnOptions'] = this.scope_['columns'];

    /**
     * Array of the units available
     * @type {Array<string>}
     */
    this['unitOptions'] = getValues(Units);

    /**
     * The name of the circle Column
     * @type {string}
     */
    this['circleColumn'] = undefined;

    /**
     * Units selected for circle
     * @type {string}
     */
    this['circleUnits'] = undefined;

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

    this.scope_.$watchGroup(['ctrl.circleColumn', 'ctrl.circleUnits', 'ctrl.inputType', 'ctrl.semiMajorColumn',
      'ctrl.semiMajorUnits', 'ctrl.semiMinorColumn', 'ctrl.semiMinorUnits', 'ctrl.inputType', 'ctrl.orientation',
      'ctrl.overwriteData'],
    function() {
      const type = this['inputType'];
      const overwriteData = this['overwriteData'];
      const value = {
        'type': type,
        'keepOriginal': !overwriteData
      };

      if (type == 1) {
        value['semiMajor'] = this['semiMajorColumn'];
        value['semiMajorUnits'] = this['semiMajorUnits'];
        value['semiMinor'] = this['semiMinorColumn'];
        value['semiMinorUnits'] = this['semiMinorUnits'];
        value['orientation'] = this['orientation'];
      } else {
        value['radius'] = type == 0 ? this['circleColumn'] : undefined;
        value['radiusUnits'] = type == 0 ? this['circleUnits'] : undefined;
      }

      this.scope_.$parent['confirmValue'] = value;
    }.bind(this));

    this.init();
  }

  /**
   * Initialize the form
   */
  init() {
    const cfg = this.scope_['prevConfig'] || undefined;
    this['inputType'] = cfg ? cfg['type'] : 0;

    if (cfg && cfg['type'] == 0) {
      this['circleColumn'] = cfg['radius'];
      this['circleUnits'] = cfg['radiusUnits'];
    } else if (cfg && cfg['type'] == 1) {
      this['semiMajorColumn'] = cfg['semiMajor'];
      this['semiMajorUnits'] = cfg['semiMajorUnits'];
      this['semiMinorColumn'] = cfg['semiMinor'];
      this['semiMinorUnits'] = cfg['semiMinorUnits'];
      this['orientation'] = cfg['orientation'];
    }
  }
}


exports = {
  Controller,
  directive
};
