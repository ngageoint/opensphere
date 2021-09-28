goog.declareModuleId('os.data.IDataManager');

const Listenable = goog.requireType('goog.events.Listenable');
const {default: Settings} = goog.requireType('os.config.Settings');
const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');
const {default: ProviderEntry} = goog.requireType('os.data.ProviderEntry');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * The data manager provides methods for tracking and registering providers and descriptors.
 *
 * @extends {Listenable}
 * @interface
 */
export default class IDataManager {
  /**
   * Registers a provider type
   * @param {!ProviderEntry} entry The provider type entry
   */
  registerProviderType(entry) {}

  /**
   * @param {?string} type
   * @return {?ProviderEntry} The entry or null if not found
   */
  getProviderEntry(type) {}

  /**
   * Gets a provider type by class
   * @param {Function} clazz The class
   * @return {?string} The type or null if it could not be found
   */
  getProviderTypeByClass(clazz) {}

  /**
   * Registers a descriptor type
   * @param {!string} type The type
   * @param {!function()} clazz The class
   * @param {boolean=} opt_override Use this to force an override of a descriptor type
   */
  registerDescriptorType(type, clazz, opt_override) {}

  /**
   * Creates a new data provider for the given type
   * @param {!string} type The type
   * @return {?IDataProvider} The data provider
   */
  createProvider(type) {}

  /**
   * Creates a new data descriptor from the given type
   * @param {!string} type The type
   * @return {?IDataDescriptor} The data descriptor
   */
  createDescriptor(type) {}

  /**
   * Updates a data descriptor by replacing it.
   * The update was created because some providers on a REMOVE event would execute a delete on the server.
   * @param {!IDataDescriptor} oldDescriptor The old descriptor
   * @param {!os.data.IDataDescriptor} newDescriptor The new descriptor
   */
  updateDescriptor(oldDescriptor, newDescriptor) {}

  /**
   * Adds a data descriptor
   * @param {!IDataDescriptor} descriptor The descriptor
   */
  addDescriptor(descriptor) {}

  /**
   * Removes a data descriptor
   * @param {!IDataDescriptor} descriptor The descriptor
   */
  removeDescriptor(descriptor) {}

  /**
   * Gets a data descriptor
   * @param {string} id The descriptor ID to get
   * @return {?IDataDescriptor} The descriptor or <code>null</code> if none was found
   */
  getDescriptor(id) {}

  /**
   * Gets all data descriptors whose IDs start with the opt_prefix, or all data descriptors if undefined.
   * @param {string=} opt_prefix
   * @return {!Array<!IDataDescriptor>} The descriptors which matched
   */
  getDescriptors(opt_prefix) {}

  /**
   * Gets the data provider root node
   * @return {!os.structs.ITreeNode} The root node
   */
  getProviderRoot() {}

  /**
   * Updates the data manager and providers from settings
   * @param {Settings} settings the settings
   */
  updateFromSettings(settings) {}

  /**
   * Adds a data provider
   * @param {!IDataProvider} dp The provider
   */
  addProvider(dp) {}

  /**
   * Removes a data provider
   * @param {!string} id
   */
  removeProvider(id) {}

  /**
   * Removes a data provider
   * @param {!string} id
   * @param {boolean} enabled
   */
  setProviderEnabled(id, enabled) {}

  /**
   * Get a provider by id
   * @param {string} id The provider id
   * @param {?string=} opt_url The provider url
   * @return {?IDataProvider}
   */
  getProvider(id, opt_url) {}

  /**
   * Get a provider by label
   * @param {string} label The provider label
   * @return {?IDataProvider}
   */
  getProviderByLabel(label) {}

  /**
   * Persist the descriptors
   */
  persistDescriptors() {}

  /**
   * Restore the descriptors
   */
  restoreDescriptors() {}

  /**
   * Gets the localStorage descriptor key for the datamanager to persist descriptors to.
   * @return {!string}
   */
  getDescriptorKey() {}

  /**
   * Gets a source by id.
   * @param {string} id
   * @return {VectorSource}
   */
  getSource(id) {}

  /**
   * Gets the sources.
   * @return {!Array<!VectorSource>}
   */
  getSources() {}

  /**
   * Gets the total count of all the features currently loaded.
   * @return {number}
   */
  getTotalFeatureCount() {}

  /**
   * Adds a source to the data manager if it doesn't already exist.
   * @param {VectorSource} source The source to add
   * @return {boolean} If the source was added
   */
  addSource(source) {}

  /**
   * Removes a source from the data manager if it exists.
   * @param {VectorSource} source The source to remove
   * @return {boolean} If the source was added
   */
  removeSource(source) {}

  /**
   * If time filters should be enabled on sources.
   * @return {boolean}
   */
  getTimeFilterEnabled() {}

  /**
   * Updates time filter usage on sources.
   * @param {boolean} value
   */
  setTimeFilterEnabled(value) {}
}
