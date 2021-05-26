goog.module('plugin.places.ui.launchSavePlaces');
goog.module.declareLegacyNamespace();

const osWindow = goog.require('os.ui.window');
const places = goog.require('plugin.places');
const {directiveTag: savePlacesUi} = goog.require('plugin.places.ui.SavePlacesUI');

const VectorSource = goog.requireType('os.source.Vector');


/**
 * Launch a dialog to save places from a source.
 *
 * @param {VectorSource} source The source
 */
let launchSavePlaces_ = (source) => {
  var windowId = 'savePlaces';
  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    var scopeOptions = {
      'initSources': source ? [source] : undefined
    };

    var windowOptions = {
      'id': windowId,
      'label': 'Save to Places',
      'icon': 'fa ' + places.ICON,
      'x': 'center',
      'y': 'center',
      'width': 425,
      'min-width': 300,
      'max-width': 800,
      'height': 'auto',
      'show-close': true
    };

    var template = `<${savePlacesUi} init-sources="initSources"></${savePlacesUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

/**
 * Launch a dialog to save places from a source.
 *
 * @param {VectorSource} source The source
 */
const launchSavePlaces = (source) => {
  launchSavePlaces_(source);
};

/**
 * Replace default launchSavePlaces implementation
 *
 * @param {!function(VectorSource)} f The new implementation
 */
const setLaunchSavePlaces = function(f) {
  launchSavePlaces_ = f;
};

exports = {
  launchSavePlaces,
  setLaunchSavePlaces
};
