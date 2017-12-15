goog.provide('plugin.im.action.feature');
goog.provide('plugin.im.action.feature.TagName');

goog.require('os.im.action');
goog.require('os.layer');
goog.require('os.ui');
goog.require('os.ui.window');


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
  LAYER_LAUNCH: 'layers.contextMenu.featureActions'
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
