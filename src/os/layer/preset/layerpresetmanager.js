goog.module('os.layer.preset.LayerPresetManager');
goog.module.declareLegacyNamespace();

const Debouncer = goog.require('goog.async.Debouncer');
const Dispatcher = goog.require('os.Dispatcher');
const Disposable = goog.require('goog.Disposable');
const GoogEventType = goog.require('goog.events.EventType');
const IFilterable = goog.require('os.filter.IFilterable');
const ILayer = goog.require('os.layer.ILayer');
const LayerEventType = goog.require('os.events.LayerEventType');
const OsLayerPreset = goog.require('os.layer.preset');
const Promise = goog.require('goog.Promise');
const Registry = goog.require('os.data.Registry');
const SettingsPresetService = goog.require('os.layer.preset.SettingsPresetService');
const VectorLayerPreset = goog.require('os.command.VectorLayerPreset');

const settings = goog.require('os.config.Settings');
const olEvents = goog.require('ol.events');
const osImplements = goog.require('os.implements');

const IPresetService = goog.requireType('os.layer.preset.IPresetService');
const LayerEvent = goog.requireType('os.events.LayerEvent');
const {EventsKey: OlEventsKey} = goog.requireType('ol');
const OlLayer = goog.requireType('ol.layer.Layer');

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
     * The bound listener functions (per layer) TODO link up the presets, listeners, and debouncers into a single registry entry
     * @type {Object<string, OlEventsKey>}
     * @private
     */
    this.listeners_ = {};

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

    /**
     * @type {!Debouncer}
     * @private
     */
    this.onLayerStyleChangedDebouncer_ = new Debouncer(this.onLayerStyleChanged_, 250, this);

    // add the basic PresetService; not an admin
    this.registerService(SettingsPresetService.ID, new SettingsPresetService(), false);

    // listen for new layers
    Dispatcher.getInstance().listen(LayerEventType.ADD, this.onLayerAdded, false, this);
    Dispatcher.getInstance().listen(LayerEventType.REMOVE, this.onLayerRemoved, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.services_.dispose();
    this.onLayerStyleChangedDebouncer_.dispose();

    // for each layer, remove listeners
    const layerIds = Object.keys(/** @type {!Object} */ (this.listeners_));
    if (layerIds && layerIds.length) {
      layerIds.forEach((layerId) => {
        const key = /** @type {OlEventsKey} */ (this.listeners_[layerId]);
        const layer = this.getLayer_(layerId);
        if (key && layer) {
          olEvents.unlistenByKey(key);
        }
        delete this.listeners_[layerId]; // remove no matter what
      });
    }

    Dispatcher.getInstance().unlisten(LayerEventType.ADD, this.onLayerAdded, false, this);
    Dispatcher.getInstance().unlisten(LayerEventType.REMOVE, this.onLayerRemoved, false, this);
  }

  /**
   * Handle layer added to the map.
   * @param {!LayerEvent} event The layer event.
   * @protected
   */
  onLayerAdded(event) {
    const layer = osImplements(event.layer, ILayer.ID) ?
        /** @type {ILayer} */ (event.layer) : undefined;

    if (layer) {
      const layerId = layer.getId();
      if (layerId) {
        this.getPresets(layerId, true);
      }
    }
  }

  /**
   * Handle layer removed the map.
   * @param {!LayerEvent} event The layer event.
   * @protected
   */
  onLayerRemoved(event) {
    const layer = osImplements(event.layer, ILayer.ID) ?
        /** @type {ILayer} */ (event.layer) : undefined;

    if (layer) {
      const layerId = layer.getId();

      // clear listeners
      if (layerId && this.listeners_[layerId]) {
        olEvents.unlistenByKey(this.listeners_[layerId]);
        delete this.listeners_[layerId];
      }

      // clear
      if (layerId && this.presets_[layerId]) {
        delete this.presets_[layerId];
      }
    }
  }

  /**
   *
   * @param {!string} layerId
   */
  listenToLayerStyleChange(layerId) {
    var layer = this.getLayer_(layerId);

    if (layer && !this.listeners_[layerId]) {
      this.listeners_[layerId] = olEvents.listen(
          layer,
          GoogEventType.PROPERTYCHANGE,
          this.onLayerStyleChanged.bind(this, layerId, layer, false),
          this);
    }
  }

  /**
   * Handle layer style changed debouncer.
   * @param {!string} layerId The layer id.
   * @param {!OlLayer} layer The layer.
   * @param {!boolean} check True if the current style needs to be tested extensively against the Preset style
   * @param {!LayerEvent} event The layer event.
   * @protected
   */
  onLayerStyleChanged(layerId, layer, check, event) {
    // TODO debouncer for each layerId
    if (!this.onLayerStyleChangedDebouncer_.isDisposed()) {
      this.onLayerStyleChangedDebouncer_.fire(layerId, layer, check, event);
    }
  }

  /**
   * Handle layer style changed.
   * @param {!string} layerId The layer id.
   * @param {!OlLayer} layer The layer.
   * @param {!boolean} check True if the current style needs to be tested extensively against the Preset style
   * @param {!LayerEvent} event The layer event.
   * @private
   */
  onLayerStyleChanged_(layerId, layer, check, event) {
    // TODO check that the style does/doesn't match the Preset. If not, set the.
    if (layer && event['getProperty'] && event.getProperty() == 'style') {
      OsLayerPreset.setSavedPresetClean(layerId, false);
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
   * Helper function
   * @param {!string} layerId
   * @return {?OlLayer}
   * @private
   */
  getLayer_(layerId) {
    // HACK: doing goog.require('os.MapContainer') properly creates a circular dependency somewhere in
    // the os.layer chain. TODO Fix it when there's time
    return (os.map.mapContainer) ? os.map.mapContainer.getLayer(layerId) : null;
  }

  /**
   * Gets a promise that resolves to the presets for a given layer ID.
   *
   * @param {string} id The layer ID.
   * @param {boolean=} opt_applyDefault Whether to apply the default styles on load.
   * @return {Promise<Array<osx.layer.Preset>>|undefined}
   */
  getPresets(id, opt_applyDefault) {
    var promise = this.presets_[id];

    if (!promise) {
      // Do NOT pass opt_applyDefault down to initPreset; applyDefaults() is called on-demand below, possibly
      // on an already-resolved promise
      this.initPreset(id);
      promise = this.presets_[id];
    }

    // handle this separately from the initPreset so future calls to getPresets can try to applyDefaults()
    if (promise && opt_applyDefault) {
      promise.then((presets) => {
        this.applyDefaults(id, presets);
      });
    }
    return promise;
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
    var layer = this.getLayer_(id);

    if (!layer) return; // extra check; can't do presets without a working layer to which to add them

    if (osImplements(layer, IFilterable.ID)) {
      filterKey = /** @type {IFilterable} */ (layer).getFilterKey();
    }

    var promise = new Promise((resolve, reject) => {
      var entries = (this.services_.entries() || []);
      var promises = [];

      this.isAdmin(false); // disable the admin UI

      for (var [, service, isAdmin] of entries) {
        if (isAdmin) this.isAdmin(true); // enable the admin UI if User has admin in any service

        if (filterKey && service.supports(OsLayerPreset.PresetServiceAction.FIND)) {
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

          // sort
          if (presets.length > 0) {
            presets.sort((a, b) => {
              const aLabel = a ? a.label : '';
              const bLabel = b ? b.label : '';
              return (aLabel || '').localeCompare(bLabel || '');
            });
          }

          // add a "Basic" preset to the list if there are user-defined ones OR the user is an admin
          if (presets.length > 0 || this.isAdmin()) {
            OsLayerPreset.addDefault(presets, id, filterKey || undefined);
            OsLayerPreset.updateDefault(/** @type {ILayer} */ (layer), presets.find((preset) => {
              return preset.id == OsLayerPreset.DEFAULT_PRESET_ID;
            }));
          }

          // return the list to any .then() bindings
          resolve(presets);
        });
      } else {
        resolve(null);
      }
    });

    // apply the "isDefault" preset if asked
    if (opt_applyDefault) {
      promise.then((presets) => {
        this.applyDefaults(id, presets);
      });
    } else {
      promise.then((presets) => {
        if (presets && presets.length) {
          var isCleanPreset = OsLayerPreset.getSavedPresetClean(id);
          // don't set up the listener if it's already dirty
          if (isCleanPreset) {
            this.listenToLayerStyleChange(id);
          }
        }
      });
    }

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
    if (Array.isArray(presets) && presets.length) {
      var applied = /** @type {!Object<boolean>} */
          (settings.getInstance().get(OsLayerPreset.SettingKey.APPLIED_DEFAULTS, {}));

      if (!applied[id]) {
        var preset = presets.find(function(preset) {
          return preset.default || false; // TODO gets the first one; instead, look for the first and latest updated
        });

        if (preset) {
          this.applyPreset(id, preset);
        }

        // apply the Default style for a layer only once as long as the settings remain intact
        applied[id] = true;
        settings.getInstance().set(OsLayerPreset.SettingKey.APPLIED_DEFAULTS, applied);
      } else {
        var isCleanPreset = OsLayerPreset.getSavedPresetClean(id);
        // don't set up the listener if it's already dirty
        if (true || isCleanPreset) {
          this.listenToLayerStyleChange(id);
        }
      }
    }
  }

  /**
   *
   * @param {!string} id The layer ID.
   * @param {!osx.layer.Preset} preset The preset.
   */
  applyPreset(id, preset) {
    OsLayerPreset.setSavedPresetId(id, preset.id || null);
    OsLayerPreset.setSavedPresetClean(id, true);

    this.listenToLayerStyleChange(id);

    // TODO move the work of the command into LPM
    var cmd = new VectorLayerPreset(id, preset);
    cmd.execute();
  }
}


goog.addSingletonGetter(LayerPresetManager);


exports = LayerPresetManager;
