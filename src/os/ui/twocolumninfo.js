goog.provide('os.ui.TwoColumnInfoCtrl');
goog.provide('os.ui.twoColumnInfoDirective');

goog.require('goog.object');
goog.require('goog.string');
goog.require('os.ui');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.slick.formatter');
goog.require('os.ui.slick.slickGridDirective');
goog.require('os.ui.util.autoHeightDirective');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.twoColumnInfoDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'object': '=',
      'colname1': '=',
      'colname2': '='
    },
    templateUrl: os.ROOT + 'views/twocolumninfo.html',
    controller: os.ui.TwoColumnInfoCtrl,
    controllerAs: 'twoColCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('twocolumninfo', [os.ui.twoColumnInfoDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.TwoColumnInfoCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {Array.<Object>}
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
};


/**
 * The columns to use for feature info grids.
 * @type {Array.<os.data.ColumnDefinition>}
 * @const
 * @private
 */


/**
 * Clean up.
 * @private
 */
os.ui.TwoColumnInfoCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Handle feature changes on the scope.
 * @param {Object} newVal
 * @param {Object} oldVal
 * @private
 */
os.ui.TwoColumnInfoCtrl.prototype.onPropertyChange_ = function(newVal, oldVal) {
  this.scope_['properties'] = [];

  if (newVal) {
    var properties = this.scope_['object'];
    for (var key in properties) {
      if (!goog.isObject(properties[key])) {
        this.scope_['properties'].push({'id': key, 'field': key, 'value': properties[key]});
      }
    }
    os.ui.apply(this.scope_);
  }
};
