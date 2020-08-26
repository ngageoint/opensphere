/**
 * @fileoverview ol.source.Tile#refresh clears the tile cache but does not reset sourceTiles_. This mixin fixes that by
 *               calling the clear function, which does both.
 */
goog.module('os.mixin.vectortilesource');

const VectorTileSource = goog.require('ol.source.VectorTile');


/**
 * @inheritDoc
 */
VectorTileSource.prototype.refresh = function() {
  this.clear();
  this.changed();
};
