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
const OsLayerPreset = goog.require('os.layer.preset');
const SettingsPresetService = goog.require('os.layer.preset.SettingsPresetService');
const IFilterable = goog.require('os.filter.IFilterable');

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
     * True if the user can edit/remove/publish presets. Shows/hides UI elements, etc
     * @type {!boolean}
     */
    this.admin_ = false;

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

    // add the basic PresetService; not an admin
    this.registerService(SettingsPresetService.ID, new SettingsPresetService(), false);

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
   * @param {boolean=} b
   * @return {!boolean}
   */
  isAdmin(b) {
    if (b === true || b === false) {
      this.admin_ = (b === true);
    }
    return this.admin_;
  }

  /**
   * Returns a list of PresetServices which support the action
   *
   * @param {OsLayerPreset.PresetServiceAction} action
   * @return {Array<IPresetService>}
   */
  supporting(action) {
    const services = [];
    const entries = (this.services_.entries() || []);
    for (var [, service] of entries) {
      if (service.supports(action)) services.push(service);
    }
    return services;
  }

  /**
   * @param {string} key
   * @param {IPresetService} service
   * @param {...} opt
   * @return {boolean} true if prior value overwritten
   */
  registerService(key, service, ...opt) {
    this.presets_ = {}; // set presets to reload every layer

    return this.services_.register(...[key, service].concat(opt));
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

    // HACK: doing goog.require('os.MapContainer') properly creates a circular dependency somewhere in
    // the os.layer chain. TODO Fix it when there's time
    var layer = os.map.mapContainer.getLayer(id);

    if (osImplements(layer, IFilterable.ID)) {
      filterKey = /** @type {IFilterable} */ (layer).getFilterKey();
    }

    var promise = new Promise((resolve, reject) => {
      var entries = (this.services_.entries() || []);
      var promises = [];

      this.isAdmin(false); // disable the admin UI

      for (var [, service, isAdmin] of entries) {
        if (isAdmin) this.isAdmin(true); // enable the admin UI if User has admin in any service

        if (service.supports(OsLayerPreset.PresetServiceAction.FIND)) {
          promises.push(service.find(/** @type {osx.layer.PresetSearch} */ ({
            layerId: [id],
            layerFilterKey: [filterKey],
            published: (!isAdmin) ? true : undefined
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

          // add a "Basic" preset to the list if there are user-defined ones OR the user is an admin
          if (presets.length > 0 || this.isAdmin()) {
            OsLayerPreset.addDefault(presets, id, filterKey || undefined);
          }

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
      (settings.getInstance().get(OsLayerPreset.SettingKey.APPLIED_DEFAULTS, {}));

    if (Array.isArray(presets) && presets.length && !applied[id]) {
      var preset = presets.find(function(preset) {
        return preset['default'] || false;
      });

      if (preset) {
        var cmd = new VectorLayerPreset(id, preset);
        cmd.execute();
      }

      applied[id] = true;
      settings.getInstance().set(OsLayerPreset.SettingKey.APPLIED_DEFAULTS, applied);
    }
  }
}

goog.addSingletonGetter(LayerPresetManager);


exports = LayerPresetManager;
