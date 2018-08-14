goog.provide('os.ui.IHistogramUI');



/**
 * A UI driven by a {@link os.data.histo.SourceHistogram}.
 * @interface
 */
os.ui.IHistogramUI = function() {};


/**
 * Create an XML filter from the histogram.
 * @param {boolean=} opt_allowAll If all bins should be used in absence of a cascade/selection.
 * @return {?string} The filter, an empty string if there is no data to filter, or null if creation failed.
 */
os.ui.IHistogramUI.prototype.createXmlFilter;


/**
 * Get the selected column.
 * @return {os.data.ColumnDefinition|null|undefined}
 */
os.ui.IHistogramUI.prototype.getColumn;


/**
 * Get the histogram for this component.
 * @return {os.data.histo.SourceHistogram|undefined} The histogram
 */
os.ui.IHistogramUI.prototype.getHistogram;


/**
 * Get the parent histogram component.
 * @return {os.ui.IHistogramUI|undefined} The parent histogram component.
 */
os.ui.IHistogramUI.prototype.getParent;


/**
 * Get the source for this component.
 * @return {os.source.Vector} The source
 */
os.ui.IHistogramUI.prototype.getSource;


/**
 * If the histogram is being cascaded to another.
 * @return {boolean}
 */
os.ui.IHistogramUI.prototype.isCascaded;


/**
 * If the histogram is being cascaded to another.
 * @return {boolean}
 */
os.ui.IHistogramUI.prototype.hasCascadedBins;


/**
 * If the histogram has bins.
 * @return {boolean}
 */
os.ui.IHistogramUI.prototype.hasBins;


/**
 * Get all histogram bins.
 * @return {!Array<!os.data.histo.ColorBin>}
 */
os.ui.IHistogramUI.prototype.getBins;


/**
 * If the histogram has selected bins.
 * @return {boolean}
 */
os.ui.IHistogramUI.prototype.hasSelectedBins;


/**
 * Get the selected histogram bins.
 * @return {!Array<!os.data.histo.ColorBin>}
 */
os.ui.IHistogramUI.prototype.getSelectedBins;


/**
 * Get all items in the selected bins.
 * @return {!Array<!ol.Feature>} The source
 */
os.ui.IHistogramUI.prototype.getSelectedItems;


/**
 * Get the unselected histogram bins.
 * @return {!Array<!os.data.histo.ColorBin>}
 */
os.ui.IHistogramUI.prototype.getUnselectedBins;


/**
 * Get all items in the unselected bins.
 * @return {!Array<!ol.Feature>}
 */
os.ui.IHistogramUI.prototype.getUnselectedItems;


/**
 * Check if the bin method is a date method. Date methods won't be used for filters because it will interfere with
 * the application date control.
 * @return {boolean}
 */
os.ui.IHistogramUI.prototype.isDateMethod;
