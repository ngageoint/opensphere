goog.provide('plugin.places.PlacesHide');

goog.require('os.command.ICommand');
goog.require('os.structs.TriState');
goog.require('plugin.places');



/**
 * Command for hiding all places
 * @implements {os.command.ICommand}
 * @constructor
 */
plugin.places.PlacesHide = function() {
  /**
   * Features that visible at time of execution
   * @type {Array}
   * @private
   */
  this.visibleNodes_ = [];
};


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.isAsync = false;


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.title = 'Hide Places';


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.details = null;


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.execute = function() {
  this.visibleNodes_ = [];
  this.state = os.command.State.EXECUTING;
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var source = rootNode.getSource();
    if (source) {
      var features = source.getFeatures();
      if (features) {
        this.storeVisibleChildren(rootNode);
      }
    } else {
      this.state = os.command.State.ERROR;
      this.details = 'Places source is not available.';
      return false;
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
 * Traverse the kml tree for visible nodes
 * @param {plugin.file.kml.ui.KMLNode} rootNode
 */
plugin.places.PlacesHide.prototype.storeVisibleChildren = function(rootNode) {
  var children = rootNode.getChildren();
  if (children) {
    for (var i = 0; i < children.length; i++) {
      if (children[i].getState() == os.structs.TriState.ON) {
        this.visibleNodes_.push(children[i]);
        children[i].setState(os.structs.TriState.OFF);
      }

      if (children[i].isFolder()) { // look at folder's children
        this.storeVisibleChildren(/** @type {plugin.file.kml.ui.KMLNode} */ (children[i]));
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var source = rootNode.getSource();
    if (source) {
      if (this.visibleNodes_.length != 0) {
        var features = [];
        for (var i = 0, n = this.visibleNodes_.length; i < n; i++) {
          features = features.concat(this.visibleNodes_[i].getFeatures());
          this.visibleNodes_[i].setState(os.structs.TriState.ON);
        }
        source.showFeatures(features);
      }
    } else {
      this.state = os.command.State.ERROR;
      this.details = 'Places source is not available.';
      return false;
    }
  } else {
    this.state = os.command.State.ERROR;
    this.details = 'Places root node is not available.';
    return false;
  }

  this.state = os.command.State.READY;
  return true;
};
