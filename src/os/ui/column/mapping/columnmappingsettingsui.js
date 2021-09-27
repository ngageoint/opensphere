goog.declareModuleId('os.ui.column.mapping.ColumnMappingSettingsUI');

import {ROOT} from '../../../os.js';
import ImportEvent from '../../im/importevent.js';
import ImportEventType from '../../im/importeventtype.js';
import ImportProcess from '../../im/importprocess.js';
import Module from '../../module.js';
import {apply} from '../../ui.js';
import * as osWindow from '../../window.js';
import {directiveTag as columnMappingExportUi} from './columnmappingexport.js';
import {launchColumnMappingWindow} from './columnmappingform.js';
import ColumnMappingNode from './columnmappingnode.js';

const {defaultCompare, insert} = goog.require('goog.array');
const ColumnMappingEventType = goog.require('os.column.ColumnMappingEventType');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');


/**
 * The column mapping settings UI directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'columnmappingsettings';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for location settings
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
