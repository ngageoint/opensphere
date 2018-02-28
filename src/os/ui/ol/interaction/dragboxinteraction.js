goog.provide('os.ui.ol.interaction.DragBox');
goog.require('ol.MapBrowserEvent');
goog.require('os.geo');
goog.require('os.olm.render.Box');
goog.require('os.ui.ol.interaction.AbstractDrag');



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
   * @private
   */
  this.box2D_ = new os.olm.render.Box(/** @type {ol.style.Style} */ (this.getStyle()));

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
os.ui.ol.interaction.DragBox.prototype.getGeometry = function() {
  var geom = this.box2D_.getOriginalGeometry();

  if (geom) {
    geom.toLonLat();
    os.geo.normalizeGeometryCoordinates(geom);
    geom.osTransform();
  }

  return geom;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.getProperties = function() {
  var props = {};
  props[os.interpolate.METHOD_FIELD] = os.interpolate.Method.RHUMB;
  return props;
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.begin = function(mapBrowserEvent) {
  os.ui.ol.interaction.DragBox.base(this, 'begin', mapBrowserEvent);
  this.box2D_.setMap(mapBrowserEvent.map);
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

    var start = ol.proj.toLonLat(this.startCoord, this.getMap().getView().getProjection());
    var end = ol.proj.toLonLat(this.endCoord, this.getMap().getView().getProjection());

    if (start && end) {
      this.extent[0] = os.geo.normalizeLongitude(Math.min(start[0], end[0]), start[0] - 180, start[0] + 180);
      this.extent[1] = Math.min(start[1], end[1]);
      this.extent[2] = os.geo.normalizeLongitude(Math.max(start[0], end[0]), start[0] - 180, start[0] + 180);
      this.extent[3] = Math.max(start[1], end[1]);

      this.update2D(this.startCoord, this.endCoord);
    }
  }
};


/**
 * Updates the 2D version
 * @param {ol.Coordinate} start
 * @param {ol.Coordinate} end
 * @protected
 */
os.ui.ol.interaction.DragBox.prototype.update2D = function(start, end) {
  if (start && end && this.extent) {
    this.box2D_.setLonLatExtent(this.extent);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.cleanup = function() {
  os.ui.ol.interaction.DragBox.base(this, 'cleanup');
  this.endCoord = null;

  if (this.box2D_) {
    this.box2D_.setMap(null);
  }
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.getResultString = function() {
  return this.extent ? this.extent.toString() : 'none';
};
