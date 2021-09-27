goog.module('os.interaction.DragBox');

const {asArray} = goog.require('ol.color');
const Stroke = goog.require('ol.style.Stroke');
const Style = goog.require('ol.style.Style');
const I3DSupport = goog.require('os.I3DSupport');
const osImplements = goog.require('os.implements');
const {default: OLDragBox} = goog.require('os.ui.ol.interaction.DragBox');

const Polygon = goog.requireType('ol.geom.Polygon');
const OSMap = goog.requireType('os.Map');


/**
 * Draws a rectangluar query area on the map. This interaction is only supported for mouse devices.
 *
 * @implements {I3DSupport}
 */
class DragBox extends OLDragBox {
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
   * Update the box in the WebGL renderer.
   * @param {Polygon} geometry The geometry to update to.
   */
  updateWebGL(geometry) {}
}

osImplements(DragBox, I3DSupport.ID);


exports = DragBox;
