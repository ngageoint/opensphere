goog.declareModuleId('os.interaction.DragCircle');

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import OLDragCircle from '../ui/ol/interaction/dragcircleinteraction.js';

const {default: OSMap} = goog.requireType('os.Map');


/**
 * Draws a circular query area on the map.
 * This interaction is only supported for mouse devices.
 *
 * @implements {I3DSupport}
 */
export default class DragCircle extends OLDragCircle {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  update2D(start, end) {
    if (start && end) {
      this.circle2D.setCoordinates(start, end);
    }

    this.updateWebGL(start, end);
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    // restore camera controls in 3D mode
    var map = /** @type {OSMap} */ (this.getMap());
    if (map) {
      map.toggleMovement(true);
    }

    this.cleanupWebGL();
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    super.begin(mapBrowserEvent);
    var map = this.getMap();
    // stop camera controls in 3D mode
    /** @type {OSMap} */ (map).toggleMovement(false);
  }

  /**
   * Clean up the WebGL renderer.
   */
  cleanupWebGL() {}

  /**
   * Update the circle in the WebGL renderer.
   * @param {ol.Coordinate} start The start coordinate.
   * @param {ol.Coordinate} end The end coordinate.
   */
  updateWebGL(start, end) {}
}

osImplements(DragCircle, I3DSupport.ID);
