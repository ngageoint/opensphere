goog.provide('os.mixin.vectortilesource');
goog.require('ol.source.VectorTile');


/**
 * @inheritDoc
 */
ol.source.VectorTile.prototype.refresh = function() {
  this.clear();
  this.changed();
};
