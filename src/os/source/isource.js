goog.provide('os.source.ISource');
goog.require('os.IPersistable');
goog.require('os.implements');
goog.require('os.time.xf.TimeModel');



/**
 * @interface
 * @extends {os.IPersistable}
 */
os.source.ISource = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.source.ISource.ID = 'os.source.ISource';


/**
 * Adds a feature
 * @param {ol.Feature} feature Feature
 */
os.source.ISource.prototype.addFeature;


/**
 * Removes a feature
 * @param {ol.Feature} feature Feature
 */
os.source.ISource.prototype.removeFeature;


/**
 * Adds features
 * @param {Array<ol.Feature>} features Features
 */
os.source.ISource.prototype.addFeatures;


/**
 * Remove all features from the source.
 */
os.source.ISource.prototype.clear;


/**
 * Refreshes the data source.
 */
os.source.ISource.prototype.refresh;


/**
 * If the source can be refreshed.
 * @return {boolean}
 */
os.source.ISource.prototype.isRefreshEnabled;


/**
 * Get the automatic refresh interval for the source.
 * @return {number}
 */
os.source.ISource.prototype.getRefreshInterval;


/**
 * Set the automatic refresh interval for the source.
 * @param {number} value The new refresh interval, in seconds.
 */
os.source.ISource.prototype.setRefreshInterval;


/**
 * Get the default color for the data source.
 * @return {string}
 */
os.source.ISource.prototype.getColor;


/**
 * Get the array of data grid columns for the data source.
 * @return {!Array<!os.data.ColumnDefinition>}
 */
os.source.ISource.prototype.getColumns;


/**
 * Set the array of data grid columns for the data source.
 * @param {!Array<!(os.data.ColumnDefinition|string)>} columns The columns.
 */
os.source.ISource.prototype.setColumns;


/**
 * Get the data source id.
 * @return {string}
 */
os.source.ISource.prototype.getId;


/**
 * Set the data source id.
 * @param {string} value
 */
os.source.ISource.prototype.setId;


/**
 * Get the loading state of the data source.
 * @return {boolean}
 */
os.source.ISource.prototype.isLoading;


/**
 * Set the loading state of the data source.
 * @param {boolean} value
 */
os.source.ISource.prototype.setLoading;


/**
 * Get whether this source is lockable.
 * @return {boolean}
 */
os.source.ISource.prototype.isLockable;


/**
 * Set whether this source is lockable.
 * @param {boolean} value
 */
os.source.ISource.prototype.setLockable;


/**
 * Get the locked state of the source.
 * @return {boolean}
 */
os.source.ISource.prototype.isLocked;


/**
 * Locks/unlocks the source from updating its displayed data.
 * @param {boolean} value
 */
os.source.ISource.prototype.setLocked;


/**
 * Get the full title of the data source.
 * @return {string}
 */
os.source.ISource.prototype.getTitle;


/**
 * Set the full title of the data source.
 * @param {string} value
 */
os.source.ISource.prototype.setTitle;


/**
 * Whether or not date/time indexing is to be used on the data source.
 * @return {boolean}
 */
os.source.ISource.prototype.getTimeEnabled;


/**
 * Gets the time model for the source if it is time enabled.
 * @return {?os.time.xf.TimeModel}
 */
os.source.ISource.prototype.getTimeModel;


/**
 * Set whether or not date/time indexing is to be used on the data source.
 * @param {boolean} value
 */
os.source.ISource.prototype.setTimeEnabled;


/**
 * Get visibility of the data source.
 * @return {boolean}
 */
os.source.ISource.prototype.getVisible;


/**
 * Set visibility of the data source.
 * @param {boolean} value
 */
os.source.ISource.prototype.setVisible;


/**
 * @param {function(this: T, ol.Feature): S} f The callback
 * @param {T=} opt_this The object to use as `this` in `f`.
 * @return {S|undefined}
 * @template T,S
 */
os.source.ISource.prototype.forEachFeature;


/**
 * Gets the features
 * @return {Array<ol.Feature>} The features
 */
os.source.ISource.prototype.getFeatures;


/**
 * Gets the highlighted items, if any, on the source.
 * @return {Array<!ol.Feature>}
 */
os.source.ISource.prototype.getHighlightedItems;


/**
 * Sets the highlighted items on the source.
 * @param {Array<!ol.Feature>} items
 */
os.source.ISource.prototype.setHighlightedItems;


/**
 * Convenience method for displaying all features hidden by hideSelected() or hideUnselected().
 */
os.source.ISource.prototype.displayAll;


/**
 * Convenience method for hiding all features in the source.
 */
os.source.ISource.prototype.hideAll;


/**
 * Convenience method for hiding features.
 * @param {!ol.Feature|Array<!ol.Feature>} features
 */
os.source.ISource.prototype.hideFeatures;


/**
 * Convenience method for unhiding features.
 * @param {!ol.Feature|Array<!ol.Feature>} features
 */
os.source.ISource.prototype.showFeatures;


/**
 * Convenience method for hiding selected features.
 */
os.source.ISource.prototype.hideSelected;


/**
 * Convenience method for hiding unselected features.
 */
os.source.ISource.prototype.hideUnselected;


/**
 * Gets the hidden items
 * @return {!Array<!ol.Feature>}
 */
os.source.ISource.prototype.getHiddenItems;


/**
 * Checks if a feature is hidden.
 * @param {string|ol.Feature} feature
 * @return {boolean}
 */
os.source.ISource.prototype.isHidden;


/**
 * Gets the unselected items
 * @return {!Array<!ol.Feature>}
 */
os.source.ISource.prototype.getUnselectedItems;


/**
 * Checks if a feature is selected.
 * @param {string|ol.Feature} feature
 * @return {boolean}
 */
os.source.ISource.prototype.isSelected;


/**
 * Gets the current selection.
 * @return {!Array<!ol.Feature>}
 */
os.source.ISource.prototype.getSelectedItems;


/**
 * Sets the current selection.
 * @param {!ol.Feature|Array<!ol.Feature>} items
 */
os.source.ISource.prototype.setSelectedItems;


/**
 * Select a feature in the source.
 * @param {!ol.Feature|Array<!ol.Feature>} features
 */
os.source.ISource.prototype.addToSelected;


/**
 * Select a feature in the source.
 * @param {!ol.Feature|Array<!ol.Feature>} features
 */
os.source.ISource.prototype.removeFromSelected;


/**
 * Convenience method for selecting all items.
 */
os.source.ISource.prototype.selectAll;


/**
 * Convenience method for clearing the selection.
 */
os.source.ISource.prototype.selectNone;
