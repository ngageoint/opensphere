goog.declareModuleId('os.mixin.polygon');

import Polygon from 'ol/src/geom/Polygon.js';

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

    if (this.values_) {
      for (var i = 0, n = rings.length; i < n; i++) {
        if (rings[i].values_ == null) {
          rings[i].values_ = {};
        }
        Object.assign(rings[i].values_, this.values_);
      }
    }

    return rings;
  };
};

init();
