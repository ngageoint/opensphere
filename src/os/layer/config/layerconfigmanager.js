goog.declareModuleId('os.layer.config.LayerConfigManager');

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {DefaultFn} = goog.requireType('os.layer.config');
const {default: ILayerConfig} = goog.requireType('os.layer.config.ILayerConfig');


/**
 */
export default class LayerConfigManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Object<string, DefaultFn>}
     * @private
     */
    this.defaultFns_ = {};

    /**
     * @type {Object<string, function(new:ILayerConfig)>}
     * @private
     */
    this.layerConfigs_ = {};
  }

  /**
   * Gets a new layer config instance by type (not case sensitive).
   *
   * @param {string} type
   * @return {!Object<string, *>}
   */
  getDefaultLayerConfig(type) {
    var defaultConfig = {};
    type = type.toLowerCase();
    if (type in this.defaultFns_) {
      defaultConfig = this.defaultFns_[type]();
    }

    return defaultConfig;
  }

  /**
   * Gets a new layer config instance by type (not case sensitive).
   *
   * @param {string} type
   * @return {?ILayerConfig}
   */
  getLayerConfig(type) {
    var layerConfig = null;
    type = type.toLowerCase();
    if (type in this.layerConfigs_) {
      layerConfig = new this.layerConfigs_[type]();
    }

    return layerConfig;
  }

  /**
   * Registers a default layer config function with the manager. Registered types are not case sensitive.
   *
   * @param {string} type
   * @param {!DefaultFn} defaultFn
   */
  registerDefaultLayerConfig(type, defaultFn) {
    type = type.toLowerCase();

    if (type in this.defaultFns_) {
      log.warning(logger, 'Default layer config is being overridden for: ' + type);
    }

    this.defaultFns_[type] = defaultFn;
  }

  /**
   * Registers a layer config class with the manager. Registered types are not case sensitive.
   *
   * @param {string} type
   * @param {function(new:ILayerConfig)} layerConfig
   */
  registerLayerConfig(type, layerConfig) {
    type = type.toLowerCase();

    if (type in this.layerConfigs_) {
      log.warning(logger, 'Layer config is being overridden for: ' + type);
    }

    this.layerConfigs_[type] = layerConfig;
  }

  /**
   * Get the global instance.
   * @return {!LayerConfigManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new LayerConfigManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {LayerConfigManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {LayerConfigManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.layer.config.LayerConfigManager');
