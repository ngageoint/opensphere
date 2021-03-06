goog.module('plugin.file.kml.cmd.AbstractKMLNode');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const dispose = goog.require('goog.dispose');
const State = goog.require('os.command.State');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract command for adding/removing KML nodes.
 *
 * @abstract
 *
 * @implements {ICommand}
 */
class AbstractKMLNode extends Disposable {
  /**
   * Constructor.
   * @param {!plugin.file.kml.ui.KMLNode} node The KML node
   * @param {plugin.file.kml.ui.KMLNode} parent The parent node
   */
  constructor(node, parent) {
    super();

    /**
     * The details of the command.
     * @type {?string}
     */
    this.details = null;

    /**
     * Whether or not the command is asynchronous.
     * @type {boolean}
     */
    this.isAsync = false;

    /**
     * Return the current state of the command.
     * @type {!State}
     */
    this.state = State.READY;

    /**
     * The title of the command.
     * @type {?string}
     */
    this.title = 'Add/Remove KML Node';

    /**
     * The node to add/remove
     * @type {plugin.file.kml.ui.KMLNode}
     * @protected
     */
    this.node = node;

    /**
     * The parent of the node to add/remove
     * @type {plugin.file.kml.ui.KMLNode}
     * @protected
     */
    this.parent = parent;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  execute() {}

  /**
   * @abstract
   * @inheritDoc
   */
  revert() {}

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.node) {
      // only dispose of the node if it doesn't have a parent or its parent has been disposed
      var parent = this.node.getParent();
      if (!parent || parent.isDisposed()) {
        dispose(this.node);
      }

      this.node = null;
    }
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.node) {
      this.state = State.ERROR;
      this.details = 'Node has not been provided.';
      return false;
    }

    if (this.node.isDisposed()) {
      this.state = State.ERROR;
      this.details = 'Node has been disposed.';
      return false;
    }

    if (!this.parent) {
      this.state = State.ERROR;
      this.details = 'Parent node has not been provided.';
      return false;
    }

    if (this.parent.isDisposed()) {
      this.state = State.ERROR;
      this.details = 'Parent node has been disposed.';
      return false;
    }

    return true;
  }

  /**
   * Adds the node to the parent.
   *
   * @return {boolean} If the add succeeded or not.
   */
  add() {
    if (this.node && this.parent) {
      var source = this.parent.getSource();
      if (source) {
        source.addNodes([this.node], true);
      } else {
        this.state = State.ERROR;
        this.details = 'Node source is not available.';
        return false;
      }

      this.parent.addChild(this.node);
      return true;
    }

    this.state = State.ERROR;
    this.details = 'Node/parent are not available.';
    return false;
  }

  /**
   * Removes the node from its parent.
   *
   * @return {boolean} If the remove succeeded or not.
   */
  remove() {
    if (this.node && this.parent) {
      // remove the node from the tree first, so it isn't included in getFeatures calls on other nodes in the tree
      this.parent.removeChild(this.node);

      var source = this.node.getSource();
      if (source) {
        source.clearNode(this.node, false);
      } else {
        this.state = State.ERROR;
        this.details = 'Node source is not available.';
        return false;
      }

      return true;
    }

    this.state = State.ERROR;
    this.details = 'Node/parent are not available.';
    return false;
  }
}

exports = AbstractKMLNode;
