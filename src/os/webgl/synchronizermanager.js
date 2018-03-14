goog.provide('os.webgl.SynchronizerManager');

goog.require('os.layer.SynchronizerType');



/**
 * The synchronizer manager keeps reference to the available types of synchronizers in the app. In addition to the
 * synchronizers, it allows plugins to register their own via {@code registerSynchronizer}. The root
 * synchronizer then gets synchronizers for layers via the {@code getSynchronizer} method.
 * @constructor
 */
os.webgl.SynchronizerManager = function() {
  /**
   * @type {!Object<string, function(new:os.webgl.AbstractWebGLSynchronizer, ...?)>}
   * @private
   */
  this.synchronizers_ = {};
};
goog.addSingletonGetter(os.webgl.SynchronizerManager);


/**
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.webgl.SynchronizerManager.LOGGER_ = goog.log.getLogger('os.webgl.SynchronizerManager');


/**
 * Registers a synchronizer constructor by type.
 * @param {string} type The synchronizer type. Should match the types provided by layers that need to be synced.
 * @param {function(new:os.webgl.AbstractWebGLSynchronizer, ...?)} synchronizer The synchronizer constructor
 */
os.webgl.SynchronizerManager.prototype.registerSynchronizer = function(type, synchronizer) {
  if (!(type in this.synchronizers_)) {
    this.synchronizers_[type] = synchronizer;
  } else {
    // log it as an error and don't override the existing synchronizer
    goog.log.error(os.webgl.SynchronizerManager.LOGGER_, 'A synchronizer of that type is already registered!');
  }
};


/**
 * Gets a synchronizer for a layer.
 * @param {os.layer.ILayer} layer
 * @return {?function(new:os.webgl.AbstractWebGLSynchronizer, ...?)}
 */
os.webgl.SynchronizerManager.prototype.getSynchronizer = function(layer) {
  var type = layer.getSynchronizerType();
  return type ? this.synchronizers_[type] : null;
};
