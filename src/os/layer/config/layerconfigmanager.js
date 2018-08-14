goog.provide('os.layer.config.LayerConfigManager');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.layer.config.ILayerConfig');


/**
 * @typedef {function():!Object<string, *>}
 */
os.layer.config.DefaultFn;



/**
 * @constructor
 */
os.layer.config.LayerConfigManager = function() {
  /**
   * @type {Object.<string, os.layer.config.DefaultFn>}
   * @private
   */
  this.defaultFns_ = {};

  /**
   * @type {Object.<string, function(new:os.layer.config.ILayerConfig)>}
   * @private
   */
  this.layerConfigs_ = {};
};
goog.addSingletonGetter(os.layer.config.LayerConfigManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.config.LayerConfigManager.LOGGER_ = goog.log.getLogger('os.layer.config.LayerConfigManager');


/**
 * Gets a new layer config instance by type (not case sensitive).
 * @param {string} type
 * @return {!Object<string, *>}
 */
os.layer.config.LayerConfigManager.prototype.getDefaultLayerConfig = function(type) {
  var defaultConfig = {};
  type = type.toLowerCase();
  if (type in this.defaultFns_) {
    defaultConfig = this.defaultFns_[type]();
  }

  return defaultConfig;
};


/**
 * Gets a new layer config instance by type (not case sensitive).
 * @param {string} type
 * @return {?os.layer.config.ILayerConfig}
 */
os.layer.config.LayerConfigManager.prototype.getLayerConfig = function(type) {
  var layerConfig = null;
  type = type.toLowerCase();
  if (type in this.layerConfigs_) {
    layerConfig = new this.layerConfigs_[type]();
  }

  return layerConfig;
};


/**
 * Registers a default layer config function with the manager. Registered types are not case sensitive.
 * @param {string} type
 * @param {!os.layer.config.DefaultFn} defaultFn
 */
os.layer.config.LayerConfigManager.prototype.registerDefaultLayerConfig = function(type, defaultFn) {
  type = type.toLowerCase();

  if (type in this.defaultFns_) {
    goog.log.warning(os.layer.config.LayerConfigManager.LOGGER_,
        'Default layer config is being overridden for: ' + type);
  }

  this.defaultFns_[type] = defaultFn;
};


/**
 * Registers a layer config class with the manager. Registered types are not case sensitive.
 * @param {string} type
 * @param {function(new:os.layer.config.ILayerConfig)} layerConfig
 */
os.layer.config.LayerConfigManager.prototype.registerLayerConfig = function(type, layerConfig) {
  type = type.toLowerCase();

  if (type in this.layerConfigs_) {
    goog.log.warning(os.layer.config.LayerConfigManager.LOGGER_, 'Layer config is being overridden for: ' + type);
  }

  this.layerConfigs_[type] = layerConfig;
};
