goog.provide('os.plugin.PluginManager');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.config.Settings');
goog.require('os.plugin.IPlugin');



/**
 * The plugin manager helps initialize a group of plugins.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.plugin.PluginManager = function() {
  os.plugin.PluginManager.base(this, 'constructor');

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
   * @type {!Array<!os.plugin.IPlugin>}
   * @private
   */
  this.plugins_ = [];

  /**
   * The map of plugin IDs to init state
   * @type {?Object.<string, boolean>}
   * @private
   */
  this.initMap_ = {};
};
goog.inherits(os.plugin.PluginManager, goog.events.EventTarget);
goog.addSingletonGetter(os.plugin.PluginManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.plugin.PluginManager.LOGGER_ = goog.log.getLogger('os.plugin.PluginManager');


/**
 * Default initialization timeout duration.
 * @type {number}
 * @private
 * @const
 */
os.plugin.PluginManager.INIT_TIMEOUT_ = 10 * 1000;


/**
 * @inheritDoc
 */
os.plugin.PluginManager.prototype.disposeInternal = function() {
  os.plugin.PluginManager.base(this, 'disposeInternal');

  this.plugins_.forEach(function(plugin) {
    plugin.dispose();
  });

  this.plugins_.length = 0;
};


/**
 * Determine if plug-in is enabled based on configuration
 * @param {!string} pluginId
 * @return {boolean}
 */
os.plugin.PluginManager.prototype.isPluginEnabled = function(pluginId) {
  var enabled = os.settings.get(['plugins', pluginId], true);
  // in the event that settings hasn't been used, enable will default to null instead of true
  return (/** @type {boolean} */ (enabled) || enabled === null);
};


/**
 * Adds a plugin and initializes it if the manager has already initialzed.
 * Otherwise it will initialize when the manager initializes.
 *
 * @param {!os.plugin.IPlugin} p The plugin to add
 */
os.plugin.PluginManager.prototype.addPlugin = function(p) {
  if (this.init_) {
    if (this.filterDisabled_(p)) {
      this.plugins_.push(p);
      this.initPlugin_(p);
    }
  } else {
    this.plugins_.push(p);
  }
};


/**
 * @param {os.plugin.IPlugin} p The plugin to init
 * @private
 */
os.plugin.PluginManager.prototype.initPlugin_ = function(p) {
  this.initMap_[p.getId()] = false;

  goog.log.fine(os.plugin.PluginManager.LOGGER_, 'Initializing plugin ' + p.getId());

  try {
    var promise = p.init();
    if (promise) {
      promise.then(function() {
        goog.log.fine(os.plugin.PluginManager.LOGGER_, 'Initialized plugin ' + p.getId());
      }, function(err) {
        goog.log.warning(os.plugin.PluginManager.LOGGER_, 'Error loading plugin ' + p.getId() + ': ' + p.getError());
      }, this).thenAlways(this.markPlugin_.bind(this, p));
    } else {
      this.markPlugin_(p);
    }
  } catch (e) {
    goog.log.error(os.plugin.PluginManager.LOGGER_, 'Error loading plugin ' + p.getId(), e);
    this.markPlugin_(p);
  }
};


/**
 * Looks up a plugin by id.
 * @param {string} id The plugin id
 * @return {?os.plugin.IPlugin} The plugin, if found.
 */
os.plugin.PluginManager.prototype.getPlugin = function(id) {
  for (var i = 0, n = this.plugins_.length; i < n; i++) {
    if (this.plugins_[i].getId() == id) {
      return this.plugins_[i];
    }
  }

  return null;
};


/**
 * Get all plugins
 * @return {!Array<!os.plugin.IPlugin>} the plugins
 */
os.plugin.PluginManager.prototype.getPlugins = function() {
  return this.plugins_;
};


/**
 * Initialize the manager. This will kick off the initialization of all plugins
 * that are currently registered with the manager. Listen for
 * {@link goog.events.EventType.LOAD} for when all plugins are complete.
 */
os.plugin.PluginManager.prototype.init = function() {
  goog.log.info(os.plugin.PluginManager.LOGGER_, 'Initializing plugins ...');

  this.init_ = true;
  this.plugins_ = this.plugins_.filter(this.filterDisabled_, this);

  if (this.plugins_.length > 0) {
    // if plugins fail to load within the timeout interval, finish without them so the application can continue loading
    var initTimeout = /** @type {number} */ (os.settings.get('plugin.initTimeout',
        os.plugin.PluginManager.INIT_TIMEOUT_));
    this.initTimeoutId_ = setTimeout(this.onInitTimeout_.bind(this), initTimeout);
    this.plugins_.forEach(this.initPlugin_, this);
  } else {
    // no plugins to load - all done
    this.finish_();
  }
};


/**
 * Handle timeout reached in the initialization routine.
 * @private
 */
os.plugin.PluginManager.prototype.onInitTimeout_ = function() {
  // clear the timeout identifier
  this.initTimeoutId_ = undefined;

  // report which plugins have not yet initialized
  var pending = [];
  for (var id in this.initMap_) {
    if (!this.initMap_[id]) {
      pending.push(id);
    }
  }

  goog.log.warning(os.plugin.PluginManager.LOGGER_,
      'Plugin initialization timed out for the following plugin(s): ' + pending.join(', '));

  // finish the loading sequence
  this.finish_();
};


/**
 * @param {os.plugin.IPlugin} p The plugin
 * @return {boolean} Whether or not the plugin should remain in the plugin list
 * @private
 */
os.plugin.PluginManager.prototype.filterDisabled_ = function(p) {
  if (!this.isPluginEnabled(p.getId())) {
    goog.log.info(os.plugin.PluginManager.LOGGER_, 'Plugin ' + p.getId() + ' is disabled and will not be added.');
    p.dispose();
    return false;
  }

  return true;
};


/**
 * @private
 */
os.plugin.PluginManager.prototype.finish_ = function() {
  if (!this.ready) {
    goog.log.info(os.plugin.PluginManager.LOGGER_, 'Finished loading plugins');

    if (this.initTimeoutId_ != null) {
      clearTimeout(this.initTimeoutId_);
      this.initTimeoutId_ = undefined;
    }

    this.ready = true;
    this.dispatchEvent(goog.events.EventType.LOAD);
  }
};


/**
 * Marks a plugin as complete and checks if the manager has finished loading
 * all the plugins.
 *
 * @param {os.plugin.IPlugin} plugin The plugin
 * @private
 */
os.plugin.PluginManager.prototype.markPlugin_ = function(plugin) {
  this.initMap_[plugin.getId()] = true;

  for (var i = 0, n = this.plugins_.length; i < n; i++) {
    if (!this.initMap_[this.plugins_[i].getId()]) {
      return;
    }
  }

  // we're done
  this.finish_();
};


/**
 * Is the plugin manager done?
 * @return {boolean}
 */
os.plugin.PluginManager.prototype.isReady = function() {
  return this.ready;
};
