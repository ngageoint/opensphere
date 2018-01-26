/**
 * @fileoverview This mixin adds all of the basic logic needed for us to be able to apply arbitrary image filters to
 * tile layers. The source keeps around a set of filter functions that it runs on tiles as they load (or on the tile
 * cache when the filters change). It also adds the implements call for: {@see os.source.IFilterableTileSource}.
 *
 * @suppress {accessControls}
 */
goog.provide('os.mixin.TileImage');

goog.require('ol.TileState');
goog.require('ol.source.TileImage');
goog.require('os');
goog.require('os.source.IFilterableTileSource');
goog.require('os.tile');
goog.require('os.tile.ColorableTile');



/**
 * Redeclare this to say that it implements IFilterableTileSource...
 * @param {olx.source.TileImageOptions} options Image tile options.
 * @implements {os.source.IFilterableTileSource}
 * @extends {ol.source.UrlTile}
 * @constructor
 * @suppress {duplicate}
 */
ol.source.TileImage;
os.implements(ol.source.TileImage, os.source.IFilterableTileSource.ID);


/**
 * Set of filters to run against tiles that are loaded by this source.
 * @type {Array<os.tile.TileFilterFn>}
 * @protected
 */
ol.source.TileImage.prototype.tileFilters = null;


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.addTileFilter = function(fn) {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  goog.array.insert(this.tileFilters, fn);
  this.applyTileFilters();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.removeTileFilter = function(fn) {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  goog.array.remove(this.tileFilters, fn);
  this.applyTileFilters();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.getTileFilters = function() {
  if (!this.tileFilters) {
    this.tileFilters = [];
  }

  return this.tileFilters;
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.applyTileFilters = function() {
  var tiles = this.tileCache.getValues();
  for (var i = 0, ii = tiles.length; i < ii; i++) {
    var tile = tiles[i];
    if (tile instanceof os.tile.ColorableTile) {
      tile.reset();
    }
  }
};


/**
 * Sets the tileClass.
 * @param {function(new: ol.ImageTile, ol.TileCoord, ol.TileState, string, ?string, ol.TileLoadFunctionType)} clazz
 */
ol.source.TileImage.prototype.setTileClass = function(clazz) {
  this.tileClass = clazz;
};


(function() {
  var origCreateTile = ol.source.TileImage.prototype.createTile_;

  /**
   * This is one of the only places where we can get reference to tiles as they are created. For the tile
   * coloring/filtering architecture to work, the tiles need to reference back to their respective sources, so this
   * override gives them that reference.
   *
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {ol.proj.Projection} projection Projection.
   * @param {string} key The key set on the tile.
   * @return {!ol.Tile} Tile.
   * @private
   * @suppress {duplicate}
   */
  ol.source.TileImage.prototype.createTile_ = function(z, x, y, pixelRatio, projection, key) {
    var tile = origCreateTile.bind(this)(z, x, y, pixelRatio, projection, key);

    if (tile instanceof os.tile.ColorableTile) {
      tile.setOLSource(this);
    }

    return tile;
  };
})();
