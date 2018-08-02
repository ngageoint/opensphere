goog.provide('os.tile.ColorableTile');

goog.require('ol.ImageTile');
goog.require('ol.TileState');
goog.require('ol.dom');



/**
 * Implementation of a tile that is colorable.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @extends {ol.ImageTile}
 * @constructor
 */
os.tile.ColorableTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
  ol.ImageTile.call(this, tileCoord, state, src, crossOrigin, tileLoadFunction);

  /**
   * The filtered copy of the tile canvas.
   * @type {HTMLCanvasElement}
   * @private
   */
  this.filtered_ = null;

  /**
   * The source to which the tile belongs. Used to get the set of filter functions.
   * @type {ol.source.TileImage}
   * @private
   */
  this.olSource_ = null;
};
ol.inherits(os.tile.ColorableTile, ol.ImageTile);


/**
 * Get the image element for this tile.
 * @inheritDoc
 * @suppress {accessControls}
 */
os.tile.ColorableTile.prototype.getImage = function() {
  if (this.image_ && this.image_.width && this.image_.height) {
    var filterFns = this.olSource_.getTileFilters();
    if (filterFns.length > 0) {
      if (!this.filtered_) {
        // create a cached copy of the filtered image
        this.filtered_ = os.tile.filterImage(this.image_, filterFns);
      }

      return this.filtered_;
    }
  }

  return this.image_;
};


/**
 * Resets the cached tile. Allows the filters to be reapplied on the next render call.
 */
os.tile.ColorableTile.prototype.reset = function() {
  this.filtered_ = null;
};


/**
 * Get the OL source.
 * @return {ol.source.TileImage}
 */
os.tile.ColorableTile.prototype.getOLSource = function() {
  return this.olSource_;
};


/**
 * Set the OL source.
 * @param {ol.source.TileImage} value
 */
os.tile.ColorableTile.prototype.setOLSource = function(value) {
  this.olSource_ = value;
};
