goog.provide('plugin.im.action.feature');
goog.provide('plugin.im.action.feature.TagName');

goog.require('os.im.action');
goog.require('os.layer');
goog.require('os.ui');
goog.require('os.ui.window');
goog.require('plugin.im.action.feature.node.menu');
goog.require('plugin.im.action.feature.ui.editFeatureActionDirective');


/**
 * Identifier for import action plugin components.
 * @type {string}
 * @const
 */
plugin.im.action.feature.ID = 'featureAction';


/**
 * User-facing title for feature actions.
 * @type {string}
 * @const
 */
plugin.im.action.feature.TITLE = 'Feature Actions';


/**
 * User-facing title for feature action entries.
 * @type {string}
 * @const
 */
plugin.im.action.feature.ENTRY_TITLE = 'Feature Action';


/**
 * Identifier for import action plugin components.
 * @type {string}
 * @const
 */
plugin.im.action.feature.HELP_TEXT = plugin.im.action.feature.TITLE + ' perform tasks on data that matches a filter, ' +
    'as it is loaded into the application. For example, you can change the style of features if they match certain ' +
    'criteria.<br><br>Actions are executed in order (top-down), and data matching multiple filters will override ' +
    'previous actions. Actions can be reordered by dragging them in the list.';


/**
 * Events for the import actions plugin.
 * @enum {string}
 */
plugin.im.action.feature.EventType = {
  LAUNCH: 'featureAction:launch'
};


/**
 * Metric keys for the import actions plugin.
 * @enum {string}
 */
plugin.im.action.feature.Metrics = {
  LAYER_LAUNCH: 'layers.contextMenu.featureActions',
  REMOVE_SELECTED: 'action.feature.node.removeSelected',
  TOGGLE_ON: 'action.feature.node.toggleOn',
  TOGGLE_OFF: 'action.feature.node.toggleOff'
};


/**
 * Feature action style fields.
 * @enum {string}
 */
plugin.im.action.feature.StyleType = {
  BASE: '_featureActionBaseConfig'
};


/**
 * XML tags used by feature actions.
 * @enum {string}
 */
plugin.im.action.feature.TagName = {
  FEATURE_ACTION: 'featureAction',
  FEATURE_ACTIONS: 'featureActions'
};


/**
 * Launch the feature action window for a layer.
 * @param {string} layerId The layer id.
 */
plugin.im.action.feature.launchForLayer = function(layerId) {
  // pluralize for the window label
  var label = plugin.im.action.feature.TITLE;

  var windowId = os.ui.sanitizeId('featureActions-' + layerId);

  if (!os.ui.window.exists(windowId)) {
    var title = os.layer.getTitle(layerId, true);
    if (title) {
      label += ' for ' + title;
    }

    var windowOptions = {
      'id': windowId,
      'label': label,
      'key': windowId,
      'icon': 'fa ' + os.im.action.ICON,
      'x': 'center',
      'y': 'center',
      'width': 500,
      'height': 500,
      'show-close': true,
      'no-scroll': true,
      'min-width': 300,
      'max-width': 2000,
      'min-height': 400,
      'max-height': 2000
    };

    var scope = {
      'type': layerId,
      'helpTitle': plugin.im.action.feature.TITLE,
      'helpText': plugin.im.action.feature.HELP_TEXT
    };

    var template = '<featureactions></featureactions>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    os.ui.window.bringToFront(windowId);
  }
};


/**
 * @param {string=} opt_entryType The filter action entry type.
 * @return {string} The file name.
 */
plugin.im.action.feature.getExportName = function(opt_entryType) {
  var name = os.im.action.filter.getExportName();

  if (opt_entryType) {
    var layer = os.MapContainer.getInstance().getLayer(opt_entryType);
    if (os.implements(layer, os.layer.ILayer.ID)) {
      var layerTitle = /** @type {os.layer.ILayer} */ (layer).getTitle();
      if (layerTitle) {
        name = layerTitle + ' ' + name;
      }
    }
  }

  return name;
};


/**
 * Get the list of filter columns.
 * @param {string=} opt_entryType The filter action entry type.
 * @return {!Array} The columns.
 */
plugin.im.action.feature.getColumns = function(opt_entryType) {
  var columns;

  if (opt_entryType) {
    var dm = os.data.DataManager.getInstance();
    var source = dm.getSource(opt_entryType);
    if (source) {
      columns = os.source.getFilterColumns(source, true);
    }
  }

  return columns || os.im.action.filter.getColumns(opt_entryType);
};


/**
 * Edit an action entry. If no entry is provided, a new one will be created.
 * @param {string} entryType The filter action entry type.
 * @param {os.im.action.FilterActionEntry=} opt_entry The import action entry.
 */
plugin.im.action.feature.editEntry = function(entryType, opt_entry) {
  var entry = opt_entry ? /** @type {!os.im.action.FilterActionEntry} */ (opt_entry.clone()) : undefined;
  plugin.im.action.feature.ui.launchEditFeatureAction(entryType, plugin.im.action.feature.getColumns(entryType),
      os.im.action.filter.onEditComplete.bind(null, opt_entry), entry);
};
