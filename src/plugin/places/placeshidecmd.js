goog.provide('plugin.places.PlacesHide');

goog.require('os.command.ICommand');
goog.require('os.structs.TriState');
goog.require('plugin.places');



/**
 * Command for hiding all places and annotations
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
plugin.places.PlacesHide.prototype.isAsync = false;


/**
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.title = 'Hide Places and Annotations';


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
  this.state = os.command.State.EXECUTING;
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var source = rootNode.getSource();
    if (source) {
      var features = source.getFeatures();
      if (features) {
        this.children_ = rootNode.getChildren();
        if (this.children_) {
          for (var i = 0, n = this.children_.length; i < n; i++) {
            if (this.children_[i].getState() == os.structs.TriState.ON) {
              this.visibleNodes_.push(this.children_[i]);
            }
          }
        }
        source.hideFeatures(features);
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
 * @inheritDoc
 */
plugin.places.PlacesHide.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (rootNode) {
    var source = rootNode.getSource();
    if (source) {
      if (!this.visibleNodes_.length == 0) {
        for (var i = 0, n = this.visibleNodes_.length; i < n; i++) {
          source.showFeatures(this.visibleNodes_[i].getFeatures());
        }
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
