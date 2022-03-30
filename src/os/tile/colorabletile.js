goog.declareModuleId('os.tile.ColorableTile');

import ImageTile from 'ol/src/ImageTile.js';
import {filterImage} from './tile.js';

/**
 * Implementation of a tile that is colorable.
 */
export default class ColorableTile extends ImageTile {
  /**
   * Constructor.
   * @param {ol.TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
   */
  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction);

    /**
     * The filtered copy of the tile canvas.
     * @type {HTMLCanvasElement}
     * @private
     */
    this.filtered_ = null;

    /**
     * The source to which the tile belongs. Used to get the set of filter functions.
     * @type {TileImage}
     * @private
     */
    this.olSource_ = null;
  }

  /**
   * Get the image element for this tile.
   *
   * @inheritDoc
   * @suppress {accessControls}
   */
  getImage() {
    if (this.image_ && this.image_.width && this.image_.height) {
      var filterFns = this.olSource_.getTileFilters();
      if (filterFns.length > 0) {
        if (!this.filtered_) {
          // create a cached copy of the filtered image
          this.filtered_ = filterImage(this.image_, filterFns);
        }

        return this.filtered_;
      }
    }

    return this.image_;
  }

  /**
   * Resets the cached tile. Allows the filters to be reapplied on the next render call.
   */
  reset() {
    this.filtered_ = null;
  }

  /**
   * Get the OL source.
   *
   * @return {TileImage}
   */
  getOLSource() {
    return this.olSource_;
  }

  /**
   * Set the OL source.
   *
   * @param {TileImage} value
   */
  setOLSource(value) {
    this.olSource_ = value;
  }
}
