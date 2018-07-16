goog.provide('os.ui.column.mapping.ColumnMappingSetting');
goog.provide('os.ui.column.mapping.ColumnMappingSettings');
goog.provide('os.ui.column.mapping.ColumnMappingSettingsCtrl');

goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingEventType');
goog.require('os.column.ColumnMappingManager');
goog.require('os.column.ColumnMappingTypeMethod');
goog.require('os.ui.Module');
goog.require('os.ui.column.mapping.ColumnMappingImportUI');
goog.require('os.ui.column.mapping.ColumnMappingNode');
goog.require('os.ui.column.mapping.columnMappingExportDirective');
goog.require('os.ui.column.mapping.columnMappingFormDirective');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportProcess');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.ui.column.mapping.ColumnMappingSettings = function() {
  os.ui.column.mapping.ColumnMappingSettings.base(this, 'constructor');

  var fm = os.file.FileManager.getInstance();
  var im = os.ui.im.ImportManager.getInstance();

  // csv
  fm.registerContentTypeMethod(new os.column.ColumnMappingTypeMethod());
  im.registerImportUI('columnmapping', new os.ui.column.mapping.ColumnMappingImportUI());

  this.setLabel('Column Associations');
  this.setDescription('Configure your column associations');
  this.setTags(['column', 'mapping', 'data']);
  this.setIcon('fa fa-columns');
  this.setUI('columnmappingsettings');
};
goog.inherits(os.ui.column.mapping.ColumnMappingSettings, os.ui.config.SettingPlugin);


/**
 * @type {string}
 * @const
 */
os.ui.column.mapping.ColumnMappingSettings.ID = 'columnMappingSettings';


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnMappingSettings.prototype.getId = function() {
  return os.ui.column.mapping.ColumnMappingSettings.ID;
};


/**
 * The column mapping settings UI directive
 * @return {angular.Directive}
 */
os.ui.column.mapping.ColumnMappingSettingsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/column/mapping/columnmappingsettings.html',
    controller: os.ui.column.mapping.ColumnMappingSettingsCtrl,
    controllerAs: 'cmCtrl'
  };
};


os.ui.Module.directive('columnmappingsettings', [os.ui.column.mapping.ColumnMappingSettingsDirective]);



/**
 * Controller for location settings
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.column.ColumnMappingManager}
   * @private
   */
  this.cmm_ = os.column.ColumnMappingManager.getInstance();
  this.cmm_.listen(os.column.ColumnMappingEventType.MAPPINGS_CHANGE, this.onMappingsChange_, false, this);


  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;
  /**
   * @type {Array<os.ui.column.mapping.ColumnMappingNode>}
   */
  this['mappingTree'] = [];

  $scope.$on('$destroy', this.destroy_.bind(this));

  this.onMappingsChange_();
};


/**
 * @private
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.destroy_ = function() {
  this.cmm_.unlisten(os.column.ColumnMappingEventType.MAPPINGS_CHANGE, this.onMappingsChange_, false, this);
  this.cmm_ = null;

  this.scope_ = null;
  this.timeout_ = null;
};


/**
 * Handler for mapping changes. Updates the mappings tree to reflect the new state.
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.onMappingsChange_ = function(opt_event) {
  var mappings = this.cmm_.getAll();
  mappings = mappings.sort(os.ui.column.mapping.ColumnMappingSettings.sortFn_);
  this['mappingTree'] = mappings.map(os.ui.column.mapping.ColumnMappingSettings.mapFn_);
  os.ui.apply(this.scope_);

  this.timeout_(goog.bind(function() {
    this.scope_.$broadcast('slickgrid.invalidateRows');
  }, this));
};


/**
 * Launches the create column mapping form.
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.create = function() {
  os.ui.column.mapping.ColumnMappingSettings.launchColumnMappingWindow();
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype,
    'create',
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.create);


/**
 * Launches the export column mappings form.
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.export = function() {
  var selected = /** @type {Array<os.ui.column.mapping.ColumnMappingNode>} */ (this.scope_['selected']);
  var items = os.column.ColumnMappingManager.getInstance().getAll();
  var selectedItems = [];

  if (selected.length > 0) {
    for (var i = 0, ii = selected.length; i < ii; i++) {
      // don't include the subnodes if they are selected in the tree
      if (selected[i] instanceof os.ui.column.mapping.ColumnMappingNode) {
        goog.array.insert(selectedItems, selected[i].getColumnMapping());
      } else {
        var parent = selected[i].getParent();
        if (parent instanceof os.ui.column.mapping.ColumnMappingNode) {
          goog.array.insert(selectedItems, parent.getColumnMapping());
        }
      }
    }
  }

  var scopeOptions = {
    'mappings': items,
    'selectedMappings': selectedItems
  };

  var windowOptions = {
    'label': 'Export Column Associations',
    'icon': 'fa fa-download',
    'x': 'center',
    'y': 'center',
    'width': 360,
    'height': 'auto',
    'show-close': 'true',
    'modal': 'true'
  };

  var template = '<columnmappingexport></columnmappingexport>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype,
    'export',
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.export);


/**
 * Launches the import column mappings form.
 */
os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.import = function() {
  var importProcess = new os.ui.im.ImportProcess();
  importProcess.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE));
  importProcess.begin();
};
goog.exportProperty(
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype,
    'import',
    os.ui.column.mapping.ColumnMappingSettingsCtrl.prototype.import);


/**
 * Launches the column mapping window with the provided column mapping
 * @param {os.column.IColumnMapping=} opt_cm
 */
os.ui.column.mapping.ColumnMappingSettings.launchColumnMappingWindow = function(opt_cm) {
  var id = 'columnmappingform';
  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
    return;
  }

  var options = {
    id: id,
    x: 'center',
    y: 'center',
    label: (opt_cm ? 'Edit' : 'Create') + ' Column Association',
    'show-close': true,
    'no-scroll': true,
    modal: true,
    width: 800,
    height: 400,
    icon: 'fa fa-columns'
  };

  var cm = opt_cm ? opt_cm.clone() : new os.column.ColumnMapping();
  var scopeOptions = {
    'columnMapping': cm
  };

  var template = '<columnmappingform column-mapping="columnMapping"></columnmappingform>';
  os.ui.window.create(options, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Mapping function for column mappings to nodes.
 * @param {os.column.IColumnMapping} mapping
 * @return {os.ui.column.mapping.ColumnMappingNode}
 * @private
 */
os.ui.column.mapping.ColumnMappingSettings.mapFn_ = function(mapping) {
  var node = new os.ui.column.mapping.ColumnMappingNode();
  node.setColumnMapping(mapping);
  return node;
};


/**
 * Sorting function for column mappings.
 * @param {os.column.IColumnMapping} a
 * @param {os.column.IColumnMapping} b
 * @return {number}
 * @private
 */
os.ui.column.mapping.ColumnMappingSettings.sortFn_ = function(a, b) {
  return goog.array.defaultCompare(a.getName(), b.getName());
};
