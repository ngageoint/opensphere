goog.module('os.ui.util.deprecated');

const Delay = goog.require('goog.async.Delay');
const Settings = goog.require('os.config.Settings');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');


/**
 * Checks if a layer name is in the deprecated layers list.
 *
 * @param {?string} name
 * @return {boolean}
 */
const isLayerDeprecated = function(name) {
  var deprecatedLayers = /** @type {Object} */ (Settings.getInstance().get(['deprecatedLayers'], {}));
  return !!name && name in deprecatedLayers;
};

/**
 * Adds a layer name to the queue of deprecated layer names that will be shown in the popup. This is done
 * asynchronously so that if several deprecated layers are loaded in quick succession (i.e. on application load)
 * they will all be grouped into a single window.
 *
 * @param {?string} name
 */
const showDeprecatedWarning = function(name) {
  // don't insert duplicates (layer groups tend to cause this problem)
  if (name && notifyQueue.indexOf(name) === -1) {
    notifyQueue.push(name);
    windowDelay.start();
  }
};

/**
 * Shows a modal dialog explaining that a set of layers is deprecated and should not be used going forward.
 */
const launchDeprecatedLayersWindow = function() {
  if (notifyQueue && notifyQueue.length > 0) {
    var deprecatedLayers = /** @type {Object} */ (Settings.getInstance().get(['deprecatedLayers'], {}));

    var layersMarkup = '<ul>';
    for (var i = 0, n = notifyQueue.length; i < n; i++) {
      var layer = notifyQueue[i];
      var msg = deprecatedLayers[layer] ? deprecatedLayers[layer]['message'] : 'The layer "' + layer + '" is legacy ' +
          'and may soon cease to function or be removed.';
      layersMarkup += '<li>' + msg + '</li>';
    }
    layersMarkup += '</ul>';

    notifyQueue.length = 0;

    var text = '<b>Heads up!</b><p>The following legacy layers were just loaded into the application: </p>' +
        layersMarkup;

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
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
        'modal': 'true'
      }
    }));
  }
};

/**
 * Array of deprecated layer names that will be fed into the window popup.
 * @type {!Array<string>}
 */
const notifyQueue = [];

/**
 * Delay for pooling together multiple calls to the deprecated layer warning.
 * @type {Delay}
 */
const windowDelay = new Delay(launchDeprecatedLayersWindow, 500);

exports = {
  isLayerDeprecated,
  showDeprecatedWarning
};
