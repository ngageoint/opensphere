goog.declareModuleId('os.mixin.ResolutionConstraint');

import {createSnapToPower} from 'ol/src/resolutionconstraint.js';


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
   * OL3 does not have a way to provide resolution constraints to a view. Rather than extending the
   * view and getting frustrated by the number of private functions that we can't override without
   * suppressions, we'll just override the constraint that the default view uses.
   *
   * The change here is to actually get rid of the "snap" part of "snapToPower". So rather than
   * snapping to whole increments of the zoom factor, it allows fractional deltas and computes from
   * that. This probably could have also been accomplished by setting the "zoomFactor" option on the
   * view and specifying drastically different minZoom/maxZoom values, but that would be unintuitive
   * to people configuring the application.
   *
   * @param {number} power Power.
   * @param {number} maxResolution Maximum resolution.
   * @param {number=} opt_maxLevel Maximum level.
   * @return {ol.ResolutionConstraintType} Zoom function.
   * @suppress {accessControls|duplicate}
   */
  createSnapToPower.prototype = function(power, maxResolution, opt_maxLevel) {
    return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @return {number|undefined} Resolution.
     */
      function(resolution, delta, direction) {
        if (resolution !== undefined) {
          var oldLevel = Math.log(maxResolution / resolution) / Math.log(power);

          // round to the nearest 1/10. odd fractions can cause blurry tiles, which is most likely to happen when
          // computing the 2D resolution from the 3D camera.
          var newLevel = Math.max(oldLevel + delta, 0).toFixed(1);
          if (opt_maxLevel !== undefined) {
            newLevel = Math.min(newLevel, opt_maxLevel);
          }
          return maxResolution / Math.pow(power, newLevel);
        } else {
          return undefined;
        }
      }
    );
  };
};

init();
