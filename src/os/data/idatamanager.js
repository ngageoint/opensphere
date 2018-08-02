goog.provide('os.data.IDataManager');

goog.require('goog.events.Listenable');
goog.require('os.config.Settings');
goog.require('os.data.IDataDescriptor');
goog.require('os.data.IDataProvider');
goog.require('os.data.ProviderEntry');


/**
 * Global data manager reference. Set this in each application with the app-specific manager reference.
 * @type {os.data.IDataManager}
 */
os.dataManager = null;



/**
 * The data manager provides methods for tracking and registering providers and descriptors.
 * @extends {goog.events.Listenable}
 * @interface
 */
os.data.IDataManager = function() {};


/**
 * Registers a provider type
 * @param {!os.data.ProviderEntry} entry The provider type entry
 */
os.data.IDataManager.prototype.registerProviderType;


/**
 * @param {?string} type
 * @return {?os.data.ProviderEntry} The entry or null if not found
 */
os.data.IDataManager.prototype.getProviderEntry;


/**
 * Gets a provider type by file
 * @param {!os.file.File} file
 * @return {?string} The type or null if it could not be found
 */
os.data.IDataManager.prototype.getProviderTypeByFile;


/**
 * Gets a provider type by class
 * @param {Function} clazz The class
 * @return {?string} The type or null if it could not be found
 */
os.data.IDataManager.prototype.getProviderTypeByClass;


/**
 * Registers a descriptor type
 * @param {!string} type The type
 * @param {!function()} clazz The class
 * @param {boolean=} opt_override Use this to force an override of a descriptor type
 */
os.data.IDataManager.prototype.registerDescriptorType;


/**
 * Creates a new data provider for the given type
 * @param {!string} type The type
 * @return {?os.data.IDataProvider} The data provider
 */
os.data.IDataManager.prototype.createProvider;


/**
 * Creates a new data descriptor from the given type
 * @param {!string} type The type
 * @return {?os.data.IDataDescriptor} The data descriptor
 */
os.data.IDataManager.prototype.createDescriptor;


/**
 * Updates a data descriptor by replacing it.
 * The update was created because some providers on a REMOVE event would execute a delete on the server.
 * @param {!os.data.IDataDescriptor} oldDescriptor The old descriptor
 * @param {!os.data.IDataDescriptor} newDescriptor The new descriptor
 */
os.data.IDataManager.prototype.updateDescriptor;


/**
 * Adds a data descriptor
 * @param {!os.data.IDataDescriptor} descriptor The descriptor
 */
os.data.IDataManager.prototype.addDescriptor;


/**
 * Removes a data descriptor
 * @param {!os.data.IDataDescriptor} descriptor The descriptor
 */
os.data.IDataManager.prototype.removeDescriptor;


/**
 * Gets a data descriptor
 * @param {string} id The descriptor ID to get
 * @return {?os.data.IDataDescriptor} The descriptor or <code>null</code> if none was found
 */
os.data.IDataManager.prototype.getDescriptor;


/**
 * Gets all data descriptors whose IDs start with the opt_prefix, or all data descriptors if undefined.
 * @param {string=} opt_prefix
 * @return {!Array<!os.data.IDataDescriptor>} The descriptors which matched
 */
os.data.IDataManager.prototype.getDescriptors;


/**
 * Gets the data provider root node
 * @return {!os.structs.ITreeNode} The root node
 */
os.data.IDataManager.prototype.getProviderRoot;


/**
 * Updates the data manager and providers from settings
 * @param {os.config.Settings} settings the settings
 */
os.data.IDataManager.prototype.updateFromSettings;


/**
 * Adds a data provider
 * @param {!os.data.IDataProvider} dp The provider
 */
os.data.IDataManager.prototype.addProvider;


/**
 * Removes a data provider
 * @param {!string} id
 */
os.data.IDataManager.prototype.removeProvider;


/**
 * Removes a data provider
 * @param {!string} id
 * @param {boolean} enabled
 */
os.data.IDataManager.prototype.setProviderEnabled;


/**
 * Get a provider by id
 * @param {string} id The provider id
 * @param {?string=} opt_url The provider url
 * @return {?os.data.IDataProvider}
 */
os.data.IDataManager.prototype.getProvider;


/**
 * Get a provider by label
 * @param {string} label The provider label
 * @return {?os.data.IDataProvider}
 */
os.data.IDataManager.prototype.getProviderByLabel;


/**
 * Persist the descriptors
 */
os.data.IDataManager.prototype.persistDescriptors;


/**
 * Restore the descriptors
 */
os.data.IDataManager.prototype.restoreDescriptors;


/**
 * Gets the localStorage descriptor key for the datamanager to persist descriptors to.
 * @return {!string}
 */
os.data.IDataManager.prototype.getDescriptorKey;
