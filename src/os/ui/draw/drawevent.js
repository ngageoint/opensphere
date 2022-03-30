goog.declareModuleId('os.ui.draw.DrawEvent');

const GoogEvent = goog.require('goog.events.Event');

/**
 */
export default class DrawEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {ol.Coordinate=} opt_coordinate Mouse coordinate of the draw event.
   * @param {Geometry=} opt_geometry Geometry of the draw event, if available.
   * @param {ol.Pixel=} opt_pixel The last pixel from the draw
   * @param {Object<string, *>=} opt_properties The properties associated with the geometry
   */
  constructor(type, opt_coordinate, opt_geometry, opt_pixel, opt_properties) {
    super(type);

    /**
     * The coordinate of the draw event.
     * @const
     * @type {?ol.Coordinate}
     */
    this.coordinate = opt_coordinate || null;

    /**
     * The geometry of the draw event.
     * @const
     * @type {Geometry}
     */
    this.geometry = opt_geometry || null;

    /**
     * The last pixel of the draw event.
     * @const
     * @type {?ol.Pixel}
     */
    this.pixel = opt_pixel || null;


    /**
     * The properties associated with the geometry
     * @const
     * @type {?Object<string, *>}
     */
    this.properties = opt_properties || null;
  }
}

/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|OLEventTarget|undefined}
 * @suppress {duplicate}
 */
DrawEvent.prototype.target;
