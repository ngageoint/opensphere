goog.declareModuleId('os.ui.filter.ui.CopyFilterUI');

import './copyfilterpicker.js';
import {ROOT} from '../../../os.js';
import ChecklistEvent from '../../checklistevent.js';
import Module from '../../module.js';
import FilterAdd from '../../query/cmd/filteraddcmd.js';
import {close} from '../../window.js';
import WindowEventType from '../../windoweventtype.js';
import {filterColumns, getFilterKeyFromType} from '../filter.js';

const {insert} = goog.require('goog.array');
const {assertString} = goog.require('goog.asserts');
const {getCount} = goog.require('goog.object');
const {caseInsensitiveCompare, getRandomString} = goog.require('goog.string');
const ColumnMapping = goog.require('os.column.ColumnMapping');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const DataManager = goog.require('os.data.DataManager');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');

const IColumnMapping = goog.requireType('os.column.IColumnMapping');
const FilterEntry = goog.requireType('os.filter.FilterEntry');
const {default: CopyFilterPickerModel} = goog.requireType('os.ui.filter.ui.CopyFilterPickerModel');


/**
 * The copyfilter directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'filterEntry': '=',
    'layerId': '='
  },
  templateUrl: ROOT + 'views/filter/copyfilter.html',
  controller: Controller,
  controllerAs: 'copyFilterCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'copyfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the copyfilter directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * The column names contained in the filter we are copying.
     * @type {Array<string>}
     * @private
     */
    this.sourceColumnNames_ = [];

    /**
     * The entry we are copying.
     * @type {?FilterEntry}
     * @private
     */
    this.sourceEntry_ = /** @type {FilterEntry} */ ($scope['filterEntry']);

    /**
     * The layer key we are copying from.
     * @type {string}
     * @private
     */
    this['sourceFilterKey'] = getFilterKeyFromType(this.sourceEntry_.getType()) || '';

    /**
     * @type {string}
     */
    this['sourceLayerName'] = getFilterManager().getFilterable(this.sourceEntry_.getType()).getTitle();

    /**
     * @type {Array<Object>}
     */
    this['layers'] = [];

    /**
     * @type {Object<string, CopyFilterPickerModel>}
     */
    this['unmappedColumns'] = {};

    /**
     * @type {Object<string, CopyFilterPickerModel>}
     */
    this['mappedColumns'] = {};

    /**
     * @type {number}
     */
    this['numLayersChecked'] = 0;

    /**
     * @type {string}
     */
    this['helpText'] = 'Some columns in the filter are not available in the selected layers.' +
        ' Please choose the appropriate columns for each.';

    this.init_();

    $scope.$on(ChecklistEvent.CHANGE + ':layerlist', this.update_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));

    // trigger window auto height after the DOM is rendered
    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * Cleanup
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Initializes the layer list.
   *
   * @private
   */
  init_() {
    var set = getQueryManager().getLayerSet();
    var layers = [];

    for (var key in set) {
      var d = DataManager.getInstance().getDescriptor(key);
      if (d) {
        var label = set[key];

        if (this.sourceEntry_.getType() === key) {
          label += ' (Current Layer)';
        }

        layers.push({
          'id': key,
          'label': label,
          'enabled': false
        });
      }
    }

    layers.sort(function(a, b) {
      return caseInsensitiveCompare(a['label'], b['label']);
    });

    var filterNode = this.sourceEntry_.getFilterNode();
    var columnNames = filterNode.querySelectorAll('PropertyName');
    for (var i = 0, ii = columnNames.length; i < ii; i++) {
      insert(this.sourceColumnNames_, columnNames[i].textContent);
    }

    this['layers'] = layers;

    this.update_();
  }

  /**
   * Updates the two main lists that drive the UI: the list of mappings that already exist, and the list of mappings
   * that need to be created.
   *
   * @private
   */
  update_() {
    var cmm = ColumnMappingManager.getInstance();
    var oldUnmappedColumns = this['unmappedColumns'];
    this['unmappedColumns'] = {};
    this['mappedColumns'] = {};
    var checked = this['layers'].filter(function(layer) {
      return layer['enabled'];
    });

    this['numLayersChecked'] = checked.length;

    for (var i = 0, ii = checked.length; i < ii; i++) {
      var targetLayer = checked[i];
      var targetFilterable = getFilterManager().getFilterable(targetLayer['id']);

      if (targetFilterable) {
        var targetFilterKey = /** @type {!string} */ (targetFilterable.getFilterKey());
        if (targetFilterKey === this['sourceFilterKey']) {
          // copying to itself, we don't need no stinking mappings
          continue;
        }
        var targetColumns = targetFilterable.getFilterColumns();
        if (targetColumns) {
          targetColumns = targetColumns.filter(filterColumns);
          var targetLayerName = /** @type {os.data.IDataDescriptor} */ (targetFilterable).getTitle();
          assertString(targetLayerName);

          for (var j = 0, jj = this.sourceColumnNames_.length; j < jj; j++) {
            var sourceColumnName = this.sourceColumnNames_[j];
            var sourceHash = this['sourceFilterKey'] + '#' + sourceColumnName;
            var sourceMapping = cmm.getOwnerMapping(sourceHash);

            if (sourceMapping && sourceMapping.getColumn(targetFilterKey)) {
              // the mapping already exists and works between these two layers, so use it
              var targetColumn = sourceMapping.getColumn(targetFilterKey);
              var actualTargetColumn = targetColumns.find(function(column) {
                return column['name'] === targetColumn['column'];
              }) || null;

              var model = createPickerModel(targetLayerName, targetFilterKey,
                  sourceColumnName, targetColumns, actualTargetColumn, sourceMapping);

              if (this['mappedColumns'][targetFilterKey]) {
                this['mappedColumns'][targetFilterKey].push(model);
              } else {
                this['mappedColumns'][targetFilterKey] = [model];
              }
            } else {
              // put a UI model in place for constructing the mapping
              var selectedColumn = null;
              var oldModelArray = oldUnmappedColumns[targetFilterKey];
              if (oldModelArray) {
                var oldModelColumn = oldModelArray.find(function(oldModel) {
                  return oldModel['sourceColumnName'] === sourceColumnName &&
                      oldModel['targetFilterKey'] === targetFilterKey;
                });

                if (oldModelColumn) {
                  selectedColumn = oldModelColumn['selectedTargetColumn'];
                }
              }

              var model = createPickerModel(targetLayerName, targetFilterKey,
                  sourceColumnName, targetColumns, selectedColumn);

              if (this['unmappedColumns'][targetFilterKey]) {
                // HACK ALERT! Descriptors are capable of adding multiple layers with the SAME DATATYPE.
                // This check prevents us from treating those layers as separate layers for the purpose of
                // building a new mapping.
                var duplicateModel = this['unmappedColumns'][targetFilterKey].find(function(model) {
                  return model['sourceColumnName'] === sourceColumnName && model['targetFilterKey'] === targetFilterKey;
                });
                if (!duplicateModel) {
                  this['unmappedColumns'][targetFilterKey].push(model);
                }
              } else {
                this['unmappedColumns'][targetFilterKey] = [model];
              }
            }
          }
        }
      }
    }
  }

  /**
   * Pieces together all of the mappings needed to perform the filter copy. This function creates and adds the
   * necessary new mappings to the manager as well as gathering the necessary existing mappings already in the
   * manager.
   *
   * @return {Object<string, Array<IColumnMapping>>}
   * @private
   */
  constructNewMappings_() {
    var cmm = ColumnMappingManager.getInstance();
    var layersToMappings = {};

    // unmapped columns need to either be added to an existing mapping or they need to be added to a new one
    for (var layer in this['unmappedColumns']) {
      var modelArray = this['unmappedColumns'][layer];
      for (var i = 0, ii = modelArray.length; i < ii; i++) {
        var model = modelArray[i];
        var sourceColumnName = model['sourceColumnName'];
        var targetFilterKey = model['targetFilterKey'];
        var targetColumnName = model['selectedTargetColumn']['name'];
        var targetHash = targetFilterKey + '#' + targetColumnName;
        var sourceHash = this['sourceFilterKey'] + '#' + sourceColumnName;

        // attempt to look up the existing mapping for the source filter, first in the new mappings object
        layersToMappings[targetFilterKey] = layersToMappings[targetFilterKey] || [];
        var mapping = cmm.getOwnerMapping(targetHash) || cmm.getOwnerMapping(sourceHash);

        if (!mapping) {
          // didn't find one, so create a new one and add it to the manager
          mapping = new ColumnMapping();
          mapping.setName(sourceColumnName);
          mapping.addColumn(this['sourceFilterKey'], sourceColumnName);
          cmm.add(mapping);
        }

        if (!mapping.getColumn(targetFilterKey)) {
          // if the mapping doesn't already have the target column
          mapping.addColumn(targetFilterKey, targetColumnName);
        }

        var sourceColumn = mapping.getColumn(this['sourceFilterKey']);
        if (sourceColumn && sourceColumn['column'] !== sourceColumnName) {
          // WEIRD CORNER CASE: This block will be hit if there is an existing mapping that is inconsistent with
          // the mapping you are presently constructing. This will change a mapping in the manager to match what
          // the UI is showing when the Copy button is clicked.
          mapping.removeColumn(sourceColumn);
          mapping.addColumn(this['sourceFilterKey'], sourceColumnName);
        }

        insert(layersToMappings[targetFilterKey], mapping);
      }
    }

    // tell the CMM to update so that the settings window will refresh
    cmm.onChange();

    for (var layer in this['mappedColumns']) {
      var modelArray = this['mappedColumns'][layer];
      for (var i = 0, ii = modelArray.length; i < ii; i++) {
        var model = modelArray[i];
        var targetFilterKey = model['targetFilterKey'];
        var mapping = model['mapping'];

        layersToMappings[targetFilterKey] = layersToMappings[targetFilterKey] || [];
        insert(layersToMappings[targetFilterKey], mapping);
      }
    }

    // build the set of mappings we need to do this copy
    return layersToMappings;
  }

  /**
   * Get whether there are unmapped columns.
   *
   * @return {boolean}
   * @export
   */
  hasUnmappedColumns() {
    return getCount(this['unmappedColumns']) > 0;
  }

  /**
   * Get whether there are unmapped columns.
   *
   * @return {boolean}
   * @export
   */
  hasMappedColumns() {
    return getCount(this['mappedColumns']) > 0;
  }

  /**
   * Cancels the filter
   *
   * @export
   */
  cancel() {
    close(this.element_);
  }

  /**
   * User clicked OK
   *
   * @export
   */
  finish() {
    var layersToMappings = this.constructNewMappings_();
    var cmds = [];
    var checked = this['layers'].filter(function(layer) {
      return layer['enabled'];
    });

    for (var i = 0, ii = checked.length; i < ii; i++) {
      var layer = checked[i];
      var id = /** @type {string} */ (layer['id']);
      var filterable = getFilterManager().getFilterable(id);
      var targetFilterKey = filterable.getFilterKey();
      assertString(targetFilterKey);
      var clone = this.sourceEntry_.clone();
      var mappings = layersToMappings[targetFilterKey];
      var filterString = this.sourceEntry_.getFilter();

      if (mappings && filterString) {
        for (var j = 0, jj = mappings.length; j < jj; j++) {
          var mapping = mappings[j];
          var sourceColumn = mapping.getColumn(this['sourceFilterKey']);
          var targetColumn = mapping.getColumn(targetFilterKey);
          var regex = new RegExp('<PropertyName>' + sourceColumn['column'] + '</PropertyName>', 'g');
          filterString =
              filterString.replace(regex, '<PropertyName>' + targetColumn['column'] + '</PropertyName>');
        }
      }

      clone.setType(id);
      clone.setId(getRandomString());
      clone.setFilter(filterString);

      var add = new FilterAdd(clone);
      cmds.push(add);
    }

    if (cmds.length > 0) {
      var cmd = new SequenceCommand();
      cmd.setCommands(cmds);
      cmd.title = 'Copied filter "' + this.sourceEntry_.getTitle() + '" to ' +
          cmds.length + (cmds.length === 1 ? ' layer' : ' layers');
      CommandProcessor.getInstance().addCommand(cmd);
    }

    close(this.element_);
  }
}

/**
 * Creates a picker model out of the passed parameters.
 *
 * @param {string} targetLayerName The layer name for the target layer
 * @param {string} targetFilterKey The layer key for the target layer
 * @param {string} sourceColumnName The column name for the source layer
 * @param {Array<Object>} targetColumns The column definitions for the target layer
 * @param {Object} selectedColumn The actual selected target column definition
 * @param {IColumnMapping=} opt_mapping The column mapping to use
 * @return {CopyFilterPickerModel}
 */
const createPickerModel = (targetLayerName, targetFilterKey, sourceColumnName, targetColumns, selectedColumn,
    opt_mapping) => {
  var model = /** @type {CopyFilterPickerModel} */ ({
    'name': targetLayerName,
    'targetFilterKey': targetFilterKey,
    'sourceColumnName': sourceColumnName,
    'targetColumns': targetColumns,
    'selectedTargetColumn': selectedColumn,
    'mapping': opt_mapping
  });
  return model;
};
