goog.declareModuleId('os.mixin.polygon');

const Polygon = goog.require('ol.geom.Polygon');

const LinearRing = goog.requireType('ol.geom.LinearRing');


const old = Polygon.prototype.getLinearRings;

/**
 * Assigns polygon metadata values to each ring.
 * @return {Array<LinearRing>}
 * @suppress {accessControls}
 */
Polygon.prototype.getLinearRings = function() {
  var rings = old.call(this);

  for (var i = 0, n = rings.length; i < n; i++) {
    Object.assign(rings[i].values_, this.values_);
  }

  return rings;
};
