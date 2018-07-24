goog.provide('os.ui.column.mapping.ColumnMappingFormCtrl');
goog.provide('os.ui.column.mapping.columnMappingFormDirective');

goog.require('os.ui.Module');
goog.require('os.ui.column.mapping.ColumnModelNode');
goog.require('os.ui.column.mapping.columnModelTreeDirective');


/**
 * The columnmappingform directive
 * @return {angular.Directive}
 */
os.ui.column.mapping.columnMappingFormDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'columnMapping': '='
    },
    templateUrl: os.ROOT + 'views/column/mapping/columnmappingform.html',
    controller: os.ui.column.mapping.ColumnMappingFormCtrl,
    controllerAs: 'cmFormCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('columnmappingform', [os.ui.column.mapping.columnMappingFormDirective]);



/**
 * Controller function for the columnmappingform directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.ColumnMappingFormCtrl = function($scope, $element, $timeout) {
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

  /**
   * @type {!Array<!os.ui.ogc.IOGCDescriptor>}
   * @private
   */
  this.cachedDescriptorList_ = [];

  /**
   * @type {os.column.IColumnMapping}
   * @private
   */
  this.cm_ = $scope['columnMapping'];

  /**
   * @type {Array<os.ui.column.mapping.ColumnModelNode>}
   */
  this['tree'] = [];

  /**
   * @type {string}
   */
  this['duplicateLayerText'] = '';

  /**
   * @type {string}
   */
  this['notEnoughLayerText'] = 'A column association must include at least 2 different columns.';

  /**
   * @type {string}
   */
  this['otherCMText'] = '';

  this.init_();

  $timeout(goog.bind(function() {
    this.element_.find('input[name="name"]').focus();
  }, this));

  $scope.$on('layerpicker.layerselected', this.validateLayers_.bind(this));
  $scope.$on('columnmapping.remove', this.removeColumnModel_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * Initializes the form. This creates the cached descriptor list, reads the existing mapping to construct a UI
 * model for it, and adds a fresh row if the existing mapping is empty.
 * @private
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.init_ = function() {
  var descList = os.dataManager.getDescriptors();
  var columns = this.cm_.getColumns();
  var descMap = {};

  for (var i = 0, ii = descList.length; i < ii; i++) {
    var desc = descList[i];
    try {
      desc = /** @type {os.ui.ogc.IOGCDescriptor} */ (desc);
      if (desc.isWfsEnabled() === true) {
        descMap[desc.getUrlKey()] = desc;
        this.cachedDescriptorList_.push(desc);
      }
    } catch (e) {
      // not a WFS enabled descriptor
    }
  }

  if (columns.length > 0) {
    for (var j = 0, jj = columns.length; j < jj; j++) {
      var columnModel = columns[j];
      var node = this.getModelNode_(columnModel);

      // put the initial layer on the node so we can default the picker to it
      node.setInitialLayer(descMap[columnModel['layer']]);
      this['tree'].push(node);
    }
  } else {
    // no columns, add two fresh ones
    this.add();
    this.add();
  }

  this.timeout_(this.validateLayers_.bind(this));
};


/**
 * Adds a new column model to the mapping.
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.add = function() {
  this.cm_.addColumn('', '');
  var columns = this.cm_.getColumns();
  var newModel = columns[columns.length - 1];
  var node = this.getModelNode_(newModel);
  this['tree'].push(node);
  this['tree'] = this['tree'].slice();
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype,
    'add',
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype.add);


/**
 * Listener for removing column models.
 * @param {angular.Scope.Event} event
 * @param {os.ui.column.mapping.ColumnModelNode} node
 * @private
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.removeColumnModel_ = function(event, node) {
  var idx = this['tree'].indexOf(node);
  if (idx !== -1) {
    this['tree'].splice(idx, 1);
    this['tree'] = this['tree'].slice();
    os.ui.apply(this.scope_);
  }

  this.cm_.removeColumn(node['model']);
  this.validateLayers_();
};


/**
 * Listener for layer selection. Checks if there are any duplicate layers and sets the form validity.
 * @private
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.validateLayers_ = function() {
  this['duplicateLayerText'] = '';
  var columns = this.cm_.getColumns();

  var found = os.array.findDuplicates(columns, function(item) {
    // find duplicate layers and for empty strings (i.e. user hasn't picker yet) just return a random
    return item['layer'] || goog.string.getRandomString();
  });

  var duplicates = columns.length > 1 && found.length > 0;
  var enoughLayers = columns.length > 1;

  if (duplicates) {
    var node = goog.array.find(this['tree'], function(item) {
      return item.getInitialLayer().getUrlKey() === found[0]['layer'];
    });
    this['duplicateLayerText'] =
        'Duplicate layers are not supported (<b>' + node.getInitialLayer().getTitle() + '</b>)';
  }

  this.scope_['cmForm'].$setValidity('duplicateLayer', !duplicates);
  this.scope_['cmForm'].$setValidity('notEnoughLayers', enoughLayers);
};


/**
 * Creates a model node from a column model.
 * @param {os.column.ColumnModel} columnModel
 * @return {os.ui.column.mapping.ColumnModelNode}
 * @private
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.getModelNode_ = function(columnModel) {
  var node = new os.ui.column.mapping.ColumnModelNode();
  node.setColumnModel(columnModel);
  node.setMapping(this.cm_);
  node.setGetFn(this.getLayersFunction.bind(this));
  return node;
};


/**
 * Validates the column mapping against all other existing mappings to verify that no duplicate layer/column pairs
 * have been chosen.
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.validate = function() {
  this['otherCMText'] = '';
  var columns = this.cm_.getColumns();
  var id = this.cm_.getId();
  var columnsValid = true;

  for (var i = 0, ii = columns.length; i < ii; i++) {
    var c = columns[i];
    var hash = os.column.ColumnMappingManager.hashColumn(c);
    var ownerMapping = os.column.ColumnMappingManager.getInstance().getOwnerMapping(hash);
    if (ownerMapping && ownerMapping.getId() !== id) {
      columnsValid = false;
      this['otherCMText'] = 'One of your columns (<b>' + c['column'] + '</b>) is currently in use on the <b>' +
          ownerMapping.getName() + '</b> column association.';
      break;
    }
  }

  this.scope_['cmForm'].$setValidity('reusedColumn', columnsValid);
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype,
    'validate',
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype.validate);


/**
 * Confirms the add/edit of the mapping.
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.confirm = function() {
  var cmm = os.column.ColumnMappingManager.getInstance();
  cmm.remove(this.cm_.getId());
  cmm.add(this.cm_);
  this.cancel();
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype,
    'confirm',
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype.confirm);


/**
 * Cancels the add/edit of the mapping.
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype,
    'cancel',
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype.cancel);


/**
 * Returns the cached descriptor list. Used by the layer pickers in the form.
 * @return {!Array.<!os.ui.ogc.IOGCDescriptor>}
 */
os.ui.column.mapping.ColumnMappingFormCtrl.prototype.getLayersFunction = function() {
  return this.cachedDescriptorList_;
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype,
    'getLayersFunction',
    os.ui.column.mapping.ColumnMappingFormCtrl.prototype.getLayersFunction);
