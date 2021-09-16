goog.module('os.data.IDataDescriptor');

const Listenable = goog.requireType('goog.events.Listenable');
const IPersistable = goog.requireType('os.IPersistable');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * @extends {IPersistable}
 * @extends {Listenable}
 * @interface
 */
class IDataDescriptor {
  /**
   * Gets the ID of the descriptor
   * @return {!string} The ID
   */
  getId() {}

  /**
   * Sets the ID of the descriptor
   * @param {!string} value The ID
   */
  setId(value) {}

  /**
   * Gets the aliases for the descriptor. This is useful for having a single descriptor
   * provide multiple layers. The alias list should always include the descriptor's ID and
   * the IDs of any layers that it provides should those layer IDs differ from the descriptor's
   * ID
   * @return {!Array<!string>}
   */
  getAliases() {}

  /**
   * Gets the descriptor type
   * @return {string} The descriptor type. e.g. 'kml'
   */
  getDescriptorType() {}

  /**
   * Gets the provider of the descriptor
   * @return {?string} The provider
   */
  getProvider() {}

  /**
   * @return {?os.data.IDataProvider}
   */
  getDataProvider() {}

  /**
   * @param {?os.data.IDataProvider} value
   */
  setDataProvider(value) {}

  /**
   * Sets the provider of the descriptor
   * @param {?string} value The provider
   */
  setProvider(value) {}

  /**
   * Gets the provider type of the descriptor
   * @return {?string} The provider type
   */
  getProviderType() {}

  /**
   * Sets the provider type of the descriptor
   * @param {?string} value The provider type
   */
  setProviderType(value) {}

  /**
   * Gets the title of the descriptor
   * @return {?string} The title
   */
  getTitle() {}

  /**
   * Sets the title of the descriptor
   * @param {?string} title
   */
  setTitle(title) {}

  /**
   * Get the explicit title
   * @return {?string}
   */
  getExplicitTitle() {}

  /**
   * Set the explicit title
   * @param {?string} value
   */
  setExplicitTitle(value) {}

  /**
   * Gets the search type of the descriptor
   * @return {?string} The search type
   */
  getSearchType() {}

  /**
   * Gets the type of the descriptor
   * @return {?string} The type
   */
  getType() {}

  /**
   * Gets the color of the descriptor
   * @return {?string} The color
   */
  getColor() {}

  /**
   * Gets the column definitions of the descriptor
   * @return {?Array<ColumnDefinition>} The columns
   */
  getColumns() {}

  /**
   * Sets the column definitions of the descriptor
   * @param {?Array<ColumnDefinition>} value The column definitions
   */
  setColumns(value) {}

  /**
   * Gets the description of the descriptor
   * @return {?string} The description
   */
  getDescription() {}

  /**
   * Sets the description of the descriptor
   * @param {?string} description
   */
  setDescription(description) {}

  /**
   * Gets the icon HTML
   * @return {?string} The icon HTML
   */
  getIcons() {}

  /**
   * The maximum date for which the data source is applicable. Should be
   * NaN if the source does not support time.
   * @return {number} The maximum date
   */
  getMaxDate() {}

  /**
   * The minimum date for which the data source is applicable. Should be
   * NaN if the source does not support time.
   * @return {number} The minimum date
   */
  getMinDate() {}

  /**
   * The time after which the descriptor should be deleted. Use NaN to
   * keep the descriptor around indefinitely.
   * @return {number} The deletion time
   */
  getDeleteTime() {}

  /**
   * The last time that the descriptor was activated
   * @return {number}
   */
  getLastActive() {}

  /**
   * Whether or not the descriptor is active
   * @return {boolean}
   */
  isActive() {}

  /**
   * Activates or deactivates the descriptor
   * @param {boolean} value If the descriptor should be active
   */
  setActive(value) {}

  /**
   * Clear locally stored data associated with the descriptor.
   */
  clearData() {}

  /**
   * Whether or not the entry is local to the application. Local descriptors will not be cleaned up based on activity.
   * @return {boolean}
   */
  isLocal() {}

  /**
   * Set whether or not the entry is local to the application.
   * @param {boolean} value
   */
  setLocal(value) {}

  /**
   * Whether or not the entry is loading
   * @return {boolean} <code>true</code> if currently loading, <code>false</code> otherwise
   */
  isLoading() {}

  /**
   * Gets the tags associated with this descriptor
   * @return {?Array<!string>} The tags
   */
  getTags() {}

  /**
   * Sets the tags associated with this descriptor
   * @param {?Array<!string>} tags
   */
  setTags(tags) {}

  /**
   * Gets the text to use for searching
   * @return {string} The search text
   */
  getSearchText() {}

  /**
   * Gets the node UI for this descriptor
   * @return {string} The node UI HTML
   */
  getNodeUI() {}

  /**
   * Whether or not this descriptor is using the given URL
   * @param {string} url The url
   * @return {boolean} If the descriptor is using the URL, false otherwise
   */
  matchesURL(url) {}

  /**
   * Build a HTML representation of the descriptor.
   *
   * @return {string} the HTML formatted message
   */
  getHtmlDescription() {}
}


/**
 * ID for {@see os.implements}
 * @const {string}
 */
IDataDescriptor.ID = 'os.data.IDataDescriptor';


exports = IDataDescriptor;
