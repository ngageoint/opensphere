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
goog.require('os.MapEvent');
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
 * Clean up the WebGL renderer.
 */
os.interaction.DrawPolygon.prototype.cleanupWebGL = goog.nullFunction;


/**
 * Update the polygon in the WebGL renderer.
 */
os.interaction.DrawPolygon.prototype.updateWebGL = goog.nullFunction;


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
