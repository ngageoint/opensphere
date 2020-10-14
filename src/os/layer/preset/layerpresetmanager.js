goog.module('os.layer.preset.LayerPresetManager');
goog.module.declareLegacyNamespace();

const settings = goog.require('os.config.Settings');
const Disposable = goog.require('goog.Disposable');
const Promise = goog.require('goog.Promise');
const Dispatcher = goog.require('os.Dispatcher');
const VectorLayerPreset = goog.require('os.command.VectorLayerPreset');
const Registry = goog.require('os.data.Registry');
const LayerEventType = goog.require('os.events.LayerEventType');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const osLayerPreset = goog.require('os.layer.preset');
const PresetServiceAction = goog.require('os.layer.preset.PresetServiceAction');
const SettingKey = goog.require('os.layer.preset.SettingKey');
const SettingsPresetService = goog.require('os.layer.preset.SettingsPresetService');

const IPresetService = goog.requireType('os.layer.preset.IPresetService');


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
     * TODO get this from somewhere
     * True if the user can edit/remove/publish presets. Shows/hides UI elements, etc
     * @type {!boolean}
     */
    this.admin_ = true;

    /**
     * @type {!Registry<IPresetService>}
     * @private
     */
    this.services_ = new Registry();

    /**
     * The available layer presets.
     * @type {Object<string, Promise<Array<osx.layer.Preset>>>}
     * @private
     */
    this.presets_ = {};

    // add the basic PresetService
    this.registerService(SettingsPresetService.ID, new SettingsPresetService());

    // listen for new layers
    Dispatcher.getInstance().listen(LayerEventType.ADD, this.onLayerAdded, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.services_.dispose();
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
   * Handle preset service added.
   * @param {!os.events.LayerEvent} event The layer event.
   * @protected
   */
  onServiceRegistered(event) {
    // update all of the promise collections with the new find() results
  }

  /**
   * @return {!boolean}
   */
  isAdmin() {
    return this.admin_;
  }

  /**
   * @param {string} key
   * @param {IPresetService} service
   * @param {...} opt
   * @return {boolean} true if prior value overwritten
   */
  registerService(key, service, ...opt) {
    this.presets_ = {}; // set presets to reload every layer
    return this.services_.register.apply(this.services_, [key, service].concat(opt));
  }

  /**
   * @param {string} key
   * @return {boolean} true if prior value dropped
   */
  unregisterService(key) {
    this.presets_ = {}; // set presets to reload every layer
    return this.services_.remove(key);
  }

  /**
   * Gets a promise that resolves to the presets for a given layer type.
   *
   * @param {string} type
   * @param {string} url
   * @deprecated Please create a os.layer.preset.PresetService instead
   */
  registerPreset(type, url) {}

  /**
   * Handler for errors in loading presets.
   *
   * @param {*} reason
   * @deprecated
   */
  handleLoadError(reason) {}

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

    var promise = new Promise((resolve, reject) => {
      var entries = (this.services_.entries() || []);
      var promises = [];

      for (var [, service] of entries) {
        if (service.supports(PresetServiceAction.FIND)) {
          promises.push(service.find(/** @type {osx.layer.PresetSearch} */ ({
            'layerId': [id],
            'layerFilterKey': [filterKey],
            'published': (!this.admin_) ? true : undefined
          })));
        }
      }

      if (promises.length) {
        Promise.all(promises).then((results) => {
          var presets = results.reduce((list, result) => {
            if (result && result.length) {
              return list.concat(result);
            }
            return list;
          }, []);

          // add a "Default" preset to the list
          if (presets.length > 0) osLayerPreset.addDefault(presets);

          // apply the "isDefault" preset if asked
          if (opt_applyDefault) {
            this.applyDefaults(id, presets);
          }

          // return the list to any .then() bindings
          resolve(presets);
        });
      } else {
        resolve(null);
      }
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
        return preset['default'] || false;
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


exports = LayerPresetManager;
