goog.declareModuleId('os.interaction.DragBox');

import {asArray} from 'ol/src/color.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import OSMap from '../map.js';
import OLDragBox from '../ui/ol/interaction/dragboxinteraction.js';



/**
 * Draws a rectangluar query area on the map. This interaction is only supported for mouse devices.
 *
 * @implements {I3DSupport}
 */
export default class DragBox extends OLDragBox {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    var options = opt_options || {};
    var color = /** @type {ol.Color|string} */ (options.color) || 'rgba(0,255,255,1)';
    options.style = options.style || new Style({
      stroke: new Stroke({
        color: color,
        lineCap: 'square',
        width: 2
      })
    });

    super(options);

    /**
     * The box color.
     * @type {ol.Color}
     * @protected
     */
    this.color = asArray(color) || [0, 255, 255, 1];
  }

  /**
   * @inheritDoc
   */
  updateGeometry(geometry) {
    super.updateGeometry(geometry);

    if (geometry) {
      this.updateWebGL(geometry);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    // restore camera controls in 3D mode
    var map = /** @type {OSMap} */ (this.getMap());
    if (map instanceof OSMap) {
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

    if (map instanceof OSMap) {
      // stop camera controls in 3D mode
      /** @type {OSMap} */ (map).toggleMovement(false);
    }
  }

  /**
   * Clean up the WebGL renderer.
   */
  cleanupWebGL() {}

  /**
   * Update the box in the WebGL renderer.
   * @param {Polygon} geometry The geometry to update to.
   */
  updateWebGL(geometry) {}
}

osImplements(DragBox, I3DSupport.ID);
