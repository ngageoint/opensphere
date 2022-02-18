goog.declareModuleId('os.ui.TwoColumnInfoUI');

import './slick/slickgrid.js';
import {isObject} from '../object/object.js';
import {ROOT} from '../os.js';
import Module from './module.js';
import SlickGridEvent from './slick/slickgridevent.js';
import {apply} from './ui.js';

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');


/**
 * The featureinfo directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'object': '=',
    'colname1': '=',
    'colname2': '='
  },
  templateUrl: ROOT + 'views/twocolumninfo.html',
  controller: Controller,
  controllerAs: 'twoColCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'twocolumninfo';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the featureinfo directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * @type {Array<Object>}
     */
    this.scope_['properties'] = [];

    var colname1 = this.scope_['colname1'] || 'Key';
    var colname2 = this.scope_['colname2'] || 'Value';

    var gridcolumns = [
      {'id': 'field', 'field': 'field', 'name': colname1, 'sortable': true, 'width': 40},
      {'id': 'value', 'field': 'value', 'name': colname2, 'sortable': true}
    ];
    /**
     * @type {Object}
     */
    this.scope_['gridCols'] = gridcolumns;

    /**
     * @type {Object}
     */
    this.scope_['gridOptions'] = {
      'enableColumnReorder': false,
      'forceFitColumns': true,
      'multiColumnSort': false,
      'multiSelect': false
    };

    $scope.$watch('object', this.onPropertyChange_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * The columns to use for feature info grids.
   * @type {Array<ColumnDefinition>}
   * @const
   * @private
   */


  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.timeout_ = null;
  }

  /**
   * Handle feature changes on the scope.
   *
   * @param {Object} newVal
   * @param {Object} oldVal
   * @private
   */
  onPropertyChange_(newVal, oldVal) {
    this.scope_['properties'] = [];

    if (newVal) {
      var properties = this.scope_['object'];
      for (var key in properties) {
        if (!isObject(properties[key])) {
          this.scope_['properties'].push({'id': key, 'field': key, 'value': properties[key]});
        }
      }
      apply(this.scope_);
    }

    this.timeout_(function() {
      this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    }.bind(this));
  }
}
