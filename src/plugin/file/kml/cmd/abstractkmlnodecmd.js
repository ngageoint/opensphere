goog.provide('plugin.file.kml.cmd.AbstractKMLNode');

goog.require('goog.Disposable');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract command for adding/removing KML nodes.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node
 * @param {plugin.file.kml.ui.KMLNode} parent The parent node
 *
 * @implements {os.command.ICommand}
 * @extends {goog.Disposable}
 *
 * @constructor
 */
plugin.file.kml.cmd.AbstractKMLNode = function(node, parent) {
  plugin.file.kml.cmd.AbstractKMLNode.base(this, 'constructor');

  // {@type os.command.ICommand} properties
  this.details = null;
  this.isAsync = false;
  this.state = os.command.State.READY;
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
};
goog.inherits(plugin.file.kml.cmd.AbstractKMLNode, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.revert = goog.abstractMethod;


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.disposeInternal = function() {
  plugin.file.kml.cmd.AbstractKMLNode.base(this, 'disposeInternal');

  if (this.node) {
    // only dispose of the node if it doesn't have a parent or its parent has been disposed
    var parent = this.node.getParent();
    if (!parent || parent.isDisposed()) {
      goog.dispose(this.node);
    }

    this.node = null;
  }
};


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.node) {
    this.state = os.command.State.ERROR;
    this.details = 'Node has not been provided.';
    return false;
  }

  if (this.node.isDisposed()) {
    this.state = os.command.State.ERROR;
    this.details = 'Node has been disposed.';
    return false;
  }

  if (!this.parent) {
    this.state = os.command.State.ERROR;
    this.details = 'Parent node has not been provided.';
    return false;
  }

  if (this.parent.isDisposed()) {
    this.state = os.command.State.ERROR;
    this.details = 'Parent node has been disposed.';
    return false;
  }

  return true;
};


/**
 * Adds the node to the parent.
 * @return {boolean} If the add succeeded or not.
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.add = function() {
  if (this.node && this.parent) {
    var source = this.parent.getSource();
    if (source) {
      source.addNodes([this.node], true);
    } else {
      this.state = os.command.State.ERROR;
      this.details = 'Node source is not available.';
      return false;
    }

    this.parent.addChild(this.node);
    return true;
  }

  this.state = os.command.State.ERROR;
  this.details = 'Node/parent are not available.';
  return false;
};


/**
 * Removes the node from its parent.
 * @return {boolean} If the remove succeeded or not.
 */
plugin.file.kml.cmd.AbstractKMLNode.prototype.remove = function() {
  if (this.node && this.parent) {
    // remove the node from the tree first, so it isn't included in getFeatures calls on other nodes in the tree
    this.parent.removeChild(this.node);

    var source = this.node.getSource();
    if (source) {
      source.clearNode(this.node, false);
    } else {
      this.state = os.command.State.ERROR;
      this.details = 'Node source is not available.';
      return false;
    }

    return true;
  }

  this.state = os.command.State.ERROR;
  this.details = 'Node/parent are not available.';
  return false;
};
