/**
 * @fileoverview This mixin adds all of the basic logic needed for us to be able to apply arbitrary image filters to
 * tile layers. The source keeps around a set of filter functions that it runs on tiles as they load (or on the tile
 * cache when the filters change). It also adds the implements call for: {@see IFilterableTileSource}.
 *
 * @suppress {accessControls}
 */
goog.declareModuleId('os.mixin.TileImage');

import {remove} from 'ol/src/array.js';
import TileImage from 'ol/src/source/TileImage.js';

import osImplements from '../implements.js';
import IFilterableTileSource from '../source/ifilterabletilesource.js';
import ColorableTile from '../tile/colorabletile.js';

const {insert} = goog.require('goog.array');

const {default: TileClass} = goog.requireType('os.TileClass');
const {TileFilterFn} = goog.requireType('os.tile');


// Add to os.implements registry.
osImplements(TileImage, IFilterableTileSource.ID);


/**
 * Set of filters to run against tiles that are loaded by this source.
 * @type {Array<TileFilterFn>}
 * @protected
 */
TileImage.prototype.tileFilters = null;


/**
 * Adds a tile filter function to the source.
 * @param {TileFilterFn} fn
 */
TileImage.prototype.addTileFilter = function(fn) {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  insert(this.tileFilters, fn);
  this.applyTileFilters();
};


/**
 * Removes a tile filter function from the source.
 * @param {TileFilterFn} fn
 */
TileImage.prototype.removeTileFilter = function(fn) {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  remove(this.tileFilters, fn);
  this.applyTileFilters();
};


/**
 * Gets the set of tile filters.
 * @return {Array<TileFilterFn>}
 */
TileImage.prototype.getTileFilters = function() {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  return this.tileFilters;
};


/**
 * Resets the tile filter on every cached tile in the source. Then forces a rerender of the map to reapply the filters.
 */
TileImage.prototype.applyTileFilters = function() {
  var tiles = this.tileCache.getValues();
  for (var i = 0, ii = tiles.length; i < ii; i++) {
    var tile = tiles[i];
    if (tile instanceof ColorableTile) {
      tile.reset();
    }
  }
};


/**
 * Sets the tileClass.
 *
 * @param {!TileClass} clazz The tile class
 */
TileImage.prototype.setTileClass = function(clazz) {
  this.tileClass = clazz;
};


const origCreateTile = TileImage.prototype.createTile_;

/**
 * This is one of the only places where we can get reference to tiles as they are created. For the tile
 * coloring/filtering architecture to work, the tiles need to reference back to their respective sources, so this
 * override gives them that reference.
 *
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Projection} projection Projection.
 * @param {string} key The key set on the tile.
 * @return {!Tile} Tile.
 * @private
 * @suppress {duplicate}
 */
TileImage.prototype.createTile_ = function(z, x, y, pixelRatio, projection, key) {
  var tile = origCreateTile.call(this, z, x, y, pixelRatio, projection, key);

  if (tile instanceof ColorableTile) {
    tile.setOLSource(this);
  }

  return tile;
};
