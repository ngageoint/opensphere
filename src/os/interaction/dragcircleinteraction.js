goog.provide('os.interaction.DragCircle');

goog.require('goog.string');
goog.require('ol');
goog.require('os.I3DSupport');
goog.require('os.geo');
goog.require('os.map');
goog.require('os.olcs');
goog.require('os.ui.ol.interaction.DragCircle');



/**
 * Draws a circular query area on the map.
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {os.ui.ol.interaction.DragCircle}
 */
os.interaction.DragCircle = function() {
  os.interaction.DragCircle.base(this, 'constructor');
  this.style3D_ = new Cesium.ColorGeometryInstanceAttribute(0, 1, 1, 1);
  this.circle2D.setUnits(os.unit.UnitManager.getInstance().getSelectedSystem());

  /**
   * @private
   * @type {Cesium.Primitive}
   */
  this.circle3D_ = null;

  /**
   * @private
   * @type {Cesium.LabelCollection}
   */
  this.labels3D_ = null;

  /**
   * @private
   * @type {Cesium.Label}
   */
  this.label3D_ = null;
};
goog.inherits(os.interaction.DragCircle, os.ui.ol.interaction.DragCircle);


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.update2D = function(start, end) {
  if (start && end) {
    this.circle2D.setCoordinates(start, end);
    this.circle2D.setUnits(os.unit.UnitManager.getInstance().getSelectedSystem());
  }

  this.update3D(start, end);
};


/**
 * Updates the 3D version
 * @param {ol.Coordinate} start
 * @param {ol.Coordinate} end
 * @protected
 */
os.interaction.DragCircle.prototype.update3D = function(start, end) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();

    start = ol.proj.toLonLat(start, this.getMap().getView().getProjection());
    end = ol.proj.toLonLat(end, this.getMap().getView().getProjection());

    if (start && end && this.distance) {
      var scene = olCesium.getCesiumScene();

      if (!this.labels3D_) {
        this.labels3D_ = new Cesium.LabelCollection();
        scene.primitives.add(this.labels3D_);
      }

      if (!this.label3D_) {
        this.label3D_ = this.labels3D_.add();
        this.label3D_.show = false;
        this.label3D_.fillColor = Cesium.Color.YELLOW;
        this.label3D_.scale = 0.6;
      }

      if (this.circle3D_) {
        scene.primitives.remove(this.circle3D_);
      }

      var center = Cesium.Cartesian3.fromDegrees(start[0], start[1]);
      var appearance = new Cesium.PolylineColorAppearance();
      this.circle3D_ = new Cesium.Primitive({
        asynchronous: false,
        appearance: appearance,
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: os.olcs.generateCirclePositions(center, this.distance),
            vertexFormat: appearance.vertexFormat,
            width: 2
          }),
          attributes: {
            color: this.get3DStyle()
          }
        })
      });

      var um = os.unit.UnitManager.getInstance();
      this.label3D_.text = um.formatToBestFit('distance', this.distance, 'm', um.getBaseSystem(), 3);
      this.label3D_.position = center;
      this.label3D_.show = true;

      scene.primitives.add(this.circle3D_);
      os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
    }
  }
};


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.cleanup = function() {
  os.interaction.DragCircle.base(this, 'cleanup');

  // restore camera controls in 3D mode
  /** @type {os.Map} */ (this.getMap()).toggleMovement(true);

  var olCesium = os.MapContainer.getInstance().getOLCesium();
  if (olCesium) {
    var scene = olCesium.getCesiumScene();

    if (this.circle3D_) {
      scene.primitives.remove(this.circle3D_);
    }

    if (this.labels3D_) {
      scene.primitives.remove(this.labels3D_);
    }

    this.labels3D_ = null;
    this.label3D_ = null;
  }
};


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.is3DSupported = function() {
  return true;
};


/**
 * @return {Cesium.ColorGeometryInstanceAttribute}
 */
os.interaction.DragCircle.prototype.get3DStyle = function() {
  return this.style3D_;
};


/**
 * @param {Cesium.ColorGeometryInstanceAttribute} style
 */
os.interaction.DragCircle.prototype.set3DStyle = function(style) {
  this.style3D_ = style;
};


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.begin = function(mapBrowserEvent) {
  os.interaction.DragCircle.base(this, 'begin', mapBrowserEvent);
  var map = this.getMap();
  // stop camera controls in 3D mode
  /** @type {os.Map} */ (map).toggleMovement(false);
};
