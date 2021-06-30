goog.module('os.data.DataManager');
goog.module.declareLegacyNamespace();

const Delay = goog.require('goog.async.Delay');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const dispatcher = goog.require('os.Dispatcher');
const Settings = goog.require('os.config.Settings');
const data = goog.require('os.data');
const DataProviderEvent = goog.require('os.data.DataProviderEvent');
const DescriptorEvent = goog.require('os.data.DescriptorEvent');
const DescriptorEventType = goog.require('os.data.DescriptorEventType');
const IUrlDescriptor = goog.require('os.data.IUrlDescriptor');
const PropertyChange = goog.require('os.data.PropertyChange');
const DataEvent = goog.require('os.data.event.DataEvent');
const DataEventType = goog.require('os.data.event.DataEventType');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const instanceOf = goog.require('os.instanceOf');
const LayerClass = goog.require('os.layer.LayerClass');
const SourceClass = goog.require('os.source.SourceClass');
const AbstractLoadingServer = goog.require('os.ui.server.AbstractLoadingServer');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const IDataManager = goog.require('os.data.IDataManager'); // eslint-disable-line

const Logger = goog.requireType('goog.log.Logger');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const IDataProvider = goog.requireType('os.data.IDataProvider');
const ProviderEntry = goog.requireType('os.data.ProviderEntry');
const LayerEvent = goog.requireType('os.events.LayerEvent');
const VectorLayer = goog.requireType('os.layer.Vector');
const IMapContainer = goog.requireType('os.map.IMapContainer');
const VectorSource = goog.requireType('os.source.Vector');


/**
 * The data manager provides methods for tracking and registering providers and descriptors.
 *
 * @implements {IDataManager}
 */
