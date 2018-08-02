goog.provide('os.ui.ol.interaction.DrawPolygon');

goog.require('goog.events.BrowserEvent');
goog.require('ol');
goog.require('ol.MapBrowserEventType');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('os.geo');
goog.require('os.geo.jsts');
goog.require('os.ui.ol.draw.DrawEvent');
goog.require('os.ui.ol.interaction.AbstractDraw');



/**
 * @constructor
 * @extends {os.ui.ol.interaction.AbstractDraw}
 */
os.ui.ol.interaction.DrawPolygon = function() {
  os.ui.ol.interaction.DrawPolygon.base(this, 'constructor', {
    handleDownEvent: os.ui.ol.interaction.DrawPolygon.handleDownEvent_,
    handleMoveEvent: os.ui.ol.interaction.DrawPolygon.handleMoveEvent_,
    handleUpEvent: os.ui.ol.interaction.DrawPolygon.handleUpEvent_
  });
  this.type = os.ui.ol.interaction.DrawPolygon.TYPE;

  /**
   * @protected
   * @type {Array.<!ol.Coordinate>}
   */
  this.coords = [];

  /**
   * @protected
   * @type {ol.layer.Vector}
   */
  this.overlay2D = null;

  /**
   * @protected
   * @type {ol.Feature}
   */
  this.line2D = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.finish = false;
};
goog.inherits(os.ui.ol.interaction.DrawPolygon, os.ui.ol.interaction.AbstractDraw);


/**
 * @type {string}
 * @const
 */
os.ui.ol.interaction.DrawPolygon.TYPE = 'polygon';


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.getGeometry = function() {
  var geom = new ol.geom.Polygon([this.coords]);
  var method = os.interpolate.getMethod();
  geom.set(os.interpolate.METHOD_FIELD, method);
  geom.toLonLat();

  // normalize coordinates prior to validation, or polygons crossing the date line may be broken
  os.geo.normalizeGeometryCoordinates(geom);

  // then interpolate so the coordinates reflect what was drawn
  os.interpolate.beginTempInterpolation(os.proj.EPSG4326, method);
  os.interpolate.interpolateGeom(geom);
  os.interpolate.endTempInterpolation();

  // finally validate the geometry to ensure it's accepted in server queries
  geom = os.geo.jsts.validate(geom);

  geom.osTransform();
  return geom;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.getProperties = function() {
  var props = {};
  props[os.interpolate.METHOD_FIELD] = os.interpolate.getMethod();
  return props;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this os.ui.ol.interaction.DrawPolygon
 * @private
 */
os.ui.ol.interaction.DrawPolygon.handleMoveEvent_ = function(mapBrowserEvent) {
  if (this.drawing) {
    this.update(mapBrowserEvent);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean}
 * @this os.ui.ol.interaction.DrawPolygon
 * @private
 */
os.ui.ol.interaction.DrawPolygon.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.drawing && this.finish) {
    this.end(mapBrowserEvent);
  }

  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Must return true to get the up handler working
 * @this os.ui.ol.interaction.DrawPolygon
 * @private
 */
os.ui.ol.interaction.DrawPolygon.handleDownEvent_ = function(mapBrowserEvent) {
  var browserEvent = new goog.events.BrowserEvent(mapBrowserEvent.originalEvent);
  if (browserEvent.isMouseActionButton() && (this.drawing || this.condition(mapBrowserEvent))) {
    if (!this.drawing) {
      this.begin(mapBrowserEvent);
    }

    if (this.shouldFinish(mapBrowserEvent)) {
      this.saveLast(mapBrowserEvent);
      this.finish = true;
    } else {
      this.update(mapBrowserEvent);
    }

    return true;
  }

  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @protected
 */
os.ui.ol.interaction.DrawPolygon.prototype.saveLast = function(mapBrowserEvent) {
  this.coords[this.coords.length - 1] = this.coords[0];
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Whether or not we should finish drawing
 * @protected
 */
os.ui.ol.interaction.DrawPolygon.prototype.shouldFinish = function(mapBrowserEvent) {
  if (this.coords.length > 3) {
    var start = this.getMap().getPixelFromCoordinate(this.coords[0]);
    var px = mapBrowserEvent.pixel;

    if (start && px) {
      return Math.abs(px[0] - start[0]) < 7 && Math.abs(px[1] - start[1]) < 7;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.begin = function(mapBrowserEvent) {
  this.finish = false;
  os.ui.ol.interaction.DrawPolygon.base(this, 'begin', mapBrowserEvent);
  os.interpolate.updateTransforms();
  this.coords.length = 0;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.update = function(mapBrowserEvent) {
  this.addCoord(mapBrowserEvent.coordinate, mapBrowserEvent);
};


/**
 * @param {ol.Coordinate} coord
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.DrawPolygon.prototype.addCoord = function(coord, mapBrowserEvent) {
  if (coord) {
    if (mapBrowserEvent.type === ol.MapBrowserEventType.POINTERDOWN) {
      this.coords.push(coord);

      if (this.coords.length == 1) {
        this.coords.push(coord);
      }
    } else if (this.coords.length > 1) {
      this.coords[this.coords.length - 1] = coord;
    }

    this.beforeUpdate(mapBrowserEvent);

    if (this.coords.length > 1) {
      this.update2D();
    }
  }
};


/**
 * This is for extending classes
 * @param {ol.MapBrowserEvent} mapBrowserEvent
 * @protected
 */
os.ui.ol.interaction.DrawPolygon.prototype.beforeUpdate = function(mapBrowserEvent) {
};


/**
 * Updates the 2D version
 * @protected
 */
os.ui.ol.interaction.DrawPolygon.prototype.update2D = function() {
  this.createOverlay();
  this.overlay2D.setMap(this.getMap());

  if (!this.line2D) {
    this.line2D = new ol.Feature();
    this.line2D.setStyle(this.getStyle());
    this.line2D.set(os.interpolate.METHOD_FIELD, os.interpolate.getMethod());
    this.overlay2D.getSource().addFeature(this.line2D);
  }

  var geom = this.createGeometry();
  geom.toLonLat();
  os.geo.normalizeGeometryCoordinates(geom);
  geom.osTransform();

  this.line2D.setGeometry(geom);
  this.line2D.set(os.interpolate.ORIGINAL_GEOM_FIELD, undefined);
  this.line2D.setProperties(this.getProperties(), true);
  os.interpolate.interpolateFeature(this.line2D);
};


/**
 * Creates the 2D overlay if it doesn't exist already.
 */
os.ui.ol.interaction.DrawPolygon.prototype.createOverlay = function() {
  if (!this.overlay2D) {
    this.overlay2D = new ol.layer.Vector({
      map: this.getMap(),
      source: new ol.source.Vector({
        features: new ol.Collection(),
        useSpatialIndex: false
      }),
      style: this.getStyle(),
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });
  }
};


/**
 * @protected
 * @return {ol.geom.Geometry}
 */
os.ui.ol.interaction.DrawPolygon.prototype.createGeometry = function() {
  return new ol.geom.LineString(this.coords.slice());
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.cleanup = function() {
  os.ui.ol.interaction.DrawPolygon.base(this, 'cleanup');

  if (this.overlay2D) {
    this.overlay2D.getSource().getFeaturesCollection().clear();
    this.overlay2D.setMap(null);
    this.overlay2D.dispose();
    this.overlay2D = null;
  }

  if (this.line2D) {
    this.line2D = null;
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DrawPolygon.prototype.getResultString = function() {
  return this.coords.toString();
};
