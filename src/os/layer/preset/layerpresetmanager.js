goog.provide('os.layer.preset.LayerPresetManager');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.layer.config.ILayerConfig');
goog.require('os.layer.preset');
goog.require('os.net.Request');



/**
 * Manager for keeping track of available layer presets. These presets consist of a layer options object and a
 * reference to a set of default feature actions.
 *
 * @constructor
 */
os.layer.preset.LayerPresetManager = function() {
  /**
   * The available layer presets.
   * @type {Object<string, goog.Promise<Array<osx.layer.Preset>>>}
   * @private
   */
  this.presets_ = {};

  /**
   * Map of URLs that have already been requested.
   * @type {Object<string, boolean>}
   * @private
   */
  this.requested_ = {};

  this.init();
};
goog.addSingletonGetter(os.layer.preset.LayerPresetManager);


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.preset.LayerPresetManager.LOGGER_ = goog.log.getLogger('os.layer.preset.LayerPresetManager');


/**
 * Initializes the layer presets from settings.
 */
os.layer.preset.LayerPresetManager.prototype.init = function() {
  var presets = os.settings.get(os.layer.preset.SettingKey.PRESETS, {});

  for (var key in presets) {
    this.presets_[key] = new goog.Promise(function(resolve, reject) {
      resolve(/** @type {Array<osx.layer.Preset>} */ (presets[key]));
    });
  }
};


/**
 * Gets a promise that resolves to the presets for a given layer type.
 *
 * @param {string} type
 * @param {string} url
 */
os.layer.preset.LayerPresetManager.prototype.registerPreset = function(type, url) {
  var promise = this.presets_[type];

  if (!this.requested_[url]) {
    this.requested_[url] = true;
    var request = new os.net.Request(url);

    if (promise) {
      // presets are already loaded for that type, so attempt to load the new ones and replace the promise
      promise.then(function(originalPresets) {
        var newPromise = request.getPromise().then(function(result) {
          var presets = /** @type {Array<osx.layer.Preset>} */ (JSON.parse(result));

          if (presets && originalPresets) {
            presets = presets.concat(originalPresets);
          }

          this.presets_[type] = newPromise;

          return presets;
        }, this.handleLoadError, this);
      }, this.handleLoadError, this);
    } else {
      // no presets yet, so load them
      this.presets_[type] = request.getPromise().then(function(result) {
        var presets = /** @type {Array<osx.layer.Preset>} */ (JSON.parse(result));
        return presets;
      }, this.handleLoadError, this);
    }
  }
};


/**
 * Handler for errors in loading presets.
 *
 * @param {*} reason
 */
os.layer.preset.LayerPresetManager.prototype.handleLoadError = function(reason) {
  var msg = 'Unspecified error.';
  if (typeof reason == 'string') {
    msg = reason;
  } else if (reason instanceof Error) {
    msg = reason.message;
  }

  goog.log.error(os.layer.preset.LayerPresetManager.LOGGER_, 'Failed to load presets. Reason: ' + msg);
};


/**
 * Gets a promise that resolves to the presets for a given layer type.
 *
 * @param {string} type
 * @return {goog.Promise<Array<osx.layer.Preset>>|undefined}
 */
os.layer.preset.LayerPresetManager.prototype.getPresets = function(type) {
  return this.presets_[type];
};
