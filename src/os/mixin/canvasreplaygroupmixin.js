goog.declareModuleId('os.mixin.canvasreplaygroup');

import {getWidth} from 'ol/src/extent';
import ReplayGroup from 'ol/src/render/canvas/ExecutorGroup';

import * as osMap from '../map/map.js';

// const Feature = goog.requireTyped('ol.Feature');
// const RenderFeature = goog.requireTyped('ol.render.Feature');


const oldForEachFeatureAtCoordinate = ReplayGroup.prototype.forEachFeatureAtCoordinate;

/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
 * @param {function((Feature|RenderFeature)): T} callback Feature callback.
 * @param {Object<string, ol.DeclutterGroup>} declutterReplays Declutter replays.
 * @return {T|undefined} Callback result.
 * @template T
 */
ReplayGroup.prototype.forEachFeatureAtCoordinate = function(coordinate, resolution, rotation,
    hitTolerance, skippedFeaturesHash, callback, declutterReplays) {
  var val = oldForEachFeatureAtCoordinate.call(this, coordinate, resolution, rotation, hitTolerance,
      skippedFeaturesHash, callback, declutterReplays);

  var proj = osMap.PROJECTION;
  if (!val && proj.canWrapX()) {
    var width = getWidth(proj.getExtent());

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
