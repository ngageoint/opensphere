goog.provide('os.interaction.DragBox');

goog.require('ol.MapBrowserEvent');
goog.require('os.I3DSupport');
goog.require('os.geo');
goog.require('os.map');
goog.require('os.olcs');
goog.require('os.ui.ol.interaction.DragBox');



/**
 * Draws a rectangluar query area on the map.
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {os.ui.ol.interaction.DragBox}
 * @param {olx.interaction.PointerOptions=} opt_options
 */
os.interaction.DragBox = function(opt_options) {
  os.interaction.DragBox.base(this, 'constructor', opt_options);
  this.style3D_ = goog.isDef(opt_options) && goog.isDef(opt_options.style3d) ?
      opt_options.style3d : new Cesium.ColorGeometryInstanceAttribute(0, 1, 1, 1);

  /**
   * @private
   * @type {Cesium.Primitive}
   */
  this.box3D_ = null;
};
goog.inherits(os.interaction.DragBox, os.ui.ol.interaction.DragBox);


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.update2D = function(start, end) {
  os.interaction.DragBox.base(this, 'update2D', start, end);
  this.update3D(start, end);
};


/**
 * Updates the 3D version
 * @param {ol.Coordinate} start
 * @param {ol.Coordinate} end
 * @protected
 */
os.interaction.DragBox.prototype.update3D = function(start, end) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();

    start = ol.proj.toLonLat(start, this.getMap().getView().getProjection());
    end = ol.proj.toLonLat(end, this.getMap().getView().getProjection());

    if (start && end) {
      var scene = olCesium.getCesiumScene();

      if (this.box3D_) {
        scene.primitives.remove(this.box3D_);
      }
      var flip = Math.abs(os.geo.normalizeLongitude(this.extent[0]) - os.geo.normalizeLongitude(this.extent[2])) > 180;
      var appearance = new Cesium.PolylineColorAppearance();
      this.box3D_ = new Cesium.Primitive({
        asynchronous: false,
        geometryInstances: new Cesium.GeometryInstance({
          id: os.olcs.GeometryInstanceId.GEOM_OUTLINE,
          geometry: new Cesium.PolylineGeometry({
            positions: os.olcs.generateRectanglePositions(
                [this.extent[flip ? 2 : 0], this.extent[1], this.extent[flip ? 0 : 2], this.extent[3]]),
            vertexFormat: appearance.vertexFormat,
            width: 2
          }),
          attributes: {
            color: this.get3DStyle()
          }
        }),
        appearance: appearance
      });

      scene.primitives.add(this.box3D_);
      os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
    }
  }
};


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.cleanup = function() {
  os.interaction.DragBox.base(this, 'cleanup');

  // restore camera controls in 3D mode
  var map = /** @type {os.Map} */ (this.getMap());
  map.toggleMovement(true);

  if (this.box3D_) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();
    if (olCesium) {
      olCesium.getCesiumScene().primitives.remove(this.box3D_);
    }
  }
};


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.is3DSupported = function() {
  return true;
};


/**
 * @return {Cesium.ColorGeometryInstanceAttribute}
 */
os.interaction.DragBox.prototype.get3DStyle = function() {
  return this.style3D_;
};


/**
 * @param {Cesium.ColorGeometryInstanceAttribute} style
 */
os.interaction.DragBox.prototype.set3DStyle = function(style) {
  this.style3D_ = style;
};


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.begin = function(mapBrowserEvent) {
  os.interaction.DragBox.base(this, 'begin', mapBrowserEvent);
  var map = this.getMap();
  // stop camera controls in 3D mode
  /** @type {os.Map} */ (map).toggleMovement(false);
};
