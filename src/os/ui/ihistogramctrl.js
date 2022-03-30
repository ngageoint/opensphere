goog.declareModuleId('os.ui.IHistogramUI');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: ColorBin} = goog.requireType('os.data.histo.ColorBin');
const {default: SourceHistogram} = goog.requireType('os.data.histo.SourceHistogram');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * A UI driven by a {@link SourceHistogram}.
 *
 * @interface
 */
export default class IHistogramUI {
  /**
   * Create an XML filter from the histogram.
   * @param {boolean=} opt_allowAll If all bins should be used in absence of a cascade/selection.
   * @return {?string} The filter, an empty string if there is no data to filter, or null if creation failed.
   */
  createXmlFilter(opt_allowAll) {}

  /**
   * Get the selected column.
   * @return {ColumnDefinition|null|undefined}
   */
  getColumn() {}

  /**
   * Get the histogram for this component.
   * @return {SourceHistogram|undefined} The histogram
   */
  getHistogram() {}

  /**
   * Get the parent histogram component.
   * @return {IHistogramUI|undefined} The parent histogram component.
   */
  getParent() {}

  /**
   * Get the source for this component.
   * @return {VectorSource} The source
   */
  getSource() {}

  /**
   * If the histogram is being cascaded to another.
   * @return {boolean}
   */
  isCascaded() {}

  /**
   * If the histogram is being cascaded to another.
   * @return {boolean}
   */
  hasCascadedBins() {}

  /**
   * If the histogram has bins.
   * @return {boolean}
   */
  hasBins() {}

  /**
   * Get all histogram bins.
   * @return {!Array<!ColorBin>}
   */
  getBins() {}

  /**
   * If the histogram has selected bins.
   * @return {boolean}
   */
  hasSelectedBins() {}

  /**
   * Get the selected histogram bins.
   * @return {!Array<!ColorBin>}
   */
  getSelectedBins() {}

  /**
   * Get all items in the selected bins.
   * @return {!Array<!Feature>} The source
   */
  getSelectedItems() {}

  /**
   * Get the unselected histogram bins.
   * @return {!Array<!ColorBin>}
   */
  getUnselectedBins() {}

  /**
   * Get all items in the unselected bins.
   * @return {!Array<!Feature>}
   */
  getUnselectedItems() {}

  /**
   * Check if the bin method is a date method. Date methods won't be used for filters because it will interfere with
   * the application date control.
   * @return {boolean}
   */
  isDateMethod() {}
}
