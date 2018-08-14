goog.provide('os.interaction.DragZoom');

goog.require('os.I3DSupport');
goog.require('os.command.FlyToExtent');
goog.require('os.implements');
goog.require('os.interaction.DragBox');


/**
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {os.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 */
os.interaction.DragZoom = function(opt_options) {
  var options = opt_options || {};
  os.interaction.DragZoom.base(this, 'constructor', {
    color: options.color || 'rgba(255,0,0,1)',
    condition: options.condition || ol.events.condition.platformModifierKeyOnly
  });

  this.type = 'dragBox';
  this.setActive(true);
};
goog.inherits(os.interaction.DragZoom, os.interaction.DragBox);
os.implements(os.interaction.DragZoom, os.I3DSupport.ID);


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