class DataManager extends EventTarget {
  /**
   * Constructor.
   * @param {boolean=} opt_init If the data manager should be initialized. This is intended to allow extending classes
   *                            to defer initialization.
   */
  constructor(opt_init = true) {
    super();

    /**
     * The logger
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {!Object<string, ProviderEntry>}
     * @private
     */
    this.providerTypes_ = {};

    /**
     * @type {!Object<string, function(new:IDataDescriptor)>}
     * @private
     */
    this.descriptorTypes_ = {};

    /**
     * @type {!os.structs.ITreeNode}
     * @private
     */
    this.providerRoot_ = new SlickTreeNode();

    /**
     * @type {!Object<string, !IDataDescriptor>}
     * @private
     */
    this.descriptors_ = {};

    /**
     * Debounces calls to persist when adding new descriptors to the tool.
     * @type {Delay}
     * @private
     */
    this.persistDelay_ = new Delay(this.persistDescriptors_, 50, this);

    /**
     * @type {!Object<string, !VectorSource>}
     * @private
     */
    this.sources_ = {};

    /**
     * If displayed data should be filtered by the timeline.
     * @type {boolean}
     * @private
     */
    this.timeFilterEnabled_ = true;

    /**
     * The map container instance.
     * @type {IMapContainer}
     * @private
     */
    this.map_ = null;

    if (opt_init) {
      this.initialize();
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.setMapContainer(null);
  }

  /**
   * Set the map container instance for the manager.
   * @param {IMapContainer} map The map container.
   */
  setMapContainer(map) {
    if (this.map_) {
      this.map_.unlisten(LayerEventType.ADD, this.onLayerAdded_, false, this);
      this.map_.unlisten(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
    }

    this.sources_ = {};
    this.map_ = map;

    if (this.map_) {
      this.map_.listen(LayerEventType.ADD, this.onLayerAdded_, false, this);
      this.map_.listen(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);
    }
  }

  /**
   * Initialize the data manager.
   *
   * @protected
   */
  initialize() {
    this.migrateDescriptors_();

    // restore time filter flag from settings
    const filterTime = /** @type {boolean} */ (Settings.getInstance().get(DataManagerSetting.FILTER_TIME, true));
    this.setTimeFilterEnabled(filterTime);
  }

  /**
   * @inheritDoc
   */
  registerProviderType(entry) {
    if (entry.type in this.providerTypes_) {
      log.warning(this.log,
          'The provider type "' + entry.type + '" has already been registered with the data manager!');
    } else {
      this.providerTypes_[entry.type] = entry;
    }
  }

  /**
   * @inheritDoc
   */
  getProviderEntry(type) {
    return type && type in this.providerTypes_ ? this.providerTypes_[type] : null;
  }

  /**
   * @inheritDoc
   */
  getProviderTypeByClass(clazz) {
    for (var type in this.providerTypes_) {
      var entry = this.providerTypes_[type];

      if (entry.clazz === clazz) {
        return entry.type;
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  registerDescriptorType(type, clazz, opt_override) {
    type = type.toLowerCase();

    if (type in this.descriptorTypes_) {
      if (opt_override) {
        log.warning(this.log, 'The descriptor type "' + type + '" is being overridden!');
      } else {
        log.error(this.log, 'The descriptor type "' + type + '" already exists!');
        return;
      }
    }

    this.descriptorTypes_[type] = clazz;
  }

  /**
   * @inheritDoc
   */
  createProvider(type) {
    if (type) {
      type = type.toLowerCase();

      if (type in this.providerTypes_) {
        var dp = null;
        var clazz = this.providerTypes_[type].clazz;

        if (clazz.getInstance) {
          dp = clazz.getInstance();
        } else {
          dp = /** @type {IDataProvider} */ (new clazz());
        }

        return dp;
      }

      log.warning(this.log, 'No provider exists for type "' + type + '".');
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  createDescriptor(type) {
    type = type.toLowerCase();

    if (type in this.descriptorTypes_) {
      return /** @type {IDataDescriptor} */ (new this.descriptorTypes_[type]());
    }

    // may not care if the descriptor doesn't exist, so don't log this by default
    log.fine(this.log, 'No descriptor exists for type "' + type + '".');
    return null;
  }

  /**
   * @inheritDoc
   */
  updateDescriptor(oldDescriptor, newDescriptor) {
    if (oldDescriptor.getId() && newDescriptor.getId()) {
      // Remove previous aliases
      var aliases = oldDescriptor.getAliases();
      for (var i = 0, n = aliases.length; i < n; i++) {
        delete this.descriptors_[aliases[i]];
      }

      // Add the new aliases.
      aliases = newDescriptor.getAliases();
      for (var i = 0, n = aliases.length; i < n; i++) {
        this.descriptors_[aliases[i]] = newDescriptor;
      }

      this.dispatchEvent(new DescriptorEvent(
          DescriptorEventType.UPDATE_DESCRIPTOR, oldDescriptor, newDescriptor));
    } else {
      log.error(this.log, 'Could not update the descriptor because its ID was empty or null');
    }
  }

  /**
   * @inheritDoc
   */
  addDescriptor(descriptor) {
    if (descriptor.getId()) {
      var aliases = descriptor.getAliases();

      for (var i = 0, n = aliases.length; i < n; i++) {
        this.descriptors_[aliases[i]] = descriptor;
      }

      this.dispatchEvent(new DescriptorEvent(DescriptorEventType.ADD_DESCRIPTOR, descriptor));
      this.persistDescriptors();
    } else {
      log.error(this.log, 'Could not add the descriptor because its ID was empty or null');
    }
  }

  /**
   * @inheritDoc
   */
  removeDescriptor(descriptor) {
    if (descriptor.getId()) {
      var aliases = descriptor.getAliases();

      for (var i = 0, n = aliases.length; i < n; i++) {
        delete this.descriptors_[aliases[i]];
      }

      this.dispatchEvent(new DescriptorEvent(DescriptorEventType.REMOVE_DESCRIPTOR, descriptor));
      this.persistDescriptors();
    } else {
      log.error(this.log, 'Could not remove the descriptor because its ID was empty or null');
    }
  }

  /**
   * @inheritDoc
   */
  getDescriptor(id) {
    if (id in this.descriptors_) {
      return this.descriptors_[id];
    }

    return null;
  }

  /**
   * Gets a data descriptor by URL.
   *
   * @param {string} url The descriptor URL to match
   * @return {?IDataDescriptor} The descriptor or <code>null</code> if none was found
   */
  getDescriptorByUrl(url) {
    var descriptors = this.getDescriptors();
    for (var i = 0, ii = descriptors.length; i < ii; i++) {
      if (descriptors[i].matchesURL(url)) {
        return descriptors[i];
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getDescriptors(opt_prefix) {
    var list = [];
    for (var key in this.descriptors_) {
      if (!opt_prefix || key.indexOf(opt_prefix) === 0) {
        var item = this.descriptors_[key];

        if (list.indexOf(item) === -1) {
          list.push(item);
        }
      }
    }

    return list;
  }

  /**
   * @inheritDoc
   */
  getProviderRoot() {
    return this.providerRoot_;
  }

  /**
   * @inheritDoc
   */
  updateFromSettings(settings) {
    var sets = Object.values(data.ProviderKey);
    for (var s = 0, ss = sets.length; s < ss; s++) {
      var providerKey = sets[s];
      var set = /** @type {Object} */ (settings.get([providerKey]));

      for (var id in set) {
        var item = /** @type {Object} */ (set[id]);

        // make sure the item is an object, in case Closure adds a UID key to the set
        if (typeof item == 'object') {
          item['id'] = id;
          item['providerKey'] = providerKey;
          var on = true;

          if ('enabled' in item) {
            if (typeof item['enabled'] === 'string') {
              on = item['enabled'].toLowerCase() == 'true';
            } else {
              on = item['enabled'];
            }
          }

          var dp = this.createProvider(item['type']);
          if (dp) {
            dp.setId(id);
            dp.configure(item);
            dp.setEnabled(on);
            dp.setEditable(s > 0);

            this.addProvider(dp);

            if (dp.getEnabled()) {
              dp.load();
            }
          }
        }
      }
    }

    // listen for changes and persist them back to settings
    for (var key in DescriptorEventType) {
      dispatcher.getInstance().listen(DescriptorEventType[key], this.persistDescriptors, false, this);
    }
  }

  /**
   * @inheritDoc
   */
  addProvider(dp) {
    if (this.getProvider(dp.getId())) {
      var msg = 'A provider with the ID "' + dp.getId() + '" already exists! Modify that one rather than replacing it.';
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
      return;
    }

    this.providerRoot_.addChild(dp);
    dp.listen(goog.events.EventType.PROPERTYCHANGE, this.onProviderChange, false, this);

    this.dispatchEvent(new DataProviderEvent(data.DataProviderEventType.ADD_PROVIDER, dp));
  }

  /**
   * @inheritDoc
   */
  removeProvider(id) {
    var provider = this.getProvider(id);
    if (provider) {
      provider.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onProviderChange, false, this);
      this.providerRoot_.removeChild(provider);

      this.dispatchEvent(new DataProviderEvent(data.DataProviderEventType.REMOVE_PROVIDER, provider));
      provider.dispose();
    }
  }

  /**
   * Handle property change events fired by data providers.
   *
   * @param {!os.events.PropertyChangeEvent} event
   * @protected
   */
  onProviderChange(event) {
    var p = event.getProperty();
    var provider = /** @type {data.ILoadingProvider} */ (event.target);

    if (p == 'loading' && !provider.isLoading()) {
      // alert listeners that a server failed to load
      this.dispatchEvent(new DataProviderEvent(data.DataProviderEventType.LOADED, provider));
    }
  }

  /**
   * @inheritDoc
   */
  setProviderEnabled(id, enabled) {
    var provider = this.getProvider(id);
    if (provider) {
      provider.setEnabled(enabled);
      this.dispatchEvent(new DataProviderEvent(data.DataProviderEventType.EDIT_PROVIDER, provider));
    }
  }

  /**
   * @inheritDoc
   */
  getProvider(id, opt_url) {
    // Get the base id for the provider
    id = id.replace(/#.*/, '');
    opt_url = opt_url ? opt_url.replace(/#.*/, '') : null;
    var list = this.providerRoot_.getChildren();
    var provider = null;

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].getId() == id ||
            (opt_url && list[i] instanceof AbstractLoadingServer && list[i].getUrl() == opt_url)) {
          provider = /** @type {IDataProvider} */ (list[i]);
          break;
        }
      }
    }

    return provider;
  }

  /**
   * @inheritDoc
   */
  getProviderByLabel(label) {
    var list = this.providerRoot_.getChildren();
    var provider = null;

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].getLabel() == label) {
          provider = /** @type {IDataProvider} */ (list[i]);
          break;
        }
      }
    }

    return provider;
  }

  /**
   * Migrate descriptors from direct reference of local storage to settings, which may be server or local persistence
   *
   * @private
   */
  migrateDescriptors_() {
    var str = window.localStorage.getItem(this.getDescriptorKey());
    if (str) {
      var list = /** @type {Array} */ (JSON.parse(str));
      Settings.getInstance().set(this.getDescriptorKey(), list);
      window.localStorage.removeItem(this.getDescriptorKey());
    }
  }

  /**
   * If any enabled provider is in the error state.
   *
   * @return {boolean}
   */
  hasError() {
    var providers = /** @type {Array<IDataProvider>} */ (this.providerRoot_.getChildren());
    if (providers) {
      return goog.array.some(providers, function(p) {
        return p.getEnabled() && p.getError();
      });
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  persistDescriptors() {
    this.persistDelay_.start();
  }

  /**
   * Private persist descriptors call - no delay
   */
  persistDescriptors_() {
    var list = [];
    var aliasesSeen = {};
    var now = Date.now();
    var threshold = now - 30 * 24 * 60 * 60 * 1000;

    for (var key in this.descriptors_) {
      if (!(key in aliasesSeen)) {
        var d = this.descriptors_[key];
        if (!d) {
          // descriptor missing, carry on
          continue;
        }

        // mark all of these aliases as covered so we don't duplicate the descriptor
        var aliases = d.getAliases();
        for (var i = 0, n = aliases.length; i < n; i++) {
          aliasesSeen[aliases[i]] = true;
        }

        if (os.implements(d, IUrlDescriptor.ID)) {
          var url = /** @type {IUrlDescriptor} */ (d).getUrl();
          if (!url || (os.file.isLocal(url) && !os.file.FileStorage.getInstance().isPersistent())) {
            // skip the descriptor if the URL is missing, or if it's a local URL and we can't persist the file
            continue;
          }
        }

        // persist the descriptor if it's local to the application, or it was active within the threshold
        if (d.isLocal() || d.getLastActive() > threshold) {
          list.push(d.persist());
        }
      }
    }

    Settings.getInstance().set(this.getDescriptorKey(), list);
  }

  /**
   * @inheritDoc
   */
  restoreDescriptors() {
    var list = Settings.getInstance().get(this.getDescriptorKey());

    if (list) {
      var now = Date.now();

      if (list) {
        for (var i = 0, n = list.length; i < n; i++) {
          try {
            var d = this.createDescriptor(list[i]['dType']);

            if (d) {
              d.restore(list[i]);

              if (d.getId() && (isNaN(d.getDeleteTime()) || d.getDeleteTime() > now)) {
                this.addDescriptor(d);
              }
            }
          } catch (e) {
            log.warning(this.log, 'There was an error loading data descriptor #' + i);
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  getDescriptorKey() {
    return DataManager.DESCRIPTOR_KEY;
  }

  /**
   * @inheritDoc
   */
  getSource(id) {
    return this.sources_[id] || null;
  }

  /**
   * @inheritDoc
   */
  getSources() {
    var src = [];
    for (var key in this.sources_) {
      src.push(this.sources_[key]);
    }

    return src;
  }

  /**
   * @inheritDoc
   */
  getTotalFeatureCount() {
    var count = 0;
    var sources = this.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var fc = sources[i].getFeatureCount();

      if (Number.isInteger(fc)) {
        count += fc;
      } else {
        log.error(logger, 'getFeatureCount() for ' + sources[i].getId() +
            ' was not an integer! ' + fc);
      }
    }

    return count;
  }

  /**
   * @inheritDoc
   */
  addSource(source) {
    if (!(source.getId() in this.sources_)) {
      this.sources_[source.getId()] = source;
      source.setTimeFilterEnabled(this.timeFilterEnabled_);
      this.dispatchEvent(new DataEvent(DataEventType.SOURCE_ADDED, source));
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  removeSource(source) {
    if (source.getId() in this.sources_) {
      delete this.sources_[source.getId()];
      this.dispatchEvent(new DataEvent(DataEventType.SOURCE_REMOVED, source));
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getTimeFilterEnabled() {
    return this.timeFilterEnabled_;
  }

  /**
   * @inheritDoc
   */
  setTimeFilterEnabled(value) {
    if (this.timeFilterEnabled_ != value) {
      this.timeFilterEnabled_ = value;

      for (var key in this.sources_) {
        this.sources_[key].setTimeFilterEnabled(value);
      }

      Settings.getInstance().set(DataManagerSetting.FILTER_TIME, value);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TIME_FILTER_ENABLED, value));
    }
  }

  /**
   * @param {LayerEvent} event
   * @private
   */
  onLayerAdded_(event) {
    if (instanceOf(event.layer, LayerClass.VECTOR)) {
      var layer = /** @type {VectorLayer} */ (event.layer);
      if (instanceOf(layer.getSource(), SourceClass.VECTOR)) {
        var source = /** @type {VectorSource} */ (layer.getSource());
        this.addSource(source);
      }
    }
  }

  /**
   * @param {LayerEvent} event
   * @private
   */
  onLayerRemoved_(event) {
    if (instanceOf(event.layer, LayerClass.VECTOR)) {
      var layer = /** @type {VectorLayer} */ (event.layer);
      if (instanceOf(layer.getSource(), SourceClass.VECTOR)) {
        var source = /** @type {VectorSource} */ (layer.getSource());
        this.removeSource(source);
      }
    }
  }

  /**
   * Set the application time from a descriptor.
   *
   * @param {string} id The descriptor id
   * @return {boolean} If the time was changed
   */
  setTimeFromDescriptor(id) {
    var descriptor = this.getDescriptor(id);
    if (descriptor) {
      var maxDate = descriptor.getMaxDate();
      if (maxDate > 0 && maxDate < os.time.TimeInstant.MAX_TIME) {
        // try to clamp this to reasonable values, avoiding unbounded end dates
        os.time.TimelineController.getInstance().setRangeStart(maxDate);
        return true;
      }
    }

    return false;
  }

  /**
   * Get the global instance.
   * @return {!DataManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new DataManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {DataManager} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {DataManager|undefined}
 */
let instance;

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.data.DataManager');


/**
 * @type {string}
 */
DataManager.DESCRIPTOR_KEY = os.NAMESPACE + '.descriptors';


/**
 * Base key for settings.
 * @type {string}
 * @const
 */
DataManager.BASE_KEY = 'dataManager';


/**
 * OpenSphere data manager settings.
 * @enum {string}
 */
const DataManagerSetting = {
  FILTER_TIME: DataManager.BASE_KEY + '.filterTime'
};


exports = DataManager;
