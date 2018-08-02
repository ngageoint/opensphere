goog.provide('os.data.IDataDescriptor');

goog.require('goog.events.Listenable');
goog.require('os.IPersistable');



/**
 * @extends {os.IPersistable}
 * @extends {goog.events.Listenable}
 * @interface
 */
os.data.IDataDescriptor = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.data.IDataDescriptor.ID = 'os.data.IDataDescriptor';


/**
 * Gets the ID of the descriptor
 * @return {!string} The ID
 */
os.data.IDataDescriptor.prototype.getId;


/**
 * Sets the ID of the descriptor
 * @param {!string} value The ID
 */
os.data.IDataDescriptor.prototype.setId;


/**
 * Gets the aliases for the descriptor. This is useful for having a single descriptor
 * provide multiple layers. The alias list should always include the descriptor's ID and
 * the IDs of any layers that it provides should those layer IDs differ from the descriptor's
 * ID
 * @return {!Array.<!string>}
 */
os.data.IDataDescriptor.prototype.getAliases;


/**
 * Gets the descriptor type
 * @return {string} The descriptor type. e.g. 'kml'
 */
os.data.IDataDescriptor.prototype.getDescriptorType;


/**
 * Gets the provider of the descriptor
 * @return {?string} The provider
 */
os.data.IDataDescriptor.prototype.getProvider;


/**
 * @return {?os.data.IDataProvider}
 */
os.data.IDataDescriptor.prototype.getDataProvider;


/**
 * @param {?os.data.IDataProvider} value
 */
os.data.IDataDescriptor.prototype.setDataProvider;


/**
 * Sets the provider of the descriptor
 * @param {?string} value The provider
 */
os.data.IDataDescriptor.prototype.setProvider;


/**
 * Gets the provider type of the descriptor
 * @return {?string} The provider type
 */
os.data.IDataDescriptor.prototype.getProviderType;


/**
 * Sets the provider type of the descriptor
 * @param {?string} value The provider type
 */
os.data.IDataDescriptor.prototype.setProviderType;


/**
 * Gets the title of the descriptor
 * @return {?string} The title
 */
os.data.IDataDescriptor.prototype.getTitle;


/**
 * Sets the title of the descriptor
 * @param {?string} title
 */
os.data.IDataDescriptor.prototype.setTitle;


/**
 * Get the explicit title
 * @return {?string}
 */
os.data.IDataDescriptor.prototype.getExplicitTitle;


/**
 * Set the explicit title
 * @param {?string} value
 */
os.data.IDataDescriptor.prototype.setExplicitTitle;


/**
 * Gets the search type of the descriptor
 * @return {?string} The search type
 */
os.data.IDataDescriptor.prototype.getSearchType;


/**
 * Gets the type of the descriptor
 * @return {?string} The type
 */
os.data.IDataDescriptor.prototype.getType;


/**
 * Gets the color of the descriptor
 * @return {?string} The color
 */
os.data.IDataDescriptor.prototype.getColor;


/**
 * Gets the column definitions of the descriptor
 * @return {?Array.<os.data.ColumnDefinition>} The columns
 */
os.data.IDataDescriptor.prototype.getColumns;


/**
 * Gets the description of the descriptor
 * @return {?string} The description
 */
os.data.IDataDescriptor.prototype.getDescription;


/**
 * Sets the description of the descriptor
 * @param {?string} description
 */
os.data.IDataDescriptor.prototype.setDescription;


/**
 * Gets the icon HTML
 * @return {?string} The icon HTML
 */
os.data.IDataDescriptor.prototype.getIcons;


/**
 * The maximum date for which the data source is applicable. Should be
 * NaN if the source does not support time.
 * @return {number} The maximum date
 */
os.data.IDataDescriptor.prototype.getMaxDate;


/**
 * The minimum date for which the data source is applicable. Should be
 * NaN if the source does not support time.
 * @return {number} The minimum date
 */
os.data.IDataDescriptor.prototype.getMinDate;


/**
 * The time after which the descriptor should be deleted. Use NaN to
 * keep the descriptor around indefinitely.
 * @return {number} The deletion time
 */
os.data.IDataDescriptor.prototype.getDeleteTime;


/**
 * The last time that the descriptor was activated
 * @return {number}
 */
os.data.IDataDescriptor.prototype.getLastActive;


/**
 * Whether or not the descriptor is active
 * @return {boolean}
 */
os.data.IDataDescriptor.prototype.isActive;


/**
 * Activates or deactivates the descriptor
 * @param {boolean} value If the descriptor should be active
 */
os.data.IDataDescriptor.prototype.setActive;


/**
 * Clear locally stored data associated with the descriptor.
 */
os.data.IDataDescriptor.prototype.clearData;


/**
 * Whether or not the entry is local to the application. Local descriptors will not be cleaned up based on activity.
 * @return {boolean}
 */
os.data.IDataDescriptor.prototype.isLocal;


/**
 * Set whether or not the entry is local to the application.
 * @param {boolean} value
 */
os.data.IDataDescriptor.prototype.setLocal;


/**
 * Whether or not the entry is loading
 * @return {boolean} <code>true</code> if currently loading, <code>false</code> otherwise
 */
os.data.IDataDescriptor.prototype.isLoading;


/**
 * Gets the tags associated with this descriptor
 * @return {?Array.<!string>} The tags
 */
os.data.IDataDescriptor.prototype.getTags;


/**
 * Sets the tags associated with this descriptor
 * @param {?Array.<!string>} tags
 */
os.data.IDataDescriptor.prototype.setTags;


/**
 * Gets the text to use for searching
 * @return {string} The search text
 */
os.data.IDataDescriptor.prototype.getSearchText;


/**
 * Gets the node UI for this descriptor
 * @return {string} The node UI HTML
 */
os.data.IDataDescriptor.prototype.getNodeUI;


/**
 * Whether or not this descriptor is using the given URL
 * @param {string} url The url
 * @return {boolean} If the descriptor is using the URL, false otherwise
 */
os.data.IDataDescriptor.prototype.matchesURL;

/**
 * Build a HTML representation of the descriptor.
 *
 * @return {string} the HTML formatted message
 */
os.data.IDataDescriptor.prototype.getHtmlDescription;
