goog.declareModuleId('plugin.file.kml.cmd.KMLNodeRemove');

import State from '../../../../os/command/state.js';
import AbstractKMLNode from './abstractkmlnodecmd.js';


/**
 * Command to remove a KML node from its parent.
 */
export default class KMLNodeRemove extends AbstractKMLNode {
  /**
   * Constructor.
   * @param {!KMLNode} node The KML node
   */
  constructor(node) {
    super(node, /** @type {KMLNode} */ (node.getParent()));
    this.title = 'Remove KML Node';

    var label = node.getLabel();
    if (label) {
      this.title += ' "' + label + '"';
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      if (this.remove()) {
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

    if (this.add()) {
      this.state = State.READY;
      return true;
    }

    return false;
  }
}
