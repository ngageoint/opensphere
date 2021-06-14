goog.module('plugin.im.action.feature.ui.launchForLayer');
goog.module.declareLegacyNamespace();

const {ICON} = goog.require('os.im.action');
const osLayer = goog.require('os.layer');
const {sanitizeId} = goog.require('os.ui');
const osWindow = goog.require('os.ui.window');
const {HELP_TEXT, TITLE} = goog.require('plugin.im.action.feature');
const {directiveTag: featureActionsUi} = goog.require('plugin.im.action.feature.ui.FeatureActionsUI');


/**
 * Launch the feature action window for a layer.
 *
 * @param {string} layerId The layer id.
 */
const launchForLayer = function(layerId) {
  // pluralize for the window label
  var label = TITLE;

  var windowId = sanitizeId('featureActions-' + layerId);

  if (!osWindow.exists(windowId)) {
    var title = osLayer.getTitle(layerId, true);
    if (title) {
      label += ' for ' + title;
    }

    var windowOptions = {
      'id': windowId,
      'label': label,
      'key': windowId,
      'icon': 'fa ' + ICON,
      'x': 'center',
      'y': 'center',
      'width': 500,
      'height': 500,
      'show-close': true,
      'min-width': 300,
      'max-width': 2000,
      'min-height': 400,
      'max-height': 2000
    };

    var scope = {
      'type': layerId,
      'helpTitle': TITLE,
      'helpText': HELP_TEXT
    };

    var template = `<${featureActionsUi}></${featureActionsUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scope);
  } else {
    osWindow.bringToFront(windowId);
  }
};

exports = launchForLayer;
