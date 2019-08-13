goog.provide('os.ui.column.mapping.MappingExpressionCtrl');
goog.provide('os.ui.column.mapping.mappingExpressionDirective');
goog.require('os.ui.Module');
goog.require('os.ui.layer.layerPickerDirective');
goog.require('os.xsd.DataType');


/**
 * The mappingexpression directive
 *
 * @return {angular.Directive}
 */
os.ui.column.mapping.mappingExpressionDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'node': '='
    },
    templateUrl: os.ROOT + 'views/column/mapping/mappingexpression.html',
    controller: os.ui.column.mapping.MappingExpressionCtrl,
    controllerAs: 'exprCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('mappingexpression', [os.ui.column.mapping.mappingExpressionDirective]);



/**
 * Controller for the mappingexpression directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.MappingExpressionCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  var node = /** @type {os.ui.column.mapping.ColumnModelNode} */ ($scope['node']);

  /**
   * @type {?osx.column.ColumnModel}
   * @private
   */
  this.model_ = node['model'];

  /**
   * @type {?os.ui.ogc.IOGCDescriptor}
   */
  this['layer'] = node['initialLayer'];

  /**
   * @type {?os.ogc.FeatureTypeColumn}
   */
  this['column'] = null;

  /**
   * @type {?Array<os.ogc.FeatureTypeColumn>}
   */
  this['columns'] = null;

  if (this['layer']) {
    this.setLayer_(this['layer']);
  }

  this.timeout_(goog.bind(function() {
    var selElement = this.element_.find('.js-mapping-expression__column-select');
    selElement.select2({
      'placeholder': 'Select column...'
    });
    this.element_.find('.select2-choice').attr('tabIndex', 0);

    if (!this['columns']) {
      // if the columns aren't available, disable it
      selElement.select2('disable');
    }
  }, this));

  $scope.$on('layerpicker.layerselected', this.onLayerChange_.bind(this));
  $scope.$watch('exprCtrl.column', this.onColumnChange_.bind(this));
};


/**
 * Handles changes to the layer.
 *
 * @param {angular.Scope.Event} event
 * @param {os.ui.ogc.IOGCDescriptor} layer
 * @private
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.onLayerChange_ = function(event, layer) {
  if (layer) {
    this.setLayer_(layer);
  }
};


/**
 * Handles changes to the column.
 *
 * @param {?os.ogc.FeatureTypeColumn} newValue
 * @param {?os.ogc.FeatureTypeColumn} oldValue
 * @private
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.onColumnChange_ = function(newValue, oldValue) {
  if (newValue) {
    this.model_['column'] = newValue['name'];
  }
  this.scope_.$emit('columnpicker.columnselected');
};


/**
 * Sets the layer and gets the columns for it.
 *
 * @param {os.filter.IFilterable} layer
 * @private
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.setLayer_ = function(layer) {
  var featureType = layer.getFeatureType();
  this.model_['layer'] = layer.getFilterKey();
  this.scope_['node'].setInitialLayer(layer);

  if (!featureType) {
    layer.setDescribeCallback(this.describeCallback_.bind(this));
    layer.isFeatureTypeReady();
  } else {
    var columns = featureType.getColumns();
    this.setColumns_(columns);
  }
};


/**
 * Handles describefeaturetype completion.
 *
 * @private
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.describeCallback_ = function() {
  var layer = /** @type {os.ui.ogc.IOGCDescriptor} */ (this['layer']);
  var featureType = layer.getFeatureType();

  if (featureType) {
    this.setColumns_(featureType.getColumns());
  }
};


/**
 * Sets the columns for the select2 column picker.
 *
 * @param {Array} columns
 * @private
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.setColumns_ = function(columns) {
  var columnName = this.model_['column'];
  this['column'] = null;
  columns = columns.filter(function(column) {
    if (column['type'] !== os.xsd.DataType.STRING && column['type'] !== os.xsd.DataType.DECIMAL &&
        column['type'] !== os.xsd.DataType.INTEGER) {
      // only include string and numeric type columns. this is based on the limited set of types we convert to in
      // os.ogc.wfs.DescribeFeatureTypeParser, and intended to avoid displaying geometry/time columns.
      return false;
    }

    if (column['name'] === columnName) {
      this['column'] = column;
    }

    return true;
  }, this);

  this['columns'] = columns;

  this.model_['column'] = (this['column'] == null) ? null : this.model_['column'];

  this.timeout_(goog.bind(function() {
    // this tells the select2 to update to reflect the new set of columns
    this.element_.find('.js-mapping-expression__column-select').change().select2('enable');
  }, this));
};


/**
 * Trivial empty group ID function for the layer picker.
 *
 * @param {os.data.IDataDescriptor|os.filter.IFilterable} layer The layer to group.
 * @return {?string}
 * @export
 */
os.ui.column.mapping.MappingExpressionCtrl.prototype.groupFn = function(layer) {
  return '';
};
