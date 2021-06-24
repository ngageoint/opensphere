goog.module('os.data.IServerDescriptor');
goog.module.declareLegacyNamespace();


/**
 * Interface for descriptors loaded from a server.
 *
 * @interface
 */
class IServerDescriptor {
  /**
   * Mark the descriptor as updated.
   */
  updatedFromServer() {}
}

exports = IServerDescriptor;
