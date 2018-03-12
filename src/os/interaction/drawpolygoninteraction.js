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
goog.require('os.geo');
goog.require('os.interpolate');
goog.require('os.map');
goog.require('os.ui.ol.draw.DrawEvent');
goog.require('os.ui.ol.interaction.DrawPolygon');



/**
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {os.ui.ol.interaction.DrawPolygon}
 */
os.interaction.DrawPolygon = function() {
  os.interaction.DrawPolygon.base(this, 'constructor');

  /**
   * The box color.
   * @type {!ol.Color}
   * @protected
   */
  this.color = [51, 255, 255, 1];

  /**
   * @type {Cesium.PolylineCollection|undefined}
   * @private
   */
  this.lines3D_ = undefined;

  /**
   * The Cesium style.
   * @type {Cesium.ColorGeometryInstanceAttribute|undefined}
   * @private
   */
  this.style3D_ = undefined;
};
goog.inherits(os.interaction.DrawPolygon, os.ui.ol.interaction.DrawPolygon);


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.update2D = function() {
  os.interaction.DrawPolygon.base(this, 'update2D');
  this.update3D();
};


/**
 * @param {ol.Coordinate} coord The coordinate
 * @return {ol.Coordinate} The lon/lat
 */
os.interaction.DrawPolygon.coordToLonLat = function(coord) {
  return ol.proj.toLonLat(coord, os.map.PROJECTION);
};


/**
 * Updates the 3D version
 * @protected
 */
os.interaction.DrawPolygon.prototype.update3D = function() {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();

    var coords = /** @type {ol.geom.LineString} */ (this.line2D.getGeometry()).getCoordinates();
    var lonlats = coords.map(os.interaction.DrawPolygon.coordToLonLat);

    if (lonlats.length > 0) {
      var scene = olCesium.getCesiumScene();

      if (this.lines3D_) {
        this.lines3D_.removeAll();
      } else {
        this.lines3D_ = new Cesium.PolylineCollection();
        scene.primitives.add(this.lines3D_);
      }

      this.lines3D_.add({
        asynchronous: false,
        show: true,
        material: Cesium.Material.fromType(Cesium.Material.ColorType, {
          color: this.get3DColor()
        }),
        positions: Cesium.PolylinePipeline.generateCartesianArc({
          positions: olcs.core.ol4326CoordinateArrayToCsCartesians(lonlats)
        }),
        width: 2
      });

      os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
    }
  }
};


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.cleanup = function() {
  os.interaction.DrawPolygon.base(this, 'cleanup');

  // restore camera controls in 3D mode
  /** @type {os.Map} */ (this.getMap()).toggleMovement(true);

  var olCesium = os.MapContainer.getInstance().getOLCesium();
  if (olCesium) {
    var scene = olCesium.getCesiumScene();

    if (this.lines3D_) {
      scene.primitives.remove(this.lines3D_);
      this.lines3D_ = null;
    }
  }
};


/**
 * Gets the color for the 3D view lines.
 * @return {Cesium.Color}
 */
os.interaction.DrawPolygon.prototype.get3DColor = function() {
  return Cesium.Color.CYAN;
};


/**
 * @inheritDoc
 */
os.interaction.DrawPolygon.prototype.is3DSupported = function() {
  return true;
};


/**
 * @return {!Cesium.ColorGeometryInstanceAttribute}
 */
os.interaction.DrawPolygon.prototype.get3DStyle = function() {
  if (!this.style3D_) {
    // Openlayers color values are from 0-255, Cesium range is 0-1
    this.style3D_ = new Cesium.ColorGeometryInstanceAttribute(
        this.color[0] / 255,
        this.color[1] / 255,
        this.color[2] / 255,
        this.color[3]);
  }

  return this.style3D_;
};


/**
 * @param {Cesium.ColorGeometryInstanceAttribute|undefined} style
 */
os.interaction.DrawPolygon.prototype.set3DStyle = function(style) {
  this.style3D_ = style;
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
