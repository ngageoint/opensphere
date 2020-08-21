goog.provide('os.ui.draw.DrawEvent');
goog.provide('os.ui.draw.DrawEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.ui.draw.DrawEventType = {
  DRAWSTART: 'drawstart',
  DRAWCHANGE: 'drawchange',
  DRAWEND: 'drawend',
  DRAWCANCEL: 'drawcancel',
  DRAWBOX: 'box',
  DRAWCIRCLE: 'circle',
  DRAWPOLYGON: 'polygon',
  DRAWLINE: 'line'
};



/**
 * @param {string} type
 * @param {ol.Coordinate=} opt_coordinate Mouse coordinate of the draw event.
 * @param {ol.geom.Geometry=} opt_geometry Geometry of the draw event, if available.
 * @param {ol.Pixel=} opt_pixel The last pixel from the draw
 * @param {Object<string, *>=} opt_properties The properties associated with the geometry
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.draw.DrawEvent = function(type, opt_coordinate, opt_geometry, opt_pixel, opt_properties) {
  os.ui.draw.DrawEvent.base(this, 'constructor', type);

  /**
   * The coordinate of the draw event.
   * @const
   * @type {?ol.Coordinate}
   */
  this.coordinate = opt_coordinate || null;

  /**
   * The geometry of the draw event.
   * @const
   * @type {?ol.geom.Geometry}
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
};
goog.inherits(os.ui.draw.DrawEvent, goog.events.Event);


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|ol.events.EventTarget|undefined}
 * @suppress {duplicate}
 */
os.ui.draw.DrawEvent.prototype.target;
