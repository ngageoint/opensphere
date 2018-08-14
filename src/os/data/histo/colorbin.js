goog.provide('os.data.histo.ColorBin');

goog.require('goog.array');
goog.require('goog.events');
goog.require('os.data.RecordField');
goog.require('os.histo.Bin');
goog.require('os.style');



/**
 * Histogram bin that tracks the colors of features in the bin.
 * @param {string} baseColor The base color of the layer represented by this bin
 * @extends {os.histo.Bin<!ol.Feature>}
 * @constructor
 */
os.data.histo.ColorBin = function(baseColor) {
  os.data.histo.ColorBin.base(this, 'constructor');

  /**
   * The base color for the bin. Stored as hex so color comparisons can be done without considering opacity.
   * @type {string}
   * @private
   */
  this.baseColor_ = os.color.toHexString(baseColor);

  /**
   * Number of features in the bin with a given color.
   * @type {Object<string, number>}
   * @private
   */
  this.colorCounts_ = {};

  /**
   * If the bin is being cascaded to other histograms.
   * @type {boolean}
   */
  this.isCascaded = false;
};
goog.inherits(os.data.histo.ColorBin, os.histo.Bin);


/**
 * Get the color of this bin.
 * @return {string}
 */
os.data.histo.ColorBin.prototype.getColor = function() {
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
};


/**
 * Get the color counts for this bin.
 * @return {Object<string, number>}
 */
os.data.histo.ColorBin.prototype.getColorCounts = function() {
  return this.colorCounts_;
};


/**
 * @inheritDoc
 */
os.data.histo.ColorBin.prototype.addItem = function(item) {
  os.data.histo.ColorBin.base(this, 'addItem', item);
  this.incrementColor(this.getItemColor(item));
};


/**
 * @inheritDoc
 */
os.data.histo.ColorBin.prototype.removeItem = function(item) {
  os.data.histo.ColorBin.base(this, 'removeItem', item);
  this.decrementColor(this.getItemColor(item));
};


/**
 * Get the color of an item.
 * @param {!ol.Feature} item The item.
 * @return {string|undefined} The item color, or null if no custom color is defined.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.data.histo.ColorBin.prototype.getItemColor = function(item) {
  // check if the feature has a color override
  var color = /** @type {string|undefined} */ (os.feature.getColor(item));
  return color || undefined;
};


/**
 * Increment the count for a color.
 * @param {string|undefined} color The color
 */
os.data.histo.ColorBin.prototype.decrementColor = function(color) {
  // disregard opacity - only interested in tracking the color
  color = color ? os.color.toHexString(color) : this.baseColor_;

  if (color && color in this.colorCounts_) {
    this.colorCounts_[color]--;

    if (this.colorCounts_[color] == 0) {
      delete this.colorCounts_[color];
    }
  }
};


/**
 * Increment the count for a color.
 * @param {string|undefined} color The color
 */
os.data.histo.ColorBin.prototype.incrementColor = function(color) {
  // disregard opacity - only interested in tracking the color
  color = color ? os.color.toHexString(color) : this.baseColor_;

  if (color) {
    if (color in this.colorCounts_) {
      this.colorCounts_[color]++;
    } else {
      this.colorCounts_[color] = 1;
    }
  }
};
