goog.module('os.data.CountBin');

const ColorBin = goog.require('os.data.histo.ColorBin');


/**
 * Histogram bin that only manages a count.
 */
class CountBin extends ColorBin {
  /**
   * Constructor.
   * @param {string} baseColor The base color of the layer represented by this bin
   */
  constructor(baseColor) {
    super(baseColor);

    /**
     * @type {number}
     */
    this.count = 0;
  }

  /**
   * @inheritDoc
   */
  addItem(item) {
    this.count++;
  }

  /**
   * @inheritDoc
   */
  removeItem(item) {
    this.count--;
  }

  /**
   * @param {number} value
   */
  setCount(value) {
    this.count = value;
  }

  /**
   * @inheritDoc
   */
  getCount() {
    return this.count;
  }

  /**
   * @inheritDoc
   */
  clear() {
    this.items.length = 0;
    this.count = 0;
  }

  /**
   * @inheritDoc
   */
  getColorCounts() {
    var counts = {};
    counts[this.getColor()] = this.getCount();
    return counts;
  }
}

exports = CountBin;
