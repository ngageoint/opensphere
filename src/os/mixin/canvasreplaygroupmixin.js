goog.provide('os.mixin.canvasreplaygroup');

goog.require('ol.extent');
goog.require('ol.render.canvas.ReplayGroup');

(function() {
  var oldForEachFeatureAtCoordinate = ol.render.canvas.ReplayGroup.prototype.forEachFeatureAtCoordinate;

  /**
   * @param {ol.Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {number} rotation Rotation.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
   *     to skip.
   * @param {function((ol.Feature|ol.render.Feature)): T} callback Feature
   *     callback.
   * @param {Object.<string, ol.DeclutterGroup>} declutterReplays Declutter
   *     replays.
   * @return {T|undefined} Callback result.
   * @template T
   */
  ol.render.canvas.ReplayGroup.prototype.forEachFeatureAtCoordinate = function(coordinate, resolution, rotation,
      hitTolerance, skippedFeaturesHash, callback, declutterReplays) {
    var val = oldForEachFeatureAtCoordinate.call(this, coordinate, resolution, rotation, hitTolerance,
        skippedFeaturesHash, callback, declutterReplays);

    var proj = os.map.PROJECTION;
    if (!val && proj.canWrapX()) {
      var width = ol.extent.getWidth(proj.getExtent());

      // check one world left
      coordinate[0] -= width;
      val = oldForEachFeatureAtCoordinate.call(this, coordinate, resolution, rotation, hitTolerance,
          skippedFeaturesHash, callback, declutterReplays);
      // Put. Ze candle. BACK!
      coordinate[0] += width;

      if (!val) {
        // check one world right
        coordinate[0] += width;
        val = oldForEachFeatureAtCoordinate.call(this, coordinate, resolution, rotation, hitTolerance,
            skippedFeaturesHash, callback, declutterReplays);
        // Put. Ze candle. BACK!
        coordinate[0] -= width;
      }
    }

    return val;
  };
})();
