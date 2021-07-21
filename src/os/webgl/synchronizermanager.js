goog.module('os.webgl.SynchronizerManager');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');

goog.requireType('os.webgl.AbstractWebGLSynchronizer');


/**
 * The synchronizer manager keeps reference to the available types of synchronizers in the app. In addition to the
 * synchronizers, it allows plugins to register their own via {@code registerSynchronizer}. The root
 * synchronizer then gets synchronizers for layers via the {@code getSynchronizer} method.
 */
class SynchronizerManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {!Object<string, function(new:os.webgl.AbstractWebGLSynchronizer, ...?)>}
     * @private
     */
    this.synchronizers_ = {};
  }

  /**
   * Registers a synchronizer constructor by type.
   *
   * @param {string} type The synchronizer type. Should match the types provided by layers that need to be synced.
   * @param {function(new:os.webgl.AbstractWebGLSynchronizer, ...?)} synchronizer The synchronizer constructor
   */
  registerSynchronizer(type, synchronizer) {
    if (!(type in this.synchronizers_)) {
      this.synchronizers_[type] = synchronizer;
    } else {
      // log it as an error and don't override the existing synchronizer
      log.error(SynchronizerManager.LOGGER_, 'A synchronizer of that type is already registered!');
    }
  }

  /**
   * Gets a synchronizer for a layer.
   *
   * @param {os.layer.ILayer} layer
   * @return {?function(new:os.webgl.AbstractWebGLSynchronizer, ...?)}
   */
  getSynchronizer(layer) {
    var type = layer.getSynchronizerType();
    return type ? this.synchronizers_[type] : null;
  }
}

goog.addSingletonGetter(SynchronizerManager);


/**
 * @type {goog.log.Logger}
 * @const
 * @private
 */
SynchronizerManager.LOGGER_ = log.getLogger('os.webgl.SynchronizerManager');


exports = SynchronizerManager;
