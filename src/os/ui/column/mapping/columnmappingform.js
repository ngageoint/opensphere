goog.module('os.ui.column.mapping.ColumnMappingFormUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.column.mapping.ColumnModelTreeUI');

const {getRandomString} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const osArray = goog.require('os.array');
const ColumnMapping = goog.require('os.column.ColumnMapping');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');
const DataManager = goog.require('os.data.DataManager');
const IFilterable = goog.require('os.filter.IFilterable');
const osImplements = goog.require('os.implements');
const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const ColumnModelNode = goog.require('os.ui.column.mapping.ColumnModelNode');
const osWindow = goog.require('os.ui.window');

const IColumnMapping = goog.requireType('os.column.IColumnMapping');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');

/**
 * The columnmappingform directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'columnMapping': '='
  },
  templateUrl: ROOT + 'views/column/mapping/columnmappingform.html',
  controller: Controller,
  controllerAs: 'cmFormCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'columnmappingform';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the columnmappingform directive
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

    /**
     * @type {!Array<!IDataDescriptor>}
     * @private
     */
    this.cachedDescriptorList_ = [];

    /**
     * @type {IColumnMapping}
     * @private
     */
    this.cm_ = $scope['columnMapping'];

    /**
     * @type {Array<ColumnModelNode>}
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

    $timeout(function() {
      this.element_.find('input[name="name"]').focus();
    }.bind(this));

    $scope.$on('layerpicker.layerselected', this.validateLayers_.bind(this));
    $scope.$on('columnpicker.columnselected', this.validateLayers_.bind(this));
    $scope.$on('columnmapping.remove', this.removeColumnModel_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * Initializes the form. This creates the cached descriptor list, reads the existing mapping to construct a UI
   * model for it, and adds a fresh row if the existing mapping is empty.
   *
   * @private
   */
  init_() {
    var descList = DataManager.getInstance().getDescriptors();
    var columns = this.cm_.getColumns();
    var descMap = {};

    for (var i = 0, ii = descList.length; i < ii; i++) {
      var desc = descList[i];

      var dp = desc.getDataProvider();
      if (dp && dp.getEnabled() && osImplements(desc, IFilterable.ID)) {
        const filterable = /** @type {IFilterable} */ (desc);
        descMap[filterable.getFilterKey()] = desc;
        this.cachedDescriptorList_.push(desc);
      }
    }

    if (columns.length > 0) {
      for (var j = 0, jj = columns.length; j < jj; j++) {
        var columnModel = columns[j];
        var node = this.getModelNode_(columnModel);

        // put the initial layer on the node so we can default the picker to it
        node.setInitialLayer(descMap[columnModel.layer]);
        this['tree'].push(node);
      }
    } else {
      // no columns, add two fresh ones
      this.add();
      this.add();
    }

    this.timeout_(this.validateLayers_.bind(this));
  }

  /**
   * Adds a new column model to the mapping.
   *
   * @export
   */
  add() {
    this.cm_.addColumn('', '');
    var columns = this.cm_.getColumns();
    var newModel = columns[columns.length - 1];
    var node = this.getModelNode_(newModel);
    this['tree'].push(node);
    this['tree'] = this['tree'].slice();
  }

  /**
   * Listener for removing column models.
   *
   * @param {angular.Scope.Event} event
   * @param {ColumnModelNode} node
   * @private
   */
  removeColumnModel_(event, node) {
    var idx = this['tree'].indexOf(node);
    if (idx !== -1) {
      this['tree'].splice(idx, 1);
      this['tree'] = this['tree'].slice();
      ui.apply(this.scope_);
    }

    this.cm_.removeColumn(node['model']);
    this.validateLayers_();
  }

  /**
   * Listener for layer selection. Checks if there are any duplicate layers and sets the form validity.
   *
   * @private
   */
  validateLayers_() {
    this['duplicateLayerText'] = '';
    var columns = this.cm_.getColumns();

    var found = osArray.findDuplicates(columns, function(item) {
      // find duplicate layers and for empty strings (i.e. user hasn't picker yet) just return a random
      return item.layer || getRandomString();
    });

    var duplicates = columns.length > 1 && found.length > 0;
    var enoughLayers = columns.length > 1;

    if (duplicates) {
      const node = this['tree'].find((item) => item.getInitialLayer().getFilterKey() === found[0]['layer']);
      const dupeTitle = node.getInitialLayer().getTitle();
      this['duplicateLayerText'] = `Duplicate layers are not supported (<b>${dupeTitle}</b>)`;
    }

    var incompleteLayer = columns.find(function(item) {
      return (!item.layer || item.layer.length == 0 || !item.column || item.column.length == 0);
    });

    this.scope_['cmForm'].$setValidity('duplicateLayer', !duplicates);
    this.scope_['cmForm'].$setValidity('notEnoughLayers', enoughLayers);
    this.scope_['cmForm'].$setValidity('incompleteLayers', (incompleteLayer == null));
  }

  /**
   * Creates a model node from a column model.
   *
   * @param {osx.column.ColumnModel} columnModel
   * @return {ColumnModelNode}
   * @private
   */
  getModelNode_(columnModel) {
    var node = new ColumnModelNode();
    node.setColumnModel(columnModel);
    node.setMapping(this.cm_);
    node.setGetFn(this.getLayersFunction.bind(this));
    return node;
  }

  /**
   * Validates the column mapping against all other existing mappings to verify that no duplicate layer/column pairs
   * have been chosen.
   *
   * @export
   */
  validate() {
    this['otherCMText'] = '';
    var columns = this.cm_.getColumns();
    var id = this.cm_.getId();
    var columnsValid = true;

    for (var i = 0, ii = columns.length; i < ii; i++) {
      var c = columns[i];
      var hash = ColumnMappingManager.hashColumn(c);
      var ownerMapping = ColumnMappingManager.getInstance().getOwnerMapping(hash);
      if (ownerMapping && ownerMapping.getId() !== id) {
        columnsValid = false;
        this['otherCMText'] = 'One of your columns (<b>' + c.column + '</b>) is currently in use on the <b>' +
            ownerMapping.getName() + '</b> column association.';
        break;
      }
    }

    this.scope_['cmForm'].$setValidity('reusedColumn', columnsValid);
  }

  /**
   * Confirms the add/edit of the mapping.
   *
   * @export
   */
  confirm() {
    var cmm = ColumnMappingManager.getInstance();
    cmm.remove(this.cm_.getId());
    cmm.add(this.cm_);
    this.cancel();
  }

  /**
   * Cancels the add/edit of the mapping.
   *
   * @export
   */
  cancel() {
    osWindow.close(this.element_);
  }

  /**
   * Returns the cached descriptor list. Used by the layer pickers in the form.
   *
   * @return {!Array<!IDataDescriptor>}
   * @export
   */
  getLayersFunction() {
    return this.cachedDescriptorList_;
  }
}

/**
 * Launches the column mapping window with the provided column mapping
 *
 * @param {IColumnMapping=} opt_cm
 */
const launchColumnMappingWindow = (opt_cm) => {
  var id = 'columnmappingform';
  if (osWindow.exists(id)) {
    osWindow.bringToFront(id);
    return;
  }

  var options = {
    id: id,
    x: 'center',
    y: 'center',
    label: (opt_cm ? 'Edit' : 'Create') + ' Column Association',
    'show-close': true,
    modal: true,
    width: 800,
    height: 400,
    icon: 'fa fa-columns'
  };

  var cm = opt_cm ? opt_cm.clone() : new ColumnMapping();
  var scopeOptions = {
    'columnMapping': cm
  };

  var template = `<${directiveTag} column-mapping="columnMapping"></${directiveTag}>`;
  osWindow.create(options, template, undefined, undefined, undefined, scopeOptions);
};

exports = {
  Controller,
  directive,
  directiveTag,
  launchColumnMappingWindow
};
