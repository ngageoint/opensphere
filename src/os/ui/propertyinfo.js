goog.module('os.ui.PropertyInfoUI');

goog.require('os.ui.slick.SlickGridUI');

const {buildString} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const {urlNewTabFormatter} = goog.require('os.ui.slick.formatter');
const {bringToFront, create, exists} = goog.require('os.ui.window');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * The featureinfo directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'feature': '='
  },
  templateUrl: ROOT + 'views/propertyinfo.html',
  controller: Controller,
  controllerAs: 'info'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'propertyinfo';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the featureinfo directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    this.scope_['gridCols'] = Controller.GRID_COLUMNS_;
    this.scope_['gridOptions'] = {
      'enableColumnReorder': false,
      'forceFitColumns': true,
      'multiColumnSort': false,
      'multiSelect': false,
      'defaultFormatter': urlNewTabFormatter,
      'enableAsyncPostRender': true
    };

    $scope.$watch('feature', this.onPropertyChange_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Handle feature changes on the scope.
   *
   * @param {ol.Feature} newVal The new value
   * @param {ol.Feature} oldVal The old value
   * @private
   *
   * @todo Should polygons display the center point? See {@link ol.geom.Polygon#getInteriorPoint}. What about line
   *       strings? We can get the center of the extent, but that's not very helpful. For now, only display the location
   *       for point geometries.
   */
  onPropertyChange_(newVal, oldVal) {
    this.scope_['lon'] = undefined;
    this.scope_['lat'] = undefined;
    this.scope_['description'] = undefined;
    this.scope_['properties'] = [];

    if (newVal) {
      var properties = this.scope_['feature'];
      for (var key in properties) {
        this.scope_['properties'].push({'id': key, 'field': key, 'value': properties[key]});
      }
    }
  }
}


/**
 * The columns to use for feature info grids.
 * @type {Array<ColumnDefinition>}
 * @const
 * @private
 */
Controller.GRID_COLUMNS_ = [
  {'id': 'field', 'field': 'field', 'name': 'Field', 'sortable': true, 'width': 40},
  {'id': 'value', 'field': 'value', 'name': 'Value', 'sortable': true}
];


/**
 * Launches a feature info window for the provided feature.
 *
 * @param {!string} id The id to use for the window.
 * @param {!Object} object The object to display.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
const launchPropertyInfo = function(id, object, opt_titleDetail) {
  var winLabel = 'Property Info';

  if (opt_titleDetail) {
    winLabel += ' for ' + opt_titleDetail;
  }

  var windowId = buildString('propertyInfo', id);

  if (exists(windowId)) {
    bringToFront(windowId);
  } else {
    // create a new window
    var scopeOptions = {
      'feature': object
    };

    var windowOptions = {
      'id': windowId,
      'label': winLabel,
      'icon': 'fa fa-map-marker',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '200',
      'max-width': '800',
      'height': '400',
      'min-height': '200',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = '<propertyinfo feature="feature"></propertyinfo>';
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
goog.exportSymbol('os.ui.launchPropertyInfo', launchPropertyInfo);

exports = {
  Controller,
  directive,
  directiveTag,
  launchPropertyInfo
};
