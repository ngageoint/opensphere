goog.declareModuleId('plugin.places.PlacesHide');

import State from '../../os/command/state.js';
import TriState from '../../os/structs/tristate.js';
import PlacesManager from './placesmanager.js';


/**
 * Command for hiding all places
 * @implements {ICommand}
 */
export default class PlacesHide {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Hide Places';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * Features that visible at time of execution
     * @type {Array}
     * @private
     */
    this.visibleNodes_ = [];
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.visibleNodes_ = [];
    this.state = State.EXECUTING;
    var rootNode = PlacesManager.getInstance().getPlacesRoot();
    if (rootNode) {
      var source = rootNode.getSource();
      if (source) {
        var features = source.getFeatures();
        if (features) {
          this.storeVisibleChildren(rootNode);
        }
      } else {
        this.state = State.ERROR;
        this.details = 'Places source is not available.';
        return false;
      }
    } else {
      this.state = State.ERROR;
      this.details = 'Places root node is not available.';
      return false;
    }

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * Traverse the kml tree for visible nodes
   * @param {KMLNode} rootNode
   */
  storeVisibleChildren(rootNode) {
    var children = /** @type {Array<KMLNode>} */ (rootNode.getChildren());
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i].getState() == TriState.ON) {
          this.visibleNodes_.push(children[i]);
          children[i].setState(TriState.OFF);
        }

        if (children[i].isFolder()) { // look at folder's children
          this.storeVisibleChildren(/** @type {KMLNode} */ (children[i]));
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    var rootNode = PlacesManager.getInstance().getPlacesRoot();
    if (rootNode) {
      var source = rootNode.getSource();
      if (source) {
        if (this.visibleNodes_.length != 0) {
          var features = [];
          for (var i = 0, n = this.visibleNodes_.length; i < n; i++) {
            features = features.concat(this.visibleNodes_[i].getFeatures());
            this.visibleNodes_[i].setState(TriState.ON);
          }
          source.showFeatures(features);
        }
      } else {
        this.state = State.ERROR;
        this.details = 'Places source is not available.';
        return false;
      }
    } else {
      this.state = State.ERROR;
      this.details = 'Places root node is not available.';
      return false;
    }

    this.state = State.READY;
    return true;
  }
}
