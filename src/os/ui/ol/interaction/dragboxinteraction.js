goog.provide('os.ui.ol.interaction.DragBox');
goog.require('ol.MapBrowserEvent');
goog.require('ol.geom.Polygon');
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
   * The direction of the drawing operation. 1 = right, -1 = left, 0 = undecided.
   * @type {?number}
   * @protected
   */
  this.direction = null;

  /**
   * Whether the draw has cross the antimeridian.
   * @type {boolean}
   */
  this.crossedAntimeridian = false;

  /**
   * Flag for whether the final draw result should be the original geometry or the interpolated one. We
   * want to return the original when the box is not wider than half the world width.
   * @type {boolean}
   */
  this.useOriginal = true;

  /**
   * @type {!os.olm.render.Box}
   * @protected
   */
  this.box2D = new os.olm.render.Box(/** @type {ol.style.Style} */ (this.getStyle()));
};
goog.inherits(os.ui.ol.interaction.DragBox, os.ui.ol.interaction.AbstractDrag);


/**
 * @type {string}
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
  var geom = this.useOriginal ? this.box2D.getOriginalGeometry() : this.box2D.getGeometry();
  geom.set(os.geom.GeometryField.NORMALIZED, true);
  geom.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.RHUMB);
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
  this.crossedAntimeridian = false;
  this.direction = null;
  this.useOriginal = true;

  os.ui.ol.interaction.DragBox.base(this, 'begin', mapBrowserEvent);
  this.box2D.setMap(mapBrowserEvent.map);
};


/**
 * @inheritDoc
 */
os.ui.ol.interaction.DragBox.prototype.update = function(mapBrowserEvent) {
  // record the current last longitude, we'll use this to figure out the differential in the current draw call
  var proj = this.getMap().getView().getProjection();
  var lastEndLon = this.endCoord && ol.proj.toLonLat(this.endCoord, proj)[0];

  this.endCoord = mapBrowserEvent.coordinate || this.endCoord;

  if (this.startCoord && this.endCoord) {
    var start = ol.proj.toLonLat(this.startCoord, proj);
    var end = ol.proj.toLonLat(this.endCoord, proj);

    // we need the ending longitude raw, and normalized to the start + 360 and - 360 to be sure of the direction
    var startLon = start[0];
    var endLon = end[0];
    var endLonNormalizedRight = os.geo2.normalizeLongitude(endLon, startLon, startLon + 360);
    var endLonNormalizedLeft = os.geo2.normalizeLongitude(endLon, startLon, startLon - 360);

    if (lastEndLon != null) {
      var lastEndLonNormalizedRight = os.geo2.normalizeLongitude(lastEndLon, startLon, startLon + 360);
      var lastEndLonNormalizedLeft = os.geo2.normalizeLongitude(lastEndLon, startLon, startLon - 360);

      // The check against 300 here is for the case of crossing the antimeridian. The delta between this call
      // and the last will be ~360 degrees when you pass over the antimeridian (i.e. current lon = 179, last = -179).
      //
      // If and only if we've already cross the antimeridian, we need to check the last normalized differentials as
      // well. This corresponds to the case of wrapping all the way around the world and crossing over the starting
      // point where we need to reset the crossedAntimeridian flag.
      if (Math.abs(endLon - lastEndLon) > 300 || (this.crossedAntimeridian &&
          (Math.abs(endLonNormalizedRight - lastEndLonNormalizedRight) > 300 ||
          Math.abs(endLonNormalizedLeft - lastEndLonNormalizedLeft) > 300))) {
        this.crossedAntimeridian = !this.crossedAntimeridian;
      }
    }

    if (!this.crossedAntimeridian && lastEndLon != null && Math.abs(endLon - lastEndLon) < 180) {
      // 0 = no direction chosen, 1 = right, -1 = left
      this.direction = Math.sign(Math.round((endLon - startLon)));
    }

    // if we're going left, we need to use the left normalized endpoint, and vice versa.
    if (this.direction == -1) {
      endLon = endLonNormalizedLeft;
    } else if (this.direction == 1) {
      endLon = endLonNormalizedRight;
    }

    // insert a central longitude point in order to force the renderers to know which direction to render in
    var middleLon = (endLon + startLon) / 2;
    var minX = startLon;
    var minY = start[1];
    var maxX = endLon;
    var maxY = end[1];
    var geometry;

    if (Math.abs(maxX - minX) > 180) {
      var coords = [
        [minX, minY],
        [minX, maxY],
        [middleLon, maxY],
        [maxX, maxY],
        [maxX, minY],
        [middleLon, minY],
        [minX, minY]
      ];

      this.useOriginal = false;
      geometry = new ol.geom.Polygon([coords]);
    } else {
      this.useOriginal = true;
      geometry = ol.geom.Polygon.fromExtent([minX, minY, maxX, maxY]);
    }

    this.updateGeometry(geometry);
  }
};


os.ui.ol.interaction.DragBox.prototype.updateGeometry = function(geometry) {
  if (geometry) {
    this.box2D.updateGeometry(geometry);
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
  if (this.startCoord && this.endCoord) {
    return 'Start corner: ' + this.startCoord.toString() + '. End corner: ' + this.endCoord.toString();
  }

  return 'Unknown coordinates.';
};
