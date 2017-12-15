goog.provide('os.command.LayerAdd');

goog.require('os.command.AbstractLayer');
goog.require('os.command.State');



/**
 * Command to configure a layer using a registered config class.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.ActivateDescriptor} instead.
 *
 * @param {Object.<string, *>} options The configuration for the map layer.
 * @extends {os.command.AbstractLayer}
 * @constructor
 */
os.command.LayerAdd = function(options) {
  os.command.LayerAdd.base(this, 'constructor', options);
  this.title = 'Add Layer';
};
goog.inherits(os.command.LayerAdd, os.command.AbstractLayer);


/**
 * @inheritDoc
 */
os.command.LayerAdd.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    if (this.add(this.layerOptions)) {
      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.LayerAdd.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.remove(this.layerOptions)) {
    this.state = os.command.State.READY;
    return true;
  }

  return false;
};
