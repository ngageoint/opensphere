goog.provide('os.interaction.DragBox');

goog.require('ol.MapBrowserEvent');
goog.require('ol.color');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.I3DSupport');
goog.require('os.MapEvent');
goog.require('os.geo');
goog.require('os.ui.ol.interaction.DragBox');


/**
 * Draws a rectangluar query area on the map. This interaction is only supported for mouse devices.
 * @param {olx.interaction.PointerOptions=} opt_options
 * @extends {os.ui.ol.interaction.DragBox}
 * @implements {os.I3DSupport}
 * @constructor
 */
os.interaction.DragBox = function(opt_options) {
  var options = opt_options || {};
  var color = /** @type {ol.Color|string} */ (options.color) || 'rgba(0,255,255,1)';
  options.style = options.style || new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: color,
      lineCap: 'square',
      width: 2
    })
  });

  os.interaction.DragBox.base(this, 'constructor', options);

  /**
   * The box color.
   * @type {ol.Color}
   * @protected
   */
  this.color = ol.color.asArray(color) || [0, 255, 255, 1];
};
goog.inherits(os.interaction.DragBox, os.ui.ol.interaction.DragBox);


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.update2D = function(start, end) {
  os.interaction.DragBox.base(this, 'update2D', start, end);
  this.updateWebGL(start, end);
};


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.cleanup = function() {
  os.interaction.DragBox.base(this, 'cleanup');

  // restore camera controls in 3D mode
  var map = /** @type {os.Map} */ (this.getMap());
  map.toggleMovement(true);

  this.cleanupWebGL();
};


/**
 * Clean up the WebGL renderer.
 */
os.interaction.DragBox.prototype.cleanupWebGL = goog.nullFunction;


/**
 * Update the box in the WebGL renderer.
 * @param {ol.Coordinate} start The start coordinate.
 * @param {ol.Coordinate} end The end coordinate.
 */
os.interaction.DragBox.prototype.updateWebGL = goog.nullFunction;


/**
 * @inheritDoc
 */
os.interaction.DragBox.prototype.is3DSupported = function() {
  return true;
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
