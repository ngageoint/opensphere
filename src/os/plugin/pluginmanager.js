goog.module('os.plugin.PluginManager');

const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const IPlugin = goog.requireType('os.plugin.IPlugin');


/**
 * The plugin manager helps initialize a group of plugins.
 */
class PluginManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Whether or not the plugin manager has finished setting up
     * @type {boolean}
     */
    this.ready = false;

    /**
     * Whether or not this manager has been initialized
     * @type {boolean}
     * @private
     */
    this.init_ = false;

    /**
     * The id returned by the init setTimeout call.
     * @type {number|undefined}
     * @private
     */
    this.initTimeoutId_ = undefined;

    /**
     * The list of plugins
     * @type {!Array<!IPlugin>}
     * @private
     */
    this.plugins_ = [];

    /**
     * The map of plugin IDs to init state
     * @type {?Object<string, boolean>}
     * @private
     */
    this.initMap_ = {};
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.plugins_.forEach(function(plugin) {
      plugin.dispose();
    });

    this.plugins_.length = 0;
  }

  /**
   * Determine if plug-in is enabled based on configuration
   *
   * @param {!string} pluginId
   * @return {boolean}
   */
  isPluginEnabled(pluginId) {
    var enabled = Settings.getInstance().get(['plugins', pluginId], true);
    // in the event that settings hasn't been used, enable will default to null instead of true
    return (/** @type {boolean} */ (enabled) || enabled === null);
  }

  /**
   * Adds a plugin and initializes it if the manager has already initialzed.
   * Otherwise it will initialize when the manager initializes.
   *
   * @param {!IPlugin} p The plugin to add
   */
  addPlugin(p) {
    if (this.init_) {
      if (this.filterDisabled_(p)) {
        this.plugins_.push(p);
        this.initPlugin_(p);
      }
    } else {
      this.plugins_.push(p);
    }
  }

  /**
   * @param {IPlugin} p The plugin to init
   * @private
   */
  initPlugin_(p) {
    this.initMap_[p.getId()] = false;

    log.fine(logger, 'Initializing plugin ' + p.getId());

    try {
      var promise = p.init();
      if (promise) {
        promise.then(() => {
          log.fine(logger, 'Initialized plugin ' + p.getId());
        }, (err) => {
          log.warning(logger, 'Error loading plugin ' + p.getId() + ': ' + p.getError());
        }).thenAlways(this.markPlugin_.bind(this, p));
      } else {
        this.markPlugin_(p);
      }
    } catch (e) {
      log.error(logger, 'Error loading plugin ' + p.getId(), e);
      this.markPlugin_(p);
    }
  }

  /**
   * Looks up a plugin by id.
   *
   * @param {string} id The plugin id
   * @return {?IPlugin} The plugin, if found.
   */
  getPlugin(id) {
    for (var i = 0, n = this.plugins_.length; i < n; i++) {
      if (this.plugins_[i].getId() == id) {
        return this.plugins_[i];
      }
    }

    return null;
  }

  /**
   * Initialize the manager. This will kick off the initialization of all plugins
   * that are currently registered with the manager. Listen for
   * {@link GoogEventType.LOAD} for when all plugins are complete.
   */
  init() {
    log.info(logger, 'Initializing plugins ...');

    this.init_ = true;
    this.plugins_ = this.plugins_.filter(this.filterDisabled_, this);

    if (this.plugins_.length > 0) {
      // if plugins fail to load within the timeout interval, finish without them so the application can continue loading
      var initTimeout = /** @type {number} */ (Settings.getInstance().get('plugin.initTimeout',
          PluginManager.INIT_TIMEOUT));
      this.initTimeoutId_ = setTimeout(this.onInitTimeout_.bind(this), initTimeout);
      this.plugins_.forEach(this.initPlugin_, this);
    } else {
      // no plugins to load - all done
      this.finish_();
    }
  }

  /**
   * Handle timeout reached in the initialization routine.
   *
   * @private
   */
  onInitTimeout_() {
    // clear the timeout identifier
    this.initTimeoutId_ = undefined;

    // report which plugins have not yet initialized
    var pending = [];
    for (var id in this.initMap_) {
      if (!this.initMap_[id]) {
        pending.push(id);
      }
    }

    log.warning(logger,
        'Plugin initialization timed out for the following plugin(s): ' + pending.join(', '));

    // finish the loading sequence
    this.finish_();
  }

  /**
   * @param {IPlugin} p The plugin
   * @return {boolean} Whether or not the plugin should remain in the plugin list
   * @private
   */
  filterDisabled_(p) {
    if (!this.isPluginEnabled(p.getId())) {
      log.info(logger, 'Plugin ' + p.getId() + ' is disabled and will not be added.');
      p.dispose();
      return false;
    }

    return true;
  }

  /**
   * @private
   */
  finish_() {
    if (!this.ready) {
      log.info(logger, 'Finished loading plugins');

      if (this.initTimeoutId_ != null) {
        clearTimeout(this.initTimeoutId_);
        this.initTimeoutId_ = undefined;
      }

      this.ready = true;
      this.dispatchEvent(GoogEventType.LOAD);
    }
  }

  /**
   * Marks a plugin as complete and checks if the manager has finished loading
   * all the plugins.
   *
   * @param {IPlugin} plugin The plugin
   * @private
   */
  markPlugin_(plugin) {
    this.initMap_[plugin.getId()] = true;

    for (var i = 0, n = this.plugins_.length; i < n; i++) {
      if (!this.initMap_[this.plugins_[i].getId()]) {
        return;
      }
    }

    // we're done
    this.finish_();
  }

  /**
   * Is the plugin manager done?
   *
   * @return {boolean}
   */
  isReady() {
    return this.ready;
  }

  /**
   * Get the global instance.
   * @return {!PluginManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new PluginManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {PluginManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {PluginManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.plugin.PluginManager');

/**
 * Default initialization timeout duration.
 * @type {number}
 * @const
 */
PluginManager.INIT_TIMEOUT = 10 * 1000;

exports = PluginManager;
