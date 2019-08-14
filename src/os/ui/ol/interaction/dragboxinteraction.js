goog.provide('os.ui.ol.interaction.DragBox');
goog.require('ol.MapBrowserEvent');
goog.require('os.data.RecordField');
goog.require('os.geo2');
goog.require('os.olm.render.Box');
goog.require('os.proj');
goog.require('os.ui.ol.interaction.AbstractDrag');
goog.require('os.webgl');



/**
 * Draws a rectangluar query area on the map.
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {os.ui.ol.interaction.AbstractDrag}
 * @param {olx.interaction.PointerOptions=} opt_options
 */
os.ui.ol.interaction.DragBox = function(opt_options) {
  os.ui.ol.interaction.DragBox.base(this, 'constructor', opt_options);
  this.type = os.ui.ol.interaction.DragBox.TYPE;

  /**
   * @type {ol.Coordinate}
   * @protected
   */
  this.endCoord = null;

  /**
   * @type {!os.olm.render.Box}
   * @protected
   */
  this.box2D = new os.olm.render.Box(/** @type {ol.style.Style} */ (this.getStyle()));

  /**
   * This is the box extent in lon/lat
   * @type {ol.Extent}
   * @protected
   */
  this.extent = null;
};
goog.inherits(os.ui.ol.interaction.DragBox, os.ui.ol.interaction.AbstractDrag);


/**
 * @type {string}
 * @const
 */
os.ui.ol.interaction.DragBox.TYPE = 'box';


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.disposeInternal = function() {
  this.cleanup();

  os.ui.ol.interaction.DragBox.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.getGeometry = function() {
  var geom = this.box2D.getOriginalGeometry();

  if (geom) {
    os.geo2.normalizeGeometryCoordinates(geom);
  }

  return geom;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.getProperties = function() {
  var props = {};
  props[os.interpolate.METHOD_FIELD] = os.interpolate.Method.RHUMB;
  props[os.data.RecordField.ALTITUDE_MODE] = os.webgl.AltitudeMode.CLAMP_TO_GROUND;
  return props;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.begin = function(mapBrowserEvent) {
  os.ui.ol.interaction.DragBox.base(this, 'begin', mapBrowserEvent);
  this.box2D.setMap(mapBrowserEvent.map);
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.update = function(mapBrowserEvent) {
  this.endCoord = mapBrowserEvent.coordinate || this.endCoord;

  if (this.startCoord && this.endCoord) {
    if (!this.extent) {
      this.extent = [];
    }

    if (this.startCoord && this.endCoord) {
      var proj = this.getMap().getView().getProjection();
      var start = ol.proj.toLonLat(this.startCoord, proj);
      var end = ol.proj.toLonLat(this.endCoord, proj);

      this.extent[0] = os.geo2.normalizeLongitude(Math.min(start[0], end[0]),
          start[0] - 180, start[0] + 180, os.proj.EPSG4326);
      this.extent[1] = Math.min(start[1], end[1]);
      this.extent[2] = os.geo2.normalizeLongitude(Math.max(start[0], end[0]),
          start[0] - 180, start[0] + 180, os.proj.EPSG4326);
      this.extent[3] = Math.max(start[1], end[1]);

      this.extent = os.extent.normalize(this.extent, undefined, undefined, undefined, this.extent);

      this.update2D(this.startCoord, this.endCoord);
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
os.ui.ol.interaction.DragBox.prototype.update2D = function(start, end) {
  if (start && end && this.extent) {
    this.box2D.setLonLatExtent(this.extent);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.cleanup = function() {
  os.ui.ol.interaction.DragBox.base(this, 'cleanup');
  this.endCoord = null;

  if (this.box2D) {
    this.box2D.setMap(null);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.getResultString = function() {
  return this.extent ? this.extent.toString() : 'none';
};
