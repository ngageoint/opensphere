goog.declareModuleId('os.command.LayerAdd');

import AbstractLayer from './abstractlayercmd.js';
import State from './state.js';


/**
 * Command to configure a layer using a registered config class.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.ActivateDescriptor} instead.
 */
export default class LayerAdd extends AbstractLayer {
  /**
   * Constructor.
   * @param {Object.<string, *>} options The configuration for the map layer.
   */
  constructor(options) {
    super(options);
    this.title = 'Add Layer';
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      if (this.add(this.layerOptions)) {
        this.state = State.SUCCESS;
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    if (this.remove(this.layerOptions)) {
      this.state = State.READY;
      return true;
    }

    return false;
  }
}
