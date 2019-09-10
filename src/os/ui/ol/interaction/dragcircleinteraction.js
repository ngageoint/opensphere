goog.provide('os.ui.ol.interaction.DragCircle');

goog.require('goog.string');
goog.require('ol');
goog.require('os.data.RecordField');
goog.require('os.geo2');
goog.require('os.math.Units');
goog.require('os.olm.render.Circle');
goog.require('os.ui.ol.interaction.AbstractDrag');
goog.require('os.webgl');



/**
 * Draws a circular query area on the map.
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {os.ui.ol.interaction.AbstractDrag}
 */
os.ui.ol.interaction.DragCircle = function() {
  os.ui.ol.interaction.DragCircle.base(this, 'constructor');
  this.type = os.ui.ol.interaction.DragCircle.TYPE;

  /**
   * @type {!os.olm.render.Circle}
   * @protected
   */
  this.circle2D = new os.olm.render.Circle(this.getStyle(), os.math.Units.KILOMETERS);

  /**
   * @type {?ol.Coordinate}
   * @protected
   */
  this.center = null;

  /**
   * @type {number}
   * @protected
   */
  this.distance = -1;
};
goog.inherits(os.ui.ol.interaction.DragCircle, os.ui.ol.interaction.AbstractDrag);


/**
 * @type {string}
 * @const
 */
os.ui.ol.interaction.DragCircle.TYPE = 'circle';


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.disposeInternal = function() {
  this.cleanup();

  os.ui.ol.interaction.DragCircle.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.getGeometry = function() {
  var geom = this.circle2D.getOriginalGeometry();

  if (geom) {
    geom = os.geo.jsts.splitPolarPolygon(geom);
    os.geo2.normalizeGeometryCoordinates(geom);
    os.interpolate.interpolateGeom(geom);
  }

  return geom;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.getProperties = function() {
  var props = {};
  props[os.interpolate.METHOD_FIELD] = os.interpolate.getMethod();
  props[os.data.RecordField.ALTITUDE_MODE] = os.webgl.AltitudeMode.CLAMP_TO_GROUND;
  return props;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.begin = function(mapBrowserEvent) {
  os.ui.ol.interaction.DragCircle.base(this, 'begin', mapBrowserEvent);
  this.circle2D.setMap(mapBrowserEvent.map);
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.update = function(mapBrowserEvent) {
  var endCoord = mapBrowserEvent.coordinate;

  if (this.startCoord) {
    this.center = this.startCoord;

    if (endCoord) {
      var start = ol.proj.toLonLat(this.startCoord, this.getMap().getView().getProjection());
      var end = ol.proj.toLonLat(endCoord, this.getMap().getView().getProjection());

      this.distance = osasm.geodesicInverse(start, end).distance;
      this.update2D(this.startCoord, endCoord);
    }
  }
};


/**
 * Updates the 2D version
 *
 * @param {ol.Coordinate} start
 * @param {ol.Coordinate} end
 * @protected
 */
os.ui.ol.interaction.DragCircle.prototype.update2D = function(start, end) {
  if (start && end) {
    this.circle2D.setCoordinates(start, end);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.cleanup = function() {
  os.ui.ol.interaction.DragCircle.base(this, 'cleanup');

  this.center = null;
  this.distance = -1;

  if (this.circle2D) {
    this.circle2D.setMap(null);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragCircle.prototype.getResultString = function() {
  var str = '';

  if (this.startCoord) {
    str += this.startCoord[0] + 'E ';
    str += this.startCoord[1] + 'N ';
  }

  if (this.distance) {
    str += this.distance + 'm';
  }

  return str;
};
