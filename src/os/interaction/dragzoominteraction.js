goog.provide('os.interaction.DragZoom');

goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.I3DSupport');
goog.require('os.command.FlyToExtent');
goog.require('os.interaction.DragBox');
goog.require('os.map');



/**
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {os.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 */
os.interaction.DragZoom = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  var condition = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.platformModifierKeyOnly;

  /**
   * @private
   * @type {ol.style.Style}
   */
  var style = goog.isDef(options.style) ?
      options.style : new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: [0xff, 0, 0, 1]
        })
      });

  var style3d = goog.isDef(options.style3d) ? options.style3d : new Cesium.ColorGeometryInstanceAttribute(1, 0, 0, 1);

  os.interaction.DragZoom.base(this, 'constructor', {
    condition: condition,
    style: style,
    style3d: style3d
  });

  this.type = 'dragBox';
  this.setActive(true);
};
goog.inherits(os.interaction.DragZoom, os.interaction.DragBox);


/**
 * @inheritDoc
 */
os.interaction.DragZoom.prototype.is3DSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.interaction.DragZoom.prototype.end = function() {
  var extent = this.getGeometry().getExtent();
  var cmd = new os.command.FlyToExtent(extent, undefined, -1);

  // There has been some discussion about whether or not this command should go on the stack.
  // As of now it just executes and is not undoable.
  cmd.execute();

  // Get rid of the box
  this.cancel();
};


/**
 * @inheritDoc
 */
os.interaction.DragZoom.prototype.isType = function() {
  // Always allow drag to zoom
  return true;
};
