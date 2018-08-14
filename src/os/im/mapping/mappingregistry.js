goog.provide('os.im.mapping.MappingRegistry');
goog.require('goog.log');
goog.require('goog.log.Logger');



/**
 * Executes commands in sequence. The command queue size is limited to
 * <code>getMaxQueueSize()</code>. Undo and redo operations are supported. Both
 * synchronous and asynchronous commands are supported, however, synchronous
 * commands that kick off jobs are recommended over asynchronous commands
 * unless the asynchronous processing is quick enough to make that overkill.
 * @constructor
 */
os.im.mapping.MappingRegistry = function() {
  /**
   * Internal registry map.
   * @type {Object}
   * @private
   */
  this.registry_ = {};
};
goog.addSingletonGetter(os.im.mapping.MappingRegistry);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.mapping.MappingRegistry.LOGGER_ =
    goog.log.getLogger('os.im.mapping.MappingRegistry');


/**
 * Adds a mapping to the registry. Only the first mapping will be written.
 * Others will fail to overwrite and an error will be logged.
 * @param {!string} mapKey The mapping key.
 * @param {!function(new: os.im.mapping.IMapping, ...?)} mapping A constructor for an IMapping.
 * @return {boolean} True on success, false otherwise.
 */
os.im.mapping.MappingRegistry.prototype.registerMapping = function(mapKey, mapping) {
  if (!this.registry_[mapKey]) {
    this.registry_[mapKey] = mapping;
    return true;
  } else {
    var err = 'A mapping with key: ' + mapKey +
        ' was already applied. Additional mappings with the same name are not allowed.';
    goog.log.error(os.im.mapping.MappingRegistry.LOGGER_, err);
    return false;
  }
};


/**
 * Returns a new mapping based on the key.
 * Others will fail to overwrite and an error will be logged.
 * @param {!string} mapKey The mapping key.
 * @return {?os.im.mapping.IMapping} A new class otherwise null.
 */
os.im.mapping.MappingRegistry.prototype.getMapping = function(mapKey) {
  var clazz = this.registry_[mapKey];

  if (clazz) {
    var mapping = /** @type {os.im.mapping.IMapping} */ (new clazz());
    return mapping;
  } else {
    var err = 'There was no class associated with the key: ' + mapKey;
    goog.log.error(os.im.mapping.MappingRegistry.LOGGER_, err);
  }

  return null;
};


/**
 * Restore
 * @param {!Object} config A configuration, usually extracted from the persist method.
 * @return {os.im.mapping.IMapping} A newly constructed class with the values restored from config.
 */
os.im.mapping.MappingRegistry.prototype.restore = function(config) {
  var clazz = this.registry_[config['id']];

  if (clazz) {
    var mapping = /** @type {os.im.mapping.IMapping} */ (new clazz());
    mapping.restore(config);
    return mapping;
  } else {
    var err = 'There was no class associated with the configuration object.';
    goog.log.error(os.im.mapping.MappingRegistry.LOGGER_, err);
  }

  return null;
};
