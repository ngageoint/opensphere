goog.module('os.data.DrawingLayerNode');
goog.module.declareLegacyNamespace();

const Delay = goog.require('goog.async.Delay');
const GoogEventType = goog.require('goog.events.EventType');
const googString = goog.require('goog.string');
const events = goog.require('ol.events');
const VectorEventType = goog.require('ol.source.VectorEventType');
const AreaNode = goog.require('os.data.AreaNode');
const DrawingFeatureNode = goog.require('os.data.DrawingFeatureNode');
const LayerNode = goog.require('os.data.LayerNode');
const RecordField = goog.require('os.data.RecordField');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const fn = goog.require('os.fn');
const {getAreaManager} = goog.require('os.query.instance');
const TriState = goog.require('os.structs.TriState');
const osUiQueryAreaNode = goog.require('os.ui.query.AreaNode');


/**
 */
class DrawingLayerNode extends LayerNode {
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
      source = /** @type {os.layer.Vector} */ (currLayer).getSource();

      events.unlisten(
          /** @type {ol.events.EventTarget} */ (source),
          VectorEventType.ADDFEATURE,
          this.onFeatureAdded,
          this);

      events.unlisten(
          /** @type {ol.events.EventTarget} */ (source),
          VectorEventType.REMOVEFEATURE,
          this.onFeatureRemoved,
          this);

      am.unlisten(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
      this.setChildren(null);
    }

    super.setLayer(value);

    if (value !== currLayer && value) {
      source = /** @type {os.layer.Vector} */ (value).getSource();

      events.listen(
          /** @type {ol.events.EventTarget} */ (source),
          VectorEventType.ADDFEATURE,
          this.onFeatureAdded,
          this);

      events.listen(
          /** @type {ol.events.EventTarget} */ (source),
          VectorEventType.REMOVEFEATURE,
          this.onFeatureRemoved,
          this);

      am.listen(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);

      var areas = am.getAll().map(DrawingLayerNode.createNode_);
      var others = /** @type {!Array<!ol.Feature>} */ (source.getFeatures()).
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
    var feature = /** @type {ol.Feature} */ (evt.getNewValue());
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
   * @param {ol.source.Vector.Event} evt The feature add event
   * @protected
   */
  onFeatureAdded(evt) {
    this.addFeature(evt.feature);
  }

  /**
   * @param {ol.Feature|undefined} feature The feature to add
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
   * @param {ol.source.Vector.Event} evt The feature remove event
   * @protected
   */
  onFeatureRemoved(evt) {
    this.removeFeature(evt.feature);
  }

  /**
   * @param {!ol.Feature} feature The feature for which to search
   * @return {?os.structs.ITreeNode} The tree node or null if none was found
   * @protected
   */
  getChildByFeature(feature) {
    return this.childIdMap['' + feature.getId()] || null;
  }

  /**
   * @param {ol.Feature|undefined} feature The feature to remove
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
   * @param {!os.structs.ITreeNode} a The first node
   * @param {!os.structs.ITreeNode} b The second node
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
   * @param {!ol.Feature} feature The feature
   * @return {?os.ui.slick.SlickTreeNode} The node
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
   * @param {!ol.Feature} feature The feature
   * @return {boolean} Whether or not a feature is hidden
   */
  static isHidden(feature) {
    var node = feature.get(RecordField.DRAWING_LAYER_NODE);
    node = node === undefined ? true : node;
    return !node;
  }
}

exports = DrawingLayerNode;
