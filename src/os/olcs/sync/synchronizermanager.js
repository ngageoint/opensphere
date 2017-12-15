goog.provide('os.olcs.sync.SynchronizerManager');
goog.require('os.layer.SynchronizerType');
goog.require('os.olcs.sync.DrawingLayerSynchronizer');
goog.require('os.olcs.sync.ImageSynchronizer');
goog.require('os.olcs.sync.TileSynchronizer');
goog.require('os.olcs.sync.VectorSynchronizer');



/**
 * The synchronizer manager keeps reference to the available types of synchronizers in the app. In addition to the
 * synchronizers, it allows plugins to register their own via {@code registerSynchronizer}. The root
 * synchronizer then gets synchronizers for layers via the {@code getSynchronizer} method.
 * @constructor
 */
os.olcs.sync.SynchronizerManager = function() {
  /**
   * @type {!Object<string, function(new:os.olcs.sync.AbstractSynchronizer, ...?)>}
   * @private
   */
  this.synchronizers_ = {};

  // register the default set of synchronizers
  this.registerSynchronizer(os.layer.SynchronizerType.VECTOR, os.olcs.sync.VectorSynchronizer);
  this.registerSynchronizer(os.layer.SynchronizerType.TILE, os.olcs.sync.TileSynchronizer);
  this.registerSynchronizer(os.layer.SynchronizerType.IMAGE, os.olcs.sync.ImageSynchronizer);
  this.registerSynchronizer(os.layer.SynchronizerType.DRAW, os.olcs.sync.DrawingLayerSynchronizer);
};
goog.addSingletonGetter(os.olcs.sync.SynchronizerManager);


/**
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.olcs.sync.SynchronizerManager.LOGGER_ = goog.log.getLogger('os.olcs.sync.SynchronizerManager');


/**
 * Registers a synchronizer constructor by type.
 * @param {string} type The synchronizer type. Should match the types provided by layers that need to be synced.
 * @param {function(new:os.olcs.sync.AbstractSynchronizer, ...?)} synchronizer The synchronizer constructor
 */
os.olcs.sync.SynchronizerManager.prototype.registerSynchronizer = function(type, synchronizer) {
  if (!(type in this.synchronizers_)) {
    this.synchronizers_[type] = synchronizer;
  } else {
    // log it as an error and don't override the existing synchronizer
    goog.log.error(os.olcs.sync.SynchronizerManager.LOGGER_, 'A synchronizer of that type is already registered!');
  }
};


/**
 * Gets a synchronizer for a layer.
 * @param {os.layer.ILayer} layer
 * @return {?function(new:os.olcs.sync.AbstractSynchronizer, ...?)}
 */
os.olcs.sync.SynchronizerManager.prototype.getSynchronizer = function(layer) {
  var type = layer.getSynchronizerType();
  return type ? this.synchronizers_[type] : null;
};
