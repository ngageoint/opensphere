goog.provide('plugin.places.PlacesClear');

goog.require('os.command.ICommand');
goog.require('plugin.places');



/**
 * Command for clearing saved places.
 * @implements {os.command.ICommand}
 * @constructor
 */
plugin.places.PlacesClear = function() {
  this.isAsync = false;
  this.title = 'Clear ' + plugin.places.TITLE;
  this.details = null;
  this.state = os.command.State.READY;

  /**
   * Children of the places root node at time of execution.
   * @type {Array<!plugin.file.kml.ui.KMLNode>}
   * @private
   */
  this.children_ = null;
};


/**
 * @inheritDoc
 */
plugin.places.PlacesClear.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var children = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (rootNode.getChildren());
    this.children_ = children && children.slice() || null;

    if (this.children_) {
      var source = rootNode.getSource();
      if (source) {
        source.clearNode(rootNode, false);
      } else {
        this.state = os.command.State.ERROR;
        this.details = 'Places source is not available.';
        return false;
      }

      rootNode.setChildren(null);
    }
  } else {
    this.state = os.command.State.ERROR;
    this.details = 'Places root node is not available.';
    return false;
  }

  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
plugin.places.PlacesClear.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    if (this.children_) {
      var source = rootNode.getSource();
      if (source) {
        source.addNodes(this.children_, true);
      } else {
        this.state = os.command.State.ERROR;
        this.details = 'Places source is not available.';
        return false;
      }

      rootNode.addChildren(this.children_);
    }
  } else {
    this.state = os.command.State.ERROR;
    this.details = 'Places root node is not available.';
    return false;
  }

  this.state = os.command.State.READY;
  return true;
};
