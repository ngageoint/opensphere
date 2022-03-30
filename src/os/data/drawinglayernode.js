goog.declareModuleId('os.data.DrawingLayerNode');

import {listen, unlistenByKey} from 'ol/src/events.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';

import {registerClass} from '../classregistry.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import * as fn from '../fn/fn.js';
import {getAreaManager} from '../query/queryinstance.js';
import TriState from '../structs/tristate.js';
import osUiQueryAreaNode from '../ui/query/areanode.js';
import AreaNode from './areanode.js';
import {NodeClass} from './data.js';
import DrawingFeatureNode from './drawingfeaturenode.js';
import LayerNode from './layernode.js';
import RecordField from './recordfield.js';

const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');
const googString = goog.require('goog.string');


/**
 */
export default class DrawingLayerNode extends LayerNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // We do NOT want to bubble state. Toggling the checkbox for the drawing layer should
    // only toggle visibility. If you actually have it toggle the children area nodes,
    // any queries based on those nodes will clear and re-fire.
    this.setBubbleState(false);

    this.sortDelay_ = new Delay(this.onSortDelay, 50, this);

    this.addFeatureListenKey = null;
    this.removeFeatureListenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.sortDelay_.dispose();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getState() {
    var children = this.getChildren();

    if (!children || children.length === 0) {
      return TriState.ON;
    }

    return super.getState();
  }

  /**
   * @inheritDoc
   */
  setLayer(value) {
    var currLayer = this.getLayer();
    var source = null;
    var am = getAreaManager();

    if (value !== currLayer && currLayer) {
      source = /** @type {VectorLayer} */ (currLayer).getSource();

      unlistenByKey(this.addFeatureListenKey);

      unlistenByKey(this.removeFeatureListenKey);

      am.unlisten(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
      this.setChildren(null);
    }

    super.setLayer(value);

    if (value !== currLayer && value) {
      source = /** @type {VectorLayer} */ (value).getSource();

      this.addFeatureListenKey = listen(
          /** @type {EventTarget} */ (source),
          VectorEventType.ADDFEATURE,
          this.onFeatureAdded,
          this);

      this.removeFeatureListenKey = listen(
          /** @type {EventTarget} */ (source),
          VectorEventType.REMOVEFEATURE,
          this.onFeatureRemoved,
          this);

      am.listen(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);

      var areas = am.getAll().map(DrawingLayerNode.createNode_);
      var others = /** @type {!Array<!Feature>} */ (source.getFeatures()).
          filter(function(feature) {
            return !am.contains(feature) && !DrawingLayerNode.isHidden(feature);
          }).
          map(DrawingLayerNode.createNode_);

      var children = areas.concat(others).filter(fn.filterFalsey);
      children.sort(DrawingLayerNode.childSort_);
      this.setChildren(children);
    }
  }

  /**
   * @param {PropertyChangeEvent} evt The change event
   * @private
   */
  onAreasChanged_(evt) {
    var feature = /** @type {Feature} */ (evt.getNewValue());
    var prop = evt.getProperty();

    if (prop === 'add' || prop === 'add/edit') {
      this.addFeature(feature);
    } else if (prop === 'remove') {
      this.removeFeature(feature);
    }
  }

  /**
   * Adds a child node for each feature added to the source
   *
   * @param {OLVectorSource.Event} evt The feature add event
   * @protected
   */
  onFeatureAdded(evt) {
    this.addFeature(evt.feature);
  }

  /**
   * @param {Feature|undefined} feature The feature to add
   * @protected
   */
  addFeature(feature) {
    if (feature && !DrawingLayerNode.isHidden(feature)) {
      var changed = false;
      var node = this.getChildByFeature(feature);
      if (node instanceof osUiQueryAreaNode) {
        // update the node
        node.setArea(feature);
        changed = true;
      } else if (node instanceof DrawingFeatureNode) {
        node.setFeature(feature);
        changed = true;
      } else {
        // recreate the node
        if (node) {
          this.removeChild(node);
        }

        node = DrawingLayerNode.createNode_(feature);
        if (node) {
          this.addChild(node);
          changed = true;
        }
      }

      if (changed) {
        this.sortDelay_.start();
      }
    }
  }

  /**
   * On sort delay handler
   *
   * @protected
   */
  onSortDelay() {
    var children = this.getChildren();
    if (children) {
      children.sort(DrawingLayerNode.childSort_);
      this.dispatchEvent(new PropertyChangeEvent('children', children, null));
    }
  }

  /**
   * Removes a child node for each feature removed from the source
   *
   * @param {OLVectorSource.Event} evt The feature remove event
   * @protected
   */
  onFeatureRemoved(evt) {
    this.removeFeature(evt.feature);
  }

  /**
   * @param {!Feature} feature The feature for which to search
   * @return {?ITreeNode} The tree node or null if none was found
   * @protected
   */
  getChildByFeature(feature) {
    return this.childIdMap['' + feature.getId()] || null;
  }

  /**
   * @param {Feature|undefined} feature The feature to remove
   * @protected
   */
  removeFeature(feature) {
    var am = getAreaManager();
    if (feature && !DrawingLayerNode.isHidden(feature) && !am.contains(feature)) {
      var node = this.getChildByFeature(feature);

      if (node) {
        this.removeChild(node);
      }
    }
  }

  /**
   * @param {!ITreeNode} a The first node
   * @param {!ITreeNode} b The second node
   * @return {number} per typical compare functions
   * @private
   */
  static childSort_(a, b) {
    if (a instanceof AreaNode && !(b instanceof AreaNode)) {
      return -1;
    } else if (!(a instanceof AreaNode) && b instanceof AreaNode) {
      return 1;
    }

    var val = googString.numerateCompare(a.getLabel() || '', b.getLabel() || '');
    if (val === 0) {
      val = googString.numerateCompare(a.getId(), b.getId());
    }

    return val;
  }

  /**
   * Creates a node from a feature
   *
   * @param {!Feature} feature The feature
   * @return {?SlickTreeNode} The node
   * @private
   */
  static createNode_(feature) {
    if (!DrawingLayerNode.isHidden(feature)) {
      var node = getAreaManager().contains(feature) ?
        new AreaNode(feature) :
        new DrawingFeatureNode(feature);

      node.setId('' + feature.getId());
      return node;
    }

    return null;
  }

  /**
   * @param {!Feature} feature The feature
   * @return {boolean} Whether or not a feature is hidden
   */
  static isHidden(feature) {
    var node = feature.get(RecordField.DRAWING_LAYER_NODE);
    node = node === undefined ? true : node;
    return !node;
  }
}

registerClass(NodeClass.DRAW_LAYER, DrawingLayerNode);
