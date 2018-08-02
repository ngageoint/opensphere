goog.provide('plugin.file.kml.cmd.KMLNodeAdd');

goog.require('os.command.State');
goog.require('plugin.file.kml.cmd.AbstractKMLNode');



/**
 * Command to add a KML node to a parent.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node
 * @param {!plugin.file.kml.ui.KMLNode} parent The parent node
 *
 * @extends {plugin.file.kml.cmd.AbstractKMLNode}
 * @constructor
 */
plugin.file.kml.cmd.KMLNodeAdd = function(node, parent) {
  plugin.file.kml.cmd.KMLNodeAdd.base(this, 'constructor', node, parent);
  this.title = 'Add KML Node';

  var label = node.getLabel();
  if (label) {
    this.title += ' "' + label + '"';
  }
};
goog.inherits(plugin.file.kml.cmd.KMLNodeAdd, plugin.file.kml.cmd.AbstractKMLNode);


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.KMLNodeAdd.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;

    if (this.add()) {
      this.state = os.command.State.SUCCESS;
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.cmd.KMLNodeAdd.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  if (this.remove()) {
    this.state = os.command.State.READY;
    return true;
  }

  return false;
};
