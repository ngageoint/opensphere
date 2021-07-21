goog.module('os.data.IDataProvider');
goog.module.declareLegacyNamespace();

const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * The interface for all data providers. Data providers can be servers, file types, mock data streams, etc.
 * The purpose of data providers is to provide a tree or list of data descriptors.
 *
 * @extends {ITreeNode}
 * @interface
 */
class IDataProvider {
  /**
   * Configures the data provider from the given config object.
   * @param {Object.<string, *>} config The config object
   */
  configure(config) {}

  /**
   * Loads, or sets up, the provider
   * @param {boolean=} opt_ping Whether or not this is a ping load
   */
  load(opt_ping) {}

  /**
   * @return {boolean} <code>true</code> if the provider is enabled, <code>false</code> otherwise
   */
  getEnabled() {}

  /**
   * @param {boolean} value Whether or not the provider is enabled
   */
  setEnabled(value) {}

  /**
   * @return {boolean} <code>true</code> if the provider is editable, <code>false</code> otherwise
   */
  getEditable() {}

  /**
   * @param {boolean} value Whether or not the provider is editable
   */
  setEditable(value) {}

  /**
   * @return {boolean} Whether or not this provider should show up in the server manager
   */
  includeInServers() {}

  /**
   * @return {boolean} Whether or not this provider should show when empty
   */
  getShowWhenEmpty() {}

  /**
   * Gets the info to display for this provider. This can be a directive and will be compiled by Angular.
   * @return {string} The info string
   */
  getInfo() {}

  /**
   * @return {boolean} <code>true</code> if there were errors loading or setting up the
   * provider, <code>false</code> otherwise.
   */
  getError() {}

  /**
   * @return {?string} The error message
   */
  getErrorMessage() {}
}

/**
 * ID for {@see os.implements}
 * @const {string}
 */
IDataProvider.ID = 'os.data.IDataProvider';

exports = IDataProvider;
