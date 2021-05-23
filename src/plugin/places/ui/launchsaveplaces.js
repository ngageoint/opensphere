goog.module('plugin.places.ui.launchSavePlaces');
goog.module.declareLegacyNamespace();

const osWindow = goog.require('os.ui.window');
const places = goog.require('plugin.places');

// const {inIframe} = goog.require('os');
const {directiveTag: savePlacesUi} = goog.require('plugin.places.ui.SavePlacesUI');


// TODO: If in an iframe, launch in the main window.

/**
 * Launch a dialog to save places from a source.
 *
 * @param {os.source.Vector} source The source
 */
const launchSavePlaces = (source) => {
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

exports = launchSavePlaces;
