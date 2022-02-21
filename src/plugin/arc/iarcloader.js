goog.declareModuleId('plugin.arc.IArcLoader');


/**
 * Interface for loading an Arc server.
 * @extends {IDisposable}
 * @extends {Listenable}
 * @interface
 */
class IArcLoader {
  /**
   * Constructor.
   * @param {SlickTreeNode} node The root tree node.
   * @param {string} url The Arc service URL for the node.
   * @param {ArcServer} server The Arc server instance.
   */
  constructor(node, url, server) {}

  /**
   * Get errors from the request.
   * @return {Array<string>}
   */
  getErrors() {}

  /**
   * Get the Arc service URL for the node.
   * @return {string} The URL.
   */
  getUrl() {}

  /**
   * Set the Arc service URL for the node.
   * @param {string} value The URL.
   */
  setUrl(value) {}

  /**
   * Get the root tree node.
   * @return {SlickTreeNode} The root tree node.
   */
  getNode() {}

  /**
   * Set the root tree node.
   * @param {SlickTreeNode} value The root tree node.
   */
  setNode(value) {}

  /**
   * Get the Arc server instance.
   * @return {ArcServer} The server.
   */
  getServer() {}

  /**
   * Set the Arc server instance.
   * @param {ArcServer} value The server.
   */
  setServer(value) {}

  /**
   * Loads Arc node capabilities.
   */
  load() {}
}

export default IArcLoader;
