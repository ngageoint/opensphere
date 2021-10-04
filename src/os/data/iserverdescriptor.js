goog.declareModuleId('os.data.IServerDescriptor');

/**
 * Interface for descriptors loaded from a server.
 *
 * @interface
 */
export default class IServerDescriptor {
  /**
   * Mark the descriptor as updated.
   */
  updatedFromServer() {}
}
