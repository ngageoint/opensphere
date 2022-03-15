goog.declareModuleId('os.mixin.polygon');

import Polygon from 'ol/src/geom/Polygon';

// const LinearRing = goog.requireTyped('ol.geom.LinearRing');


const old = Polygon.prototype.getLinearRings;

/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * Assigns polygon metadata values to each ring.
   * @return {Array<LinearRing>}
   * @suppress {accessControls}
   */
  Polygon.prototype.getLinearRings = function() {
    var rings = old.call(this);

    for (var i = 0, n = rings.length; i < n; i++) {
      if (this.values_) {
        rings[i].setProperties(this.values_);
      }
    }

    return rings;
  };
};

init();
