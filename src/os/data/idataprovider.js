goog.provide('os.data.IDataProvider');

goog.require('os.structs.ITreeNode');



/**
 * The interface for all data providers. Data providers can be servers, file types, mock data streams, etc.
 * The purpose of data providers is to provide a tree or list of data descriptors.
 * @extends {os.structs.ITreeNode}
 * @interface
 */
os.data.IDataProvider = function() {};


/**
 * Configures the data provider from the given config object.
 * @param {Object.<string, *>} config The config object
 */
os.data.IDataProvider.prototype.configure;


/**
 * Loads, or sets up, the provider
 * @param {boolean=} opt_ping Whether or not this is a ping load
 */
os.data.IDataProvider.prototype.load;


/**
 * @return {boolean} <code>true</code> if the provider is enabled, <code>false</code> otherwise
 */
os.data.IDataProvider.prototype.getEnabled = goog.abstractMethod;


/**
 * @param {boolean} value Whether or not the provider is enabled
 */
os.data.IDataProvider.prototype.setEnabled = goog.abstractMethod;


/**
 * @return {boolean} <code>true</code> if the provider is editable, <code>false</code> otherwise
 */
os.data.IDataProvider.prototype.getEditable = goog.abstractMethod;


/**
 * @param {boolean} value Whether or not the provider is editable
 */
os.data.IDataProvider.prototype.setEditable;


/**
 * @return {boolean} Whether or not this provider should show up in the server manager
 */
os.data.IDataProvider.prototype.includeInServers = goog.abstractMethod;


/**
 * @return {boolean} <code>true</code> if there were errors loading or setting up the
 * provider, <code>false</code> otherwise.
 */
os.data.IDataProvider.prototype.getError = goog.abstractMethod;


/**
 * @return {?string} The error message
 */
os.data.IDataProvider.prototype.getErrorMessage = goog.abstractMethod;
