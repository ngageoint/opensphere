goog.provide('os.ui.PropertyInfoCtrl');
goog.provide('os.ui.SlickPropertiesAsyncRenderer');
goog.provide('os.ui.formatter.PropertiesFormatter');
goog.provide('os.ui.propertyInfoDirective');

goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.defines');
goog.require('os.style');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.slick.formatter');
goog.require('os.ui.slick.slickGridDirective');
goog.require('os.ui.util.autoHeightDirective');
goog.require('os.ui.window');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.propertyInfoDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'feature': '='
    },
    templateUrl: os.ROOT + 'views/propertyinfo.html',
    controller: os.ui.PropertyInfoCtrl,
    controllerAs: 'info'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('propertyinfo', [os.ui.propertyInfoDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.PropertyInfoCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  this.scope_['gridCols'] = os.ui.PropertyInfoCtrl.GRID_COLUMNS_;
  this.scope_['gridOptions'] = {
    'enableColumnReorder': false,
    'forceFitColumns': true,
    'multiColumnSort': false,
    'multiSelect': false,
    'defaultFormatter': os.ui.slick.formatter.urlNewTabFormatter,
    'enableAsyncPostRender': true
  };

  $scope.$watch('feature', this.onPropertyChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * The columns to use for feature info grids.
 * @type {Array.<os.data.ColumnDefinition>}
 * @const
 * @private
 */
os.ui.PropertyInfoCtrl.GRID_COLUMNS_ = [
  {'id': 'field', 'field': 'field', 'name': 'Field', 'sortable': true, 'width': 40},
  {'id': 'value', 'field': 'value', 'name': 'Value', 'sortable': true}
];


/**
 * Clean up.
 * @private
 */
os.ui.PropertyInfoCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Handle feature changes on the scope.
 * @param {ol.Feature} newVal The new value
 * @param {ol.Feature} oldVal The old value
 * @private
 *
 * @todo Should polygons display the center point? See {@link ol.geom.Polygon#getInteriorPoint}. What about line
 *       strings? We can get the center of the extent, but that's not very helpful. For now, only display the location
 *       for point geometries.
 */
os.ui.PropertyInfoCtrl.prototype.onPropertyChange_ = function(newVal, oldVal) {
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
};


/**
 * Launches a feature info window for the provided feature.
 * @param {!string} id The id to use for the window.
 * @param {!Object} object The object to display.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
os.ui.launchPropertyInfo = function(id, object, opt_titleDetail) {
  var winLabel = 'Property Info';

  if (opt_titleDetail) {
    winLabel += ' for ' + opt_titleDetail;
  }

  var windowId = goog.string.buildString('propertyInfo', id);

  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
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
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
goog.exportSymbol('os.ui.launchPropertyInfo', os.ui.launchPropertyInfo);


/**
 * Formats the source column
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {*} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.formatter.PropertiesFormatter = function(row, cell, value, columnDef, node) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return /** @type {string} */ (value);
  }
  columnDef['asyncPostRender'] = os.ui.SlickPropertiesAsyncRenderer;
  return '<div class="btn btn-link">Show Properties</div>';
};


/**
 *
 * @param {!Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
os.ui.SlickPropertiesAsyncRenderer = function(elem, row, dataContext, colDef) {
  if (dataContext) {
    var id = /** @type {!string} */ (dataContext.get(os.Fields.ID).toString());
    var properties = /** @type {!Object} */ (dataContext.get(os.Fields.PROPERTIES));
    if (properties instanceof Object && typeof id === 'string') {
      var $elem = $(elem);
      var doc = elem.ownerDocument;
      var myWin = doc.defaultView || doc.parentWindow;
      goog.object.forEach(properties, os.ui.processProperty);
      $elem.click(function() {
        if (os.inIframe(myWin)) {
          os.ui.launchPropertyInfo(id, properties);
        } else {
          myWin['os']['ui']['launchPropertyInfo'](id, properties);
        }
      });
    }
  }
};


/**
 *
 * @param {*} value
 * @param {*} index
 * @param {Object} object
 */
os.ui.processProperty = function(value, index, object) {
  if (goog.isObject(value)) {
    delete object[index];
  }
};
