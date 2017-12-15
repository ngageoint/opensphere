goog.provide('plugin.file.kml.cmd.KMLNodeRemove');

goog.require('os.command.State');
goog.require('plugin.file.kml.cmd.AbstractKMLNode');



/**
 * Command to remove a KML node from its parent.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node
 *
 * @extends {plugin.file.kml.cmd.AbstractKMLNode}
 * @constructor
 */
plugin.file.kml.cmd.KMLNodeRemove = function(node) {
  plugin.file.kml.cmd.KMLNodeRemove.base(this, 'constructor',
      node, /** @type {plugin.file.kml.ui.KMLNode} */ (node.getParent()));
  this.title = 'Remove KML Node';

  var label = node.getLabel();
  if (label) {
    this.title += ' "' + label + '"';
  }
};
goog.inherits(plugin.file.kml.cmd.KMLNodeRemove, plugin.file.kml.cmd.AbstractKMLNode);


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.KMLNodeRemove.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    if (this.remove()) {
      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.KMLNodeRemove.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.add()) {
    this.state = os.command.State.READY;
    return true;
  }

  return false;
};
