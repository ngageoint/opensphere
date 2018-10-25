goog.provide('os.interaction.DragCircle');

goog.require('goog.string');
goog.require('ol');
goog.require('os.I3DSupport');
goog.require('os.MapEvent');
goog.require('os.geo');
goog.require('os.implements');
goog.require('os.map');
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
  this.circle2D.setUnits(os.unit.UnitManager.getInstance().getSelectedSystem());
};
goog.inherits(os.interaction.DragCircle, os.ui.ol.interaction.DragCircle);
os.implements(os.interaction.DragCircle, os.I3DSupport.ID);

/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.update2D = function(start, end) {
  if (start && end) {
    this.circle2D.setCoordinates(start, end);
    this.circle2D.setUnits(os.unit.UnitManager.getInstance().getSelectedSystem());
  }

  this.updateWebGL(start, end);
};


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.cleanup = function() {
  os.interaction.DragCircle.base(this, 'cleanup');

  // restore camera controls in 3D mode
  /** @type {os.Map} */ (this.getMap()).toggleMovement(true);

  this.cleanupWebGL();
};


/**
 * Clean up the WebGL renderer.
 */
os.interaction.DragCircle.prototype.cleanupWebGL = goog.nullFunction;


/**
 * Update the circle in the WebGL renderer.
 * @param {ol.Coordinate} start The start coordinate.
 * @param {ol.Coordinate} end The end coordinate.
 */
os.interaction.DragCircle.prototype.updateWebGL = goog.nullFunction;


/**
 * @inheritDoc
 */
os.interaction.DragCircle.prototype.is3DSupported = function() {
  return true;
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
