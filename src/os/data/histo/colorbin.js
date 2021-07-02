goog.module('os.data.histo.ColorBin');
goog.module.declareLegacyNamespace();

const osColor = goog.require('os.color');
const Bin = goog.require('os.histo.Bin');


/**
 * Histogram bin that tracks the colors of items in the bin.
 *
 * @extends {Bin<T>}
 * @template S,T
 * @unrestricted
 */
class ColorBin extends Bin {
  /**
   * Constructor.
   * @param {string} baseColor The base color of the layer represented by this bin
   */
  constructor(baseColor) {
    super();

    /**
     * The base color for the bin. Stored as hex so color comparisons can be done without considering opacity.
     * @type {string}
     * @private
     */
    this.baseColor_ = osColor.toHexString(baseColor);

    /**
     * Number of items in the bin with a given color.
     * @type {Object<string, number>}
     * @private
     */
    this.colorCounts_ = {};

    /**
     * Function to access the color from an item in the color bin
     * @type {?function(this:S, T):(string|undefined)}
     * @private
     */
    this.colorFunction = null;

    /**
     * If the bin is being cascaded to other histograms.
     * @type {boolean}
     */
    this.isCascaded = false;

    /**
     * The bin's color; accessible for export
     * @type {boolean}
     */
    this['color'] = false;
  }

  /**
   * Get the color of this bin.
   *
   * @return {string}
   */
  getColor() {
    for (var key in this.colorCounts_) {
      if (this.colorCounts_[key] == this.items.length) {
        // this color represents all of the data
        return key;
      } else {
        // there are multiple colors
        return '';
      }
    }

    // there aren't any custom colors
    return this.baseColor_;
  }

  /**
   * Get the color counts for this bin.
   *
   * @return {Object<string, number>}
   */
  getColorCounts() {
    return this.colorCounts_;
  }

  /**
   * Get the filter function used by the model.
   *
   * @return {?function(this:S, T):(string|undefined)}
   * @template T,S
   */
  getColorFunction() {
    return this.colorFunction;
  }

  /**
   * Set the filter function used by the model.
   *
   * @param {?function(this:S, T):(string|undefined)} fn
   * @template T,S
   */
  setColorFunction(fn) {
    this.colorFunction = fn;
  }

  /**
   * @inheritDoc
   */
  addItem(item) {
    super.addItem(item);
    this.incrementColor(this.colorFunction(item));
  }

  /**
   * @inheritDoc
   */
  removeItem(item) {
    super.removeItem(item);
    this.decrementColor(this.colorFunction(item));
  }

  /**
   * Decrement the count for a color.
   *
   * @param {string|undefined} color The color
   */
  decrementColor(color) {
    // disregard opacity - only interested in tracking the color
    color = color ? osColor.toHexString(color) : this.baseColor_;

    if (color && color in this.colorCounts_) {
      this.colorCounts_[color]--;

      if (this.colorCounts_[color] == 0) {
        delete this.colorCounts_[color];
      }
    }
  }

  /**
   * Increment the count for a color.
   *
   * @param {string|undefined} color The color
   */
  incrementColor(color) {
    // disregard opacity - only interested in tracking the color
    color = color ? osColor.toHexString(color) : this.baseColor_;

    if (color) {
      if (color in this.colorCounts_) {
        this.colorCounts_[color]++;
      } else {
        this.colorCounts_[color] = 1;
      }
    }
  }
}

exports = ColorBin;
