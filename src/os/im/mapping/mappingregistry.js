goog.module('os.im.mapping.MappingRegistry');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const IMapping = goog.requireType('os.im.mapping.IMapping');


/**
 * Executes commands in sequence. The command queue size is limited to
 * <code>getMaxQueueSize()</code>. Undo and redo operations are supported. Both
 * synchronous and asynchronous commands are supported, however, synchronous
 * commands that kick off jobs are recommended over asynchronous commands
 * unless the asynchronous processing is quick enough to make that overkill.
 */
class MappingRegistry {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Internal registry map.
     * @type {Object}
     * @private
     */
    this.registry_ = {};
  }

  /**
   * Adds a mapping to the registry. Only the first mapping will be written.
   * Others will fail to overwrite and an error will be logged.
   *
   * @param {!string} mapKey The mapping key.
   * @param {!function(new: IMapping, ...?)} mapping A constructor for an IMapping.
   * @return {boolean} True on success, false otherwise.
   */
  registerMapping(mapKey, mapping) {
    if (!this.registry_[mapKey]) {
      this.registry_[mapKey] = mapping;
      return true;
    } else {
      var err = 'A mapping with key: ' + mapKey +
          ' was already applied. Additional mappings with the same name are not allowed.';
      log.error(logger, err);
      return false;
    }
  }

  /**
   * Returns a new mapping based on the key.
   * Others will fail to overwrite and an error will be logged.
   *
   * @param {!string} mapKey The mapping key.
   * @return {?IMapping} A new class otherwise null.
   */
  getMapping(mapKey) {
    var clazz = this.registry_[mapKey];

    if (clazz) {
      var mapping = /** @type {IMapping} */ (new clazz());
      return mapping;
    } else {
      var err = 'There was no class associated with the key: ' + mapKey;
      log.error(logger, err);
    }

    return null;
  }

  /**
   * Restore
   *
   * @param {!Object} config A configuration, usually extracted from the persist method.
   * @return {IMapping} A newly constructed class with the values restored from config.
   */
  restore(config) {
    var clazz = this.registry_[config['id']];

    if (clazz) {
      var mapping = /** @type {IMapping} */ (new clazz());
      mapping.restore(config);
      return mapping;
    } else {
      var err = 'There was no class associated with the configuration object.';
      log.error(logger, err);
    }

    return null;
  }

  /**
   * Get the global instance.
   * @return {!MappingRegistry}
   */
  static getInstance() {
    if (!instance) {
      instance = new MappingRegistry();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {MappingRegistry} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {MappingRegistry|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.im.mapping.MappingRegistry');

exports = MappingRegistry;
