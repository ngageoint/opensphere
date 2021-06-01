goog.module('plugin.im.action.feature');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const DataManager = goog.require('os.data.DataManager');
const filterAction = goog.require('os.im.action.filter');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const osSource = goog.require('os.source');
const {launchEditFeatureAction} = goog.require('plugin.im.action.feature.ui');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Identifier for import action plugin components.
 * @type {string}
 */
const ID = 'featureAction';

/**
 * User-facing title for feature actions.
 * @type {string}
 */
const TITLE = 'Feature Actions';

/**
 * User-facing title for feature action entries.
 * @type {string}
 */
const ENTRY_TITLE = 'Feature Action';

/**
 * Identifier for import action plugin components.
 * @type {string}
 */
const HELP_TEXT = TITLE + ' perform tasks on data that matches a filter, ' +
    'as it is loaded into the application. For example, you can change the style of features if they match certain ' +
    'criteria.<br><br>Actions are executed in order (top-down), and data matching multiple filters will override ' +
    'previous actions. Actions can be reordered by dragging them in the list.';

/**
 * Events for the import actions plugin.
 * @enum {string}
 */
const EventType = {
  LAUNCH: 'featureAction:launch'
};

/**
 * Metric keys for the import actions plugin.
 * @enum {string}
 */
const Metrics = {
  LAYER_LAUNCH: 'layers.contextMenu.featureActions',
  REMOVE_SELECTED: 'action.feature.node.removeSelected',
  TOGGLE_ON: 'action.feature.node.toggleOn',
  TOGGLE_OFF: 'action.feature.node.toggleOff'
};

/**
 * Feature action style fields.
 * @enum {string}
 */
const StyleType = {
  BASE: '_featureActionBaseConfig',
  ORIGINAL: '_featureActionOriginalConfig'
};


/**
 * @param {string=} opt_entryType The filter action entry type.
 * @return {string} The file name.
 */
const getExportName = function(opt_entryType) {
  var name = filterAction.getExportName();

  if (opt_entryType) {
    var layer = MapContainer.getInstance().getLayer(opt_entryType);
    if (osImplements(layer, ILayer.ID)) {
      var layerTitle = /** @type {ILayer} */ (layer).getTitle();
      if (layerTitle) {
        name = layerTitle + ' ' + name;
      }
    }
  }

  return name;
};

/**
 * Get the list of filter columns.
 *
 * @param {string=} opt_entryType The filter action entry type.
 * @return {!Array} The columns.
 */
const getColumns = function(opt_entryType) {
  var columns;

  if (opt_entryType) {
    var dm = DataManager.getInstance();
    var source = dm.getSource(opt_entryType);
    if (source) {
      columns = osSource.getFilterColumns(source, true, true);
    }
  }

  return columns || filterAction.getColumns(opt_entryType);
};

/**
 * Edit an action entry. If no entry is provided, a new one will be created.
 *
 * @param {string} entryType The filter action entry type.
 * @param {FilterActionEntry=} opt_entry The import action entry.
 */
const editEntry = function(entryType, opt_entry) {
  var entry;
  if (opt_entry) {
    entry = /** @type {!FilterActionEntry} */ (opt_entry.clone());
    entry.setDefault(opt_entry.isDefault());
  }

  launchEditFeatureAction(entryType, getColumns(entryType), filterAction.onEditComplete.bind(null, opt_entry), entry);
};

exports = {
  ID,
  TITLE,
  ENTRY_TITLE,
  HELP_TEXT,
  EventType,
  Metrics,
  StyleType,
  getExportName,
  getColumns,
  editEntry
};
