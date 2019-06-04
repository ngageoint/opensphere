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
 * ID for {@see os.implements}
 * @const {string}
 */
os.data.IDataProvider.ID = 'os.data.IDataProvider';

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
os.data.IDataProvider.prototype.getEnabled;


/**
 * @param {boolean} value Whether or not the provider is enabled
 */
os.data.IDataProvider.prototype.setEnabled;


/**
 * @return {boolean} <code>true</code> if the provider is editable, <code>false</code> otherwise
 */
os.data.IDataProvider.prototype.getEditable;


/**
 * @param {boolean} value Whether or not the provider is editable
 */
os.data.IDataProvider.prototype.setEditable;


/**
 * @return {boolean} Whether or not this provider should show up in the server manager
 */
os.data.IDataProvider.prototype.includeInServers;


/**
 * @return {boolean} Whether or not this provider should show when empty
 */
os.data.IDataProvider.prototype.getShowWhenEmpty;


/**
 * Gets the info to display for this provider. This can be a directive and will be compiled by Angular.
 * @return {string} The info string
 */
os.data.IDataProvider.prototype.getInfo;


/**
 * @return {boolean} <code>true</code> if there were errors loading or setting up the
 * provider, <code>false</code> otherwise.
 */
os.data.IDataProvider.prototype.getError;


/**
 * @return {?string} The error message
 */
os.data.IDataProvider.prototype.getErrorMessage;
