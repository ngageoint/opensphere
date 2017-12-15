goog.provide('os.ui.util.deprecated');
goog.require('goog.async.Delay');
goog.require('os.config.Settings');
goog.require('os.ui.window');


/**
 * Checks if a layer name is in the deprecated layers list.
 * @param {?string} name
 * @return {boolean}
 */
os.ui.util.deprecated.isLayerDeprecated = function(name) {
  var deprecatedLayers = os.settings.get(['deprecatedLayers'], []);
  return !!name && deprecatedLayers.indexOf(name) !== -1;
};


/**
 * Adds a layer name to the queue of deprecated layer names that will be shown in the popup. This is done
 * asynchronously so that if several deprecated layers are loaded in quick succession (i.e. on application load)
 * they will all be grouped into a single window.
 * @param {?string} name
 */
os.ui.util.deprecated.showDeprecatedWarning = function(name) {
  if (name) {
    if (!os.ui.util.deprecated.deprecatedLayers_) {
      os.ui.util.deprecated.deprecatedLayers_ = [];
    }

    // don't insert duplicates (layer groups tend to cause this problem)
    if (os.ui.util.deprecated.deprecatedLayers_.indexOf(name) === -1) {
      os.ui.util.deprecated.deprecatedLayers_.push(name);
      os.ui.util.deprecated.windowDelay_.start();
    }
  }
};


/**
 * Shows a modal dialog explaining that a set of layers is deprecated and should not be used going forward.
 * @private
 */
os.ui.util.deprecated.launchDeprecatedLayersWindow_ = function() {
  var layers = os.ui.util.deprecated.deprecatedLayers_;
  if (layers && layers.length > 0) {
    var scopeOptions = {
      'yesText': 'Got It',
      'yesIcon': 'fa fa-check lt-blue-icon',
      'hideCancel': true
    };

    var height = 250 + 21 * layers.length;
    var windowOptions = {
      'label': 'Legacy Layers',
      'icon': 'fa fa-exclamation-circle red-icon',
      'x': 'center',
      'y': 'center',
      'width': 500,
      'height': height,
      'modal': 'true',
      'no-scroll': 'true'
    };

    var layersMarkup = '<ul>';
    for (var i = 0, n = layers.length; i < n; i++) {
      layersMarkup += '<li>' + layers[i] + '</li>';
    }
    layersMarkup += '</ul>';

    var configMsg = os.settings.get(['deprecatedLayerMessage']);
    var text = '<b>Heads up!</b><p>The following legacy layers were just loaded into the application: </p>' +
        layersMarkup + '<p>' + configMsg + '</p>';
    var template = '<confirm>' + text + '</confirm>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);

    os.ui.util.deprecated.deprecatedLayers_ = null;
  }
};


/**
 * Array of deprecated layer names that will be fed into the window popup.
 * @type {?Array<string>}
 * @private
 */
os.ui.util.deprecated.deprecatedLayers_ = null;


/**
 * Delay for pooling together multiple calls to the deprecated layer warning.
 * @type {goog.async.Delay}
 * @private
 */
os.ui.util.deprecated.windowDelay_ = new goog.async.Delay(os.ui.util.deprecated.launchDeprecatedLayersWindow_, 500);
