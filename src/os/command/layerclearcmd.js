goog.provide('os.command.LayerClear');

goog.require('os.MapContainer');
goog.require('os.command.LayerRemove');
goog.require('os.command.SequenceCommand');
goog.require('os.data.DeactivateDescriptor');



/**
 * Command for clearing layers on the map.
 * @extends {os.command.SequenceCommand}
 * @constructor
 */
os.command.LayerClear = function() {
  os.command.LayerClear.base(this, 'constructor');
  this.title = 'Clear Layers';
  this.setCommands([]);
};
goog.inherits(os.command.LayerClear, os.command.SequenceCommand);


/**
 * @inheritDoc
 */
os.command.LayerClear.prototype.setCommands = function(set) {
  os.command.LayerClear.base(this, 'setCommands', set);
  this.isAsync = true;
};


/**
 * @inheritDoc
 */
os.command.LayerClear.prototype.execute = function() {
  // create a list of commands to execute based on the layers currently on the map
  var commands = [];
  var descriptors = [];
  var removeOptions = [];

  var layers = os.MapContainer.getInstance().getLayers();
  for (var i = 0, n = layers.length; i < n; i++) {
    var layer = /** @type {os.layer.ILayer} */ (layers[i]);
    try {
      var layerOptions = layer.getLayerOptions();
      if (layer.isRemovable() && layerOptions && !layerOptions['noClear']) {
        var descriptor = os.dataManager.getDescriptor(layer.getId());
        if (descriptor instanceof os.data.LayerSyncDescriptor && descriptor.isActive()) {
          // if a unique, active descriptor is found that is synchronized to the layer, add it to the list
          if (descriptors.indexOf(descriptor) == -1) {
            descriptors.push(descriptor);
          }
        } else if (layerOptions['loadOnce']) {
          // layers flagged as loading once (primarily static layers) may not reload in the correct state, so just
          // remove them from the map
          os.MapContainer.getInstance().removeLayer(/** @type {string} */ (layerOptions['id']));
        } else {
          // otherwise add the options so a command is created
          removeOptions.push(layerOptions);
        }
      }
    } catch (e) {
      // not a layer, so don't remove it
    }
  }

  // add commands to deactivate descriptors
  for (var i = 0; i < descriptors.length; i++) {
    commands.push(new os.data.DeactivateDescriptor(descriptors[i]));
  }

  // add commands to remove layers
  for (var i = 0; i < removeOptions.length; i++) {
    commands.push(new os.command.LayerRemove(removeOptions[i]));
  }

  // sequence commands will fail if they don't actually have commands, so check that first
  if (commands.length > 0) {
    this.setCommands(commands);
    return os.command.LayerClear.base(this, 'execute');
  }

  // no commands - all done
  this.state = os.command.State.SUCCESS;
  this.details = null;
  this.dispatchEvent(os.command.EventType.EXECUTED);
  return true;
};
