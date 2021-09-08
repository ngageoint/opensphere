goog.module('os.ui.column.mapping.MappingExpressionUI');

goog.require('os.ui.layer.LayerPickerUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const DataType = goog.require('os.xsd.DataType');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const IFilterable = goog.requireType('os.filter.IFilterable');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const ColumnModelNode = goog.requireType('os.ui.column.mapping.ColumnModelNode');
const IOGCDescriptor = goog.requireType('os.ui.ogc.IOGCDescriptor');


/**
 * The mappingexpression directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'node': '='
  },
  templateUrl: ROOT + 'views/column/mapping/mappingexpression.html',
  controller: Controller,
  controllerAs: 'exprCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'mappingexpression';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the mappingexpression directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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

    var node = /** @type {ColumnModelNode} */ ($scope['node']);

    /**
     * @type {?osx.column.ColumnModel}
     * @private
     */
    this.model_ = node['model'];

    /**
     * @type {?IOGCDescriptor}
     */
    this['layer'] = node['initialLayer'];

    /**
     * @type {?FeatureTypeColumn}
     */
    this['column'] = null;

    /**
     * @type {?Array<FeatureTypeColumn>}
     */
    this['columns'] = null;

    if (this['layer']) {
      this.setLayer_(this['layer']);
    }

    this.timeout_(function() {
      var selElement = this.element_.find('.js-mapping-expression__column-select');
      selElement.select2({
        'placeholder': 'Select column...'
      });
      this.element_.find('.select2-choice').attr('tabIndex', 0);

      if (!this['columns']) {
        // if the columns aren't available, disable it
        selElement.select2('disable');
      }
    }.bind(this));

    $scope.$on('layerpicker.layerselected', this.onLayerChange_.bind(this));
    $scope.$watch('exprCtrl.column', this.onColumnChange_.bind(this));
  }

  /**
   * Handles changes to the layer.
   *
   * @param {angular.Scope.Event} event
   * @param {IOGCDescriptor} layer
   * @private
   */
  onLayerChange_(event, layer) {
    if (layer) {
      this.setLayer_(layer);
    }
  }

  /**
   * Handles changes to the column.
   *
   * @param {?FeatureTypeColumn} newValue
   * @param {?FeatureTypeColumn} oldValue
   * @private
   */
  onColumnChange_(newValue, oldValue) {
    if (newValue) {
      this.model_['column'] = newValue['name'];
    }
    this.scope_.$emit('columnpicker.columnselected');
  }

  /**
   * Sets the layer and gets the columns for it.
   *
   * @param {IOGCDescriptor} layer
   * @private
   */
  setLayer_(layer) {
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
  }

  /**
   * Handles describefeaturetype completion.
   *
   * @private
   */
  describeCallback_() {
    var layer = /** @type {IOGCDescriptor} */ (this['layer']);
    var featureType = layer.getFeatureType();

    if (featureType) {
      this.setColumns_(featureType.getColumns());
    }
  }

  /**
   * Sets the columns for the select2 column picker.
   *
   * @param {Array} columns
   * @private
   */
  setColumns_(columns) {
    var columnName = this.model_['column'];
    this['column'] = null;
    columns = columns.filter(function(column) {
      if (column['type'] !== DataType.STRING && column['type'] !== DataType.DECIMAL &&
          column['type'] !== DataType.INTEGER) {
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

    this.timeout_(function() {
      // this tells the select2 to update to reflect the new set of columns
      this.element_.find('.js-mapping-expression__column-select').change().select2('enable');
    }.bind(this));
  }

  /**
   * Trivial empty group ID function for the layer picker.
   *
   * @param {IDataDescriptor|IFilterable} layer The layer to group.
   * @return {?string}
   * @export
   */
  groupFn(layer) {
    return '';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
