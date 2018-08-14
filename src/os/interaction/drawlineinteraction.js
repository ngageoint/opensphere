goog.provide('os.interaction.DrawLine');

goog.require('ol');
goog.require('ol.MapBrowserEventType');
goog.require('ol.coordinate');
goog.require('ol.geom.LineString');
goog.require('os.geo');
goog.require('os.interaction.DrawPolygon');


/**
 * @typedef {{
 *   pixel: ol.Pixel,
 *   time: number
 * }}
 */
os.interaction.DrawLineClick;



/**
 * Interaction to draw a line on the map/globe.
 * @param {olx.interaction.PointerOptions=} opt_options
 * @extends {os.interaction.DrawPolygon}
 * @constructor
 */
os.interaction.DrawLine = function(opt_options) {
  os.interaction.DrawLine.base(this, 'constructor');
  this.handleEvent = os.interaction.DrawLine.handleEvent.bind(this);
  this.type = os.interaction.DrawLine.TYPE;

  /**
   * The time of the last down event.
   * @type {os.interaction.DrawLineClick|undefined}
   * @protected
   */
  this.lastDown = undefined;
};
goog.inherits(os.interaction.DrawLine, os.interaction.DrawPolygon);


/**
 * The draw control type.
 * @type {string}
 * @const
 */
os.interaction.DrawLine.TYPE = 'line';


/**
 * Maximum distance between clicks to finish drawing.
 * @type {number}
 * @const
 */
os.interaction.DrawLine.FINISH_DISTANCE = 5;


/**
 * Interval between mouse down events to finish drawing the line.
 *
 * The interval was determined by the double click timeout used by Openlayers.
 *
 * @type {number}
 * @const
 */
os.interaction.DrawLine.FINISH_INTERVAL = 250;


/**
 * @inheritDoc
 */
os.interaction.DrawLine.prototype.getGeometry = function() {
  var geom = null;

  this.coords.length = this.coords.length - 1;

  if (this.coords.length > 1) {
    geom = new ol.geom.LineString(this.coords);

    geom.toLonLat();
    os.geo.normalizeGeometryCoordinates(geom);
    geom.osTransform();
  }

  return geom;
};


/**
 * @inheritDoc
 */
os.interaction.DrawLine.prototype.shouldFinish = function(mapBrowserEvent) {
  if (this.coords.length > 2 && this.lastDown != null) {
    var lastPixel = this.lastDown.pixel;
    var currPixel = mapBrowserEvent.pixel;
    if (lastPixel && currPixel) {
      var distance = Math.sqrt(ol.coordinate.squaredDistance(currPixel, lastPixel));
      var duration = Date.now() - this.lastDown.time;
      return distance < os.interaction.DrawLine.FINISH_DISTANCE &&
          duration < os.interaction.DrawLine.FINISH_INTERVAL;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.interaction.DrawLine.prototype.update = function(mapBrowserEvent) {
  os.interaction.DrawLine.base(this, 'update', mapBrowserEvent);

  if (mapBrowserEvent.type === ol.MapBrowserEventType.POINTERDOWN) {
    this.lastDown = /** @type {os.interaction.DrawLineClick} */ ({
      time: Date.now(),
      pixel: mapBrowserEvent.pixel.slice()
    });
  }
};


/**
 * Handles map browser events while the control is active.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.DrawLine
 */
os.interaction.DrawLine.handleEvent = function(mapBrowserEvent) {
  // squelch double click events when active
  if (mapBrowserEvent.type === ol.MapBrowserEventType.DBLCLICK) {
    return false;
  }

  return ol.interaction.Pointer.handleEvent.call(this, mapBrowserEvent);
};
