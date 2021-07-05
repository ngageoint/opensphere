goog.module('os.ui.column.mapping.ColumnMappingSettingsUI');
goog.module.declareLegacyNamespace();

const {defaultCompare, insert} = goog.require('goog.array');
const {ROOT} = goog.require('os');
const ColumnMappingEventType = goog.require('os.column.ColumnMappingEventType');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {directiveTag: columnMappingExportUi} = goog.require('os.ui.column.mapping.ColumnMappingExportUI');
const {launchColumnMappingWindow} = goog.require('os.ui.column.mapping.ColumnMappingFormUI');
const ColumnMappingNode = goog.require('os.ui.column.mapping.ColumnMappingNode');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const ImportProcess = goog.require('os.ui.im.ImportProcess');

const osWindow = goog.require('os.ui.window');


/**
 * The column mapping settings UI directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/column/mapping/columnmappingsettings.html',
  controller: Controller,
  controllerAs: 'cmCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'columnmappingsettings';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for location settings
 * @unrestricted
 */
class Controller {
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
     * @type {ColumnMappingManager}
     * @private
     */
    this.cmm_ = ColumnMappingManager.getInstance();
    this.cmm_.listen(ColumnMappingEventType.MAPPINGS_CHANGE, this.onMappingsChange_, false, this);


    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;
    /**
     * @type {Array<ColumnMappingNode>}
     */
    this['mappingTree'] = [];

    $scope.$on('$destroy', this.destroy_.bind(this));

    this.onMappingsChange_();
  }

  /**
   * @private
   */
  destroy_() {
    this.cmm_.unlisten(ColumnMappingEventType.MAPPINGS_CHANGE, this.onMappingsChange_, false, this);
    this.cmm_ = null;

    this.scope_ = null;
    this.timeout_ = null;
  }

  /**
   * Handler for mapping changes. Updates the mappings tree to reflect the new state.
   *
   * @param {goog.events.Event=} opt_event
   * @private
   */
  onMappingsChange_(opt_event) {
    var mappings = this.cmm_.getAll();
    mappings = mappings.sort(sortMappings);
    this['mappingTree'] = mappings.map(mappingToNode);
    apply(this.scope_);

    this.timeout_(function() {
      this.scope_.$broadcast('slickgrid.invalidateRows');
    }.bind(this));
  }

  /**
   * Launches the create column mapping form.
   *
   * @export
   */
  create() {
    launchColumnMappingWindow();
  }

  /**
   * Launches the export column mappings form.
   *
   * @export
   */
  export() {
    var selected = /** @type {Array<ColumnMappingNode>} */ (this.scope_['selected']);
    var items = ColumnMappingManager.getInstance().getAll();
    var selectedItems = [];

    if (selected.length > 0) {
      for (var i = 0, ii = selected.length; i < ii; i++) {
        // don't include the subnodes if they are selected in the tree
        if (selected[i] instanceof ColumnMappingNode) {
          insert(selectedItems, selected[i].getColumnMapping());
        } else {
          var parent = selected[i].getParent();
          if (parent instanceof ColumnMappingNode) {
            insert(selectedItems, parent.getColumnMapping());
          }
        }
      }
    }

    var scopeOptions = {
      'mappings': items,
      'selectedMappings': selectedItems,
      'yesButtonClass': 'btn-danger'
    };

    var windowOptions = {
      'label': 'Export Column Associations',
      'icon': 'fa fa-download',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'show-close': 'true',
      'modal': 'true'
    };

    var template = `<${columnMappingExportUi}></${columnMappingExportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * Launches the import column mappings form.
   *
   * @export
   */
  import() {
    var importProcess = new ImportProcess();
    importProcess.setEvent(new ImportEvent(ImportEventType.FILE));
    importProcess.begin();
  }
}

/**
 * Mapping function for column mappings to nodes.
 *
 * @param {os.column.IColumnMapping} mapping
 * @return {ColumnMappingNode}
 */
const mappingToNode = function(mapping) {
  var node = new ColumnMappingNode();
  node.setColumnMapping(mapping);
  return node;
};

/**
 * Sorting function for column mappings.
 *
 * @param {os.column.IColumnMapping} a
 * @param {os.column.IColumnMapping} b
 * @return {number}
 */
const sortMappings = function(a, b) {
  return defaultCompare(a.getName(), b.getName());
};

exports = {
  Controller,
  directive,
  directiveTag
};
