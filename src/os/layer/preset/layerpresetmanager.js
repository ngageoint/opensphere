goog.module('os.layer.preset.LayerPresetManager');
goog.module.declareLegacyNamespace();

const settings = goog.require('os.config.Settings');
const Disposable = goog.require('goog.Disposable');
const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');
const Dispatcher = goog.require('os.Dispatcher');
const VectorLayerPreset = goog.require('os.command.VectorLayerPreset');
const LayerEventType = goog.require('os.events.LayerEventType');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const osLayerPreset = goog.require('os.layer.preset');
const SettingKey = goog.require('os.layer.preset.SettingKey');
const Request = goog.require('os.net.Request');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Manager for keeping track of available layer presets. These presets consist of a layer options object and a
 * reference to a set of default feature actions.
 */
class LayerPresetManager extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The available layer presets.
     * @type {Object<string, Promise<Array<osx.layer.Preset>>>}
     * @private
     */
    this.presets_ = {};

    /**
     * Map of URLs that have already been requested.
     * @type {Object<string, boolean>}
     * @private
     */
    this.requested_ = {};

    Dispatcher.getInstance().listen(LayerEventType.ADD, this.onLayerAdded, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    Dispatcher.getInstance().unlisten(LayerEventType.ADD, this.onLayerAdded, false, this);
  }

  /**
   * Handle layer added to the map.
   * @param {!os.events.LayerEvent} event The layer event.
   * @protected
   */
  onLayerAdded(event) {
    const layer = osImplements(event.layer, ILayer.ID) ?
        /** @type {ILayer} */ (event.layer) : undefined;

    if (layer) {
      const layerId = layer.getId();
      const layerOptions = layer.getLayerOptions();
      if (layerId && layerOptions && layerOptions['applyDefaultPresets']) {
        // Apply default presets to the layer when configured.
        this.getPresets(layerId, true);
      }
    }
  }

  /**
   * Gets a promise that resolves to the presets for a given layer type.
   *
   * @param {string} type
   * @param {string} url
   */
  registerPreset(type, url) {
    var promise = this.presets_[type];

    if (!this.requested_[url]) {
      this.requested_[url] = true;
      var request = new Request(url);

      if (promise) {
        // presets are already loaded for that type, so attempt to load the new ones and replace the promise
        promise.then((originalPresets) => {
          var newPromise = request.getPromise().then((result) => {
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
        this.presets_[type] = request.getPromise().then((result) => {
          var presets = /** @type {Array<osx.layer.Preset>} */ (JSON.parse(result));
          return presets;
        }, this.handleLoadError, this);
      }
    }
  }

  /**
   * Handler for errors in loading presets.
   *
   * @param {*} reason
   */
  handleLoadError(reason) {
    var msg = 'Unspecified error.';
    if (typeof reason == 'string') {
      msg = reason;
    } else if (reason instanceof Error) {
      msg = reason.message;
    }

    log.error(LayerPresetManager.LOGGER_, 'Failed to load presets. Reason: ' + msg);
  }

  /**
   * Gets a promise that resolves to the presets for a given layer ID.
   *
   * @param {string} id The layer ID.
   * @param {boolean=} opt_applyDefault Whether to apply the default styles on load.
   * @return {Promise<Array<osx.layer.Preset>>|undefined}
   */
  getPresets(id, opt_applyDefault) {
    if (!this.presets_[id]) {
      this.initPreset(id, opt_applyDefault);
    }

    return this.presets_[id];
  }

  /**
   * Initializes the layer presets for a layer.
   *
   * @param {string} id The layer ID.
   * @param {boolean=} opt_applyDefault Whether to apply the default styles on load.
   * @protected
   */
  initPreset(id, opt_applyDefault) {
    // use the filter key to pull the value from settings
    var filterKey;
    var layer = os.map.mapContainer.getLayer(id);
    if (osImplements(layer, os.filter.IFilterable.ID)) {
      filterKey = /** @type {os.filter.IFilterable} */ (layer).getFilterKey();
    }

    var presets = /** @type {!Object<Array<osx.layer.Preset>>} */
      (settings.getInstance().get(SettingKey.PRESETS, {}));
    var layerPresets = presets[filterKey] || [];

    if (layerPresets.length) {
      // add a preset to restore the layer to its default settings
      // note: this could be useful for any layer, but without other preset options it seems like unnecessary UI clutter
      osLayerPreset.addDefault(layerPresets);
    }

    var promise = new Promise((resolve, reject) => {
      // verify that the feature actions are loaded first, then resolve the preset promise
      var faPromise = ImportActionManager.getInstance().loadDefaults(id);
      faPromise.thenAlways(function() {
        if (opt_applyDefault) {
          this.applyDefaults(id, layerPresets);
        }

        resolve(layerPresets);
      }, this);
    });

    this.presets_[id] = promise;
  }

  /**
   * Checks if there is a default preset and applies it if so.
   *
   * @param {string} id The layer ID.
   * @param {Array<osx.layer.Preset>} presets The presets.
   * @protected
   */
  applyDefaults(id, presets) {
    var applied = /** @type {!Object<boolean>} */
      (settings.getInstance().get(SettingKey.APPLIED_DEFAULTS, {}));

    if (Array.isArray(presets) && presets.length && !applied[id]) {
      var preset = presets.find(function(preset) {
        return preset.default || false;
      });

      if (preset) {
        var cmd = new VectorLayerPreset(id, preset);
        cmd.execute();
      }

      applied[id] = true;
      settings.getInstance().set(SettingKey.APPLIED_DEFAULTS, applied);
    }
  }
}

goog.addSingletonGetter(LayerPresetManager);


/**
 * @type {Logger}
 * @private
 * @const
 */
LayerPresetManager.LOGGER_ = log.getLogger('os.layer.preset.LayerPresetManager');


exports = LayerPresetManager;
