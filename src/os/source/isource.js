goog.declareModuleId('os.source.ISource');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: TimeModel} = goog.requireType('os.time.xf.TimeModel');


/**
 * @interface
 * @extends {IPersistable}
 */
export default class ISource {
  /**
   * Adds a feature
   * @param {Feature} feature Feature
   */
  addFeature(feature) {}

  /**
   * Removes a feature
   * @param {Feature} feature Feature
   */
  removeFeature(feature) {}

  /**
   * Adds features
   * @param {Array<Feature>} features Features
   */
  addFeatures(features) {}

  /**
   * Remove all features from the source.
   */
  clear() {}

  /**
   * Refreshes the data source.
   */
  refresh() {}

  /**
   * If the source can be refreshed.
   * @return {boolean}
   */
  isRefreshEnabled() {}

  /**
   * Get the automatic refresh interval for the source.
   * @return {number}
   */
  getRefreshInterval() {}

  /**
   * Set the automatic refresh interval for the source.
   * @param {number} value The new refresh interval, in seconds.
   */
  setRefreshInterval(value) {}

  /**
   * Get the default color for the data source.
   * @return {string}
   */
  getColor() {}

  /**
   * Get a copy of the columns for the data source.
   * @return {!Array<!ColumnDefinition>}
   */
  getColumns() {}

  /**
   * Get the original array of columns for the data source.
   * @return {!Array<!ColumnDefinition>}
   */
  getColumnsArray() {}

  /**
   * Set the array of data grid columns for the data source.
   * @param {!Array<!(ColumnDefinition|string)>} columns The columns.
   */
  setColumns(columns) {}

  /**
   * Get the data source id.
   * @return {string}
   */
  getId() {}

  /**
   * Set the data source id.
   * @param {string} value
   */
  setId(value) {}

  /**
   * If the data source is enabled.
   * @return {boolean}
   */
  isEnabled() {}

  /**
   * Set the enabled state of the data source.
   * @param {boolean} value
   */
  setEnabled(value) {}

  /**
   * Get the loading state of the data source.
   * @return {boolean}
   */
  isLoading() {}

  /**
   * Set the loading state of the data source.
   * @param {boolean} value
   */
  setLoading(value) {}

  /**
   * Get whether this source is lockable.
   * @return {boolean}
   */
  isLockable() {}

  /**
   * Set whether this source is lockable.
   * @param {boolean} value
   */
  setLockable(value) {}

  /**
   * Get the locked state of the source.
   * @return {boolean}
   */
  isLocked() {}

  /**
   * Locks/unlocks the source from updating its displayed data.
   * @param {boolean} value
   */
  setLocked(value) {}

  /**
   * Get the full title of the data source.
   * @return {string}
   */
  getTitle() {}

  /**
   * Set the full title of the data source.
   * @param {string} value
   */
  setTitle(value) {}

  /**
   * Whether or not date/time indexing is to be used on the data source.
   * @return {boolean}
   */
  getTimeEnabled() {}

  /**
   * Gets the time model for the source if it is time enabled.
   * @return {?TimeModel}
   */
  getTimeModel() {}

  /**
   * Set whether or not date/time indexing is to be used on the data source.
   * @param {boolean} value
   */
  setTimeEnabled(value) {}

  /**
   * Whether or not time is editable.
   * @return {boolean}
   */
  isTimeEditEnabled() {}

  /**
   * Get visibility of the data source.
   * @return {boolean}
   */
  getVisible() {}

  /**
   * Set visibility of the data source.
   * @param {boolean} value
   */
  setVisible(value) {}

  /**
   * @param {function(this: T, Feature): S} f The callback
   * @param {T=} opt_this The object to use as `this` in `f`.
   * @return {S|undefined}
   * @template T,S
   */
  forEachFeature(f, opt_this) {}

  /**
   * Gets the features
   * @return {Array<Feature>} The features
   */
  getFeatures() {}

  /**
   * Gets the highlighted items, if any, on the source.
   * @return {Array<!Feature>}
   */
  getHighlightedItems() {}

  /**
   * Sets the highlighted items on the source.
   * @param {Array<!Feature>} items
   */
  setHighlightedItems(items) {}

  /**
   * Convenience method for displaying all features hidden by hideSelected() or hideUnselected().
   */
  displayAll() {}

  /**
   * Convenience method for hiding all features in the source.
   */
  hideAll() {}

  /**
   * Convenience method for hiding features.
   * @param {!Feature|Array<!Feature>} features
   */
  hideFeatures(features) {}

  /**
   * Convenience method for unhiding features.
   * @param {!Feature|Array<!Feature>} features
   */
  showFeatures(features) {}

  /**
   * Convenience method for hiding selected features.
   */
  hideSelected() {}

  /**
   * Convenience method for hiding unselected features.
   */
  hideUnselected() {}

  /**
   * Gets the hidden items
   * @return {!Array<!Feature>}
   */
  getHiddenItems() {}

  /**
   * Checks if a feature is hidden.
   * @param {string|Feature} feature
   * @return {boolean}
   */
  isHidden(feature) {}

  /**
   * Gets the unselected items
   * @return {!Array<!Feature>}
   */
  getUnselectedItems() {}

  /**
   * Checks if a feature is selected.
   * @param {string|Feature} feature
   * @return {boolean}
   */
  isSelected(feature) {}

  /**
   * Gets the current selection.
   * @return {!Array<!Feature>}
   */
  getSelectedItems() {}

  /**
   * Sets the current selection.
   * @param {!Feature|Array<!Feature>} items
   */
  setSelectedItems(items) {}

  /**
   * Select a feature in the source.
   * @param {!Feature|Array<!Feature>} features
   */
  addToSelected(features) {}

  /**
   * Select a feature in the source.
   * @param {!Feature|Array<!Feature>} features
   */
  removeFromSelected(features) {}

  /**
   * Convenience method for selecting all items.
   */
  selectAll() {}

  /**
   * Convenience method for clearing the selection.
   */
  selectNone() {}
}

/**
 * ID for {@see osImplements}
 * @const {string}
 */
ISource.ID = 'os.source.ISource';
