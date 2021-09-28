goog.declareModuleId('plugin.file.kml.cmd.KMLNodeAdd');

import AbstractKMLNode from './abstractkmlnodecmd.js';

const State = goog.require('os.command.State');

const {default: KMLNode} = goog.requireType('plugin.file.kml.ui.KMLNode');

/**
 * Command to add a KML node to a parent.
 */
export default class KMLNodeAdd extends AbstractKMLNode {
  /**
   * Constructor.
   * @param {!KMLNode} node The KML node
   * @param {!KMLNode} parent The parent node
   */
  constructor(node, parent) {
    super(node, parent);
    this.title = 'Add KML Node';

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

      if (this.add()) {
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

    if (this.remove()) {
      this.state = State.READY;
      return true;
    }

    return false;
  }
}
