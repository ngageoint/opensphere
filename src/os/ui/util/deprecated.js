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
  var deprecatedLayers = /** @type {Object} */ (os.settings.get(['deprecatedLayers'], {}));
  return !!name && name in deprecatedLayers;
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
    var deprecatedLayers = /** @type {Object} */ (os.settings.get(['deprecatedLayers'], {}));

    var layersMarkup = '<ul>';
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = layers[i];
      var msg = deprecatedLayers[layer] ? deprecatedLayers[layer]['message'] : 'The layer "' + layer + '" is legacy ' +
          'and may soon cease to function or be removed.';
      layersMarkup += '<li>' + msg + '</li>';
    }
    layersMarkup += '</ul>';

    var text = '<b>Heads up!</b><p>The following legacy layers were just loaded into the application: </p>' +
        layersMarkup;

    os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      prompt: text,
      yesText: 'Got It',
      noIcon: '',
      noText: '',
      windowOptions: {
        'label': 'Legacy Layers',
        'headerClass': 'bg-warning u-bg-warning-text',
        'icon': 'fa fa-exclamation-circle',
        'x': 'center',
        'y': 'center',
        'width': '500',
        'height': 'auto',
        'modal': 'true',
        'no-scroll': 'true'
      }
    }));

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
