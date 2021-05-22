goog.provide('os.mixin.polygon');

goog.require('ol.geom.Polygon');
goog.requireType('ol.geom.LinearRing');


(function() {
  var old = ol.geom.Polygon.prototype.getLinearRings;

  /**
   * Assigns polygon metadata values to each ring.
   * @return {Array<ol.geom.LinearRing>}
   * @suppress {accessControls}
   */
  ol.geom.Polygon.prototype.getLinearRings = function() {
    var rings = old.call(this);

    for (var i = 0, n = rings.length; i < n; i++) {
      Object.assign(rings[i].values_, this.values_);
    }

    return rings;
  };
})();
