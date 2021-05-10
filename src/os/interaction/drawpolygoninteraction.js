goog.provide('os.interaction.DrawPolygon');

goog.require('ol');
goog.require('ol.MapBrowserEvent');
goog.require('ol.ViewHint');
goog.require('ol.events.condition');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('os.I3DSupport');
goog.require('os.MapContainer');
goog.require('os.MapEvent');
goog.require('os.fn');
goog.require('os.geo');
goog.require('os.implements');
goog.require('os.interpolate');
goog.require('os.map');
goog.require('os.ui.draw.DrawEvent');
goog.require('os.ui.ol.interaction.DrawPolygon');



/**
 * Interaction to draw a polygon on the map.
 *
 * @extends {os.ui.ol.interaction.DrawPolygon}
 * @implements {os.I3DSupport}
 * @constructor
 */
os.interaction.DrawPolygon = function() {
  os.interaction.DrawPolygon.base(this, 'constructor');

  /**
   * The polygon color.
   * @type {!ol.Color}
   * @protected
   */
  this.color = [51, 255, 255, 1];
};
goog.inherits(os.interaction.DrawPolygon, os.ui.ol.interaction.DrawPolygon);
os.implements(os.interaction.DrawPolygon, os.I3DSupport.ID);

/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.update2D = function() {
  os.interaction.DrawPolygon.base(this, 'update2D');
  this.updateWebGL();
};


/**
 * @param {ol.Coordinate} coord The coordinate
 * @return {ol.Coordinate} The lon/lat
 */
os.interaction.DrawPolygon.coordToLonLat = function(coord) {
  return ol.proj.toLonLat(coord, os.map.PROJECTION);
};


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.cleanup = function() {
  os.interaction.DrawPolygon.base(this, 'cleanup');

  // restore camera controls in 3D mode
  var map = /** @type {os.Map} */ (this.getMap());
  if (map) {
    map.toggleMovement(true);
  }

  this.cleanupWebGL();
};


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.addCoord = function(coord, opt_mapBrowserEvent) {
  //
  // In 3D, coordinates will always fall within the world extent. When drawing across the antimeridian, we want to
  // wrap coordinates across the AM so the direction is clear. For example, clicking +175 then -175 should convert the
  // second coord to +185.
  //
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    var lastCoord = this.coords[this.coords.length - 1];
    if (coord && lastCoord) {
      var worldWidth = ol.extent.getWidth(os.map.PROJECTION.getExtent());
      var halfWorld = worldWidth / 2;
      var xDiff = coord[0] - lastCoord[0];
      if (xDiff > halfWorld) {
        // crossed antimeridian from right to left
        coord[0] -= worldWidth;
      } else if (xDiff < -halfWorld) {
        // crossed antimeridian from left to right
        coord[0] += worldWidth;
      }
    }
  }

  os.interaction.DrawPolygon.base(this, 'addCoord', coord, opt_mapBrowserEvent);
};


/**
 * Clean up the WebGL renderer.
 */
os.interaction.DrawPolygon.prototype.cleanupWebGL = os.fn.noop;


/**
 * Update the polygon in the WebGL renderer.
 */
os.interaction.DrawPolygon.prototype.updateWebGL = os.fn.noop;


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.is3DSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.begin = function(mapBrowserEvent) {
  os.interaction.DrawPolygon.base(this, 'begin', mapBrowserEvent);
  var map = this.getMap();
  if (map && map.getView().getHints()[ol.ViewHint.INTERACTING] <= 0) {
    // stop camera controls in 3D mode
    /** @type {os.Map} */ (map).toggleMovement(false);
  }
};
