goog.module('os.command.LayerRemove');
goog.module.declareLegacyNamespace();

const AbstractLayer = goog.require('os.command.AbstractLayer');
const State = goog.require('os.command.State');


/**
 * Command to configure a layer using a registered config class.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.DeactivateDescriptor} instead.
 */
class LayerRemove extends AbstractLayer {
  /**
   * Constructor.
   * @param {Object.<string, *>} options The configuration for the map layer.
   */
  constructor(options) {
    super(options);
    this.title = 'Remove Layer';
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      if (this.remove(this.layerOptions)) {
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

    if (this.add(this.layerOptions)) {
      this.state = State.READY;
      return true;
    }

    return false;
  }
}

exports = LayerRemove;
