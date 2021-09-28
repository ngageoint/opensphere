goog.declareModuleId('os.command.LayerClear');

import DataManager from '../data/datamanager.js';
import DeactivateDescriptor from '../data/deactivatedescriptorcmd.js';
import LayerSyncDescriptor from '../data/layersyncdescriptor.js';
import {getMapContainer} from '../map/mapinstance.js';
import EventType from './eventtype.js';
import LayerRemove from './layerremovecmd.js';
import SequenceCommand from './sequencecommand.js';
import State from './state.js';


/**
 * Command for clearing layers on the map.
 */
export default class LayerClear extends SequenceCommand {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.title = 'Clear Layers';
    this.setCommands([]);
  }

  /**
   * @inheritDoc
   */
  setCommands(set) {
    super.setCommands(set);
    this.isAsync = true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    // create a list of commands to execute based on the layers currently on the map
    var commands = [];
    var descriptors = [];
    var removeOptions = [];

    var layers = getMapContainer().getLayers();
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = /** @type {os.layer.ILayer} */ (layers[i]);
      try {
        var layerOptions = layer.getLayerOptions();
        if (layer.isRemovable() && layerOptions && !layerOptions['noClear']) {
          var descriptor = DataManager.getInstance().getDescriptor(layer.getId());
          if (descriptor instanceof LayerSyncDescriptor && descriptor.isActive()) {
            // if a unique, active descriptor is found that is synchronized to the layer, add it to the list
            if (descriptors.indexOf(descriptor) == -1) {
              descriptors.push(descriptor);
            }
          } else if (layerOptions['loadOnce']) {
            // layers flagged as loading once (primarily static layers) may not reload in the correct state, so just
            // remove them from the map
            getMapContainer().removeLayer(/** @type {string} */ (layerOptions['id']));
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
      commands.push(new DeactivateDescriptor(descriptors[i]));
    }

    // add commands to remove layers
    for (var i = 0; i < removeOptions.length; i++) {
      commands.push(new LayerRemove(removeOptions[i]));
    }

    // sequence commands will fail if they don't actually have commands, so check that first
    if (commands.length > 0) {
      this.setCommands(commands);
      return super.execute();
    }

    // no commands - all done
    this.state = State.SUCCESS;
    this.details = null;
    this.dispatchEvent(EventType.EXECUTED);
    return true;
  }
}
