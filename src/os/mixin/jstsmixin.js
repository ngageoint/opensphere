goog.declareModuleId('os.mixin.jsts');

const {EPSILON} = goog.require('os.geo');

/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

export const init = () => {
  if (window['jsts'] && !initialized) {
    initialized = true;

    /**
     * JSTS operations like buffer sometimes introduce minor (less than 1E-12) floating point errors in polygon rings,
     * which causes JSTS to think those rings aren't closed. This override provides a threshold to the coordinate equality
     * function to account for these minor differences.
     *
     * @return {boolean} If the line string is closed.
     *
     * @suppress {duplicate}
     */
    jsts.geom.LineString.prototype.isClosed = function() {
      if (this.isEmpty()) {
        return false;
      }
      return this.getCoordinateN(0).equals2D(this.getCoordinateN(this.getNumPoints() - 1), EPSILON);
    };
  }
};
