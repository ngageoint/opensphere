goog.provide('os.data.DrawingLayerNode');

goog.require('goog.async.Delay');
goog.require('goog.string');
goog.require('os.data.AreaNode');
goog.require('os.data.DrawingFeatureNode');
goog.require('os.data.LayerNode');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.fn');



/**
 * @extends {os.data.LayerNode}
 * @constructor
 */
os.data.DrawingLayerNode = function() {
  os.data.DrawingLayerNode.base(this, 'constructor');

  // we do NOT want to bubble state. Toggling the checkbox for the drawing layer should
  // only toggle visibility. If you actually have it toggle the children area nodes,
  // any queries based on those nodes will clear and re-fire.
  //
  // Yes, this is exactly the opposite of what the KML plugin does with its tree.
  this.setBubbleState(false);

  this.sortDelay_ = new goog.async.Delay(this.onSortDelay, 50, this);
};
goog.inherits(os.data.DrawingLayerNode, os.data.LayerNode);


/**
 * @inheritDoc
 */
os.data.DrawingLayerNode.prototype.disposeInternal = function() {
  this.sortDelay_.dispose();
  os.data.DrawingLayerNode.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.data.DrawingLayerNode.prototype.getState = function() {
  var children = this.getChildren();

  if (!children || children.length === 0) {
    return os.structs.TriState.ON;
  }

  return os.data.DrawingLayerNode.base(this, 'getState');
};


/**
 * @inheritDoc
 */
os.data.DrawingLayerNode.prototype.setLayer = function(value) {
  var currLayer = this.getLayer();
  var source = null;
  var am = os.query.AreaManager.getInstance();

  if (value !== currLayer && currLayer) {
    source = /** @type {os.layer.Vector} */ (currLayer).getSource();

    ol.events.unlisten(
        /** @type {ol.events.EventTarget} */ (source),
        ol.source.VectorEventType.ADDFEATURE,
        this.onFeatureAdded,
        this);

    ol.events.unlisten(
        /** @type {ol.events.EventTarget} */ (source),
        ol.source.VectorEventType.REMOVEFEATURE,
        this.onFeatureRemoved,
        this);

    am.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
    this.setChildren(null);
  }

  os.data.DrawingLayerNode.base(this, 'setLayer', value);

  if (value !== currLayer && value) {
    source = /** @type {os.layer.Vector} */ (value).getSource();

    ol.events.listen(
        /** @type {ol.events.EventTarget} */ (source),
        ol.source.VectorEventType.ADDFEATURE,
        this.onFeatureAdded,
        this);

    ol.events.listen(
        /** @type {ol.events.EventTarget} */ (source),
        ol.source.VectorEventType.REMOVEFEATURE,
        this.onFeatureRemoved,
        this);

    am.listen(goog.events.EventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);

    var areas = am.getAll().map(os.data.DrawingLayerNode.createNode_);
    var others = /** @type {!Array<!ol.Feature>} */ (source.getFeatures()).
      filter(function(feature) {
        return !am.contains(feature) && !os.data.DrawingLayerNode.isHidden(feature);
      }).
      map(os.data.DrawingLayerNode.createNode_);

    var children = areas.concat(others).filter(os.fn.filterFalsey);
    children.sort(os.data.DrawingLayerNode.childSort_);
    this.setChildren(children);
  }
};


/**
 * @param {os.events.PropertyChangeEvent} evt The change event
 * @private
 */
os.data.DrawingLayerNode.prototype.onAreasChanged_ = function(evt) {
  var feature = /** @type {ol.Feature} */ (evt.getNewValue());
  var prop = evt.getProperty();

  if (prop === 'add' || prop === 'add/edit') {
    this.addFeature(feature);
  } else if (prop === 'remove') {
    this.removeFeature(feature);
  }
};


/**
 * Adds a child node for each feature added to the source
 * @param {ol.source.Vector.Event} evt The feature add event
 * @protected
 */
os.data.DrawingLayerNode.prototype.onFeatureAdded = function(evt) {
  this.addFeature(evt.feature);
};


/**
 * @param {ol.Feature|undefined} feature The feature to add
 * @protected
 */
os.data.DrawingLayerNode.prototype.addFeature = function(feature) {
  if (feature && !os.data.DrawingLayerNode.isHidden(feature)) {
    var changed = false;
    var node = this.getChildByFeature(feature);
    if (node instanceof os.ui.query.AreaNode) {
      // update the node
      node.setArea(feature);
      changed = true;
    } else if (node instanceof os.data.DrawingFeatureNode) {
      node.setFeature(feature);
      changed = true;
    } else {
      // recreate the node
      if (node) {
        this.removeChild(node);
      }

      node = os.data.DrawingLayerNode.createNode_(feature);
      if (node) {
        this.addChild(node);
        changed = true;
      }
    }

    if (changed) {
      this.sortDelay_.start();
    }
  }
};


/**
 * On sort delay handler
 * @protected
 */
os.data.DrawingLayerNode.prototype.onSortDelay = function() {
  var children = this.getChildren();
  if (children) {
    children.sort(os.data.DrawingLayerNode.childSort_);
    this.dispatchEvent(new os.events.PropertyChangeEvent('children', children, null));
  }
};


/**
 * @param {!os.structs.ITreeNode} a The first node
 * @param {!os.structs.ITreeNode} b The second node
 * @return {number} per typical compare functions
 * @private
 */
os.data.DrawingLayerNode.childSort_ = function(a, b) {
  if (a instanceof os.data.AreaNode && !(b instanceof os.data.AreaNode)) {
    return -1;
  } else if (!(a instanceof os.data.AreaNode) && b instanceof os.data.AreaNode) {
    return 1;
  }

  var val = goog.string.numerateCompare(a.getLabel() || '', b.getLabel() || '');
  if (val === 0) {
    val = goog.string.numerateCompare(a.getId(), b.getId());
  }

  return val;
};


/**
 * Creates a node from a feature
 * @param {!ol.Feature} feature The feature
 * @return {?os.ui.slick.SlickTreeNode} The node
 * @private
 */
os.data.DrawingLayerNode.createNode_ = function(feature) {
  if (!os.data.DrawingLayerNode.isHidden(feature)) {
    var node = os.query.AreaManager.getInstance().contains(feature) ?
        new os.data.AreaNode(feature) :
        new os.data.DrawingFeatureNode(feature);

    node.setId('' + feature.getId());
    return node;
  }

  return null;
};


/**
 * Removes a child node for each feature removed from the source
 * @param {ol.source.Vector.Event} evt The feature remove event
 * @protected
 */
os.data.DrawingLayerNode.prototype.onFeatureRemoved = function(evt) {
  this.removeFeature(evt.feature);
};


/**
 * @param {!ol.Feature} feature The feature for which to search
 * @return {?os.structs.ITreeNode} The tree node or null if none was found
 * @protected
 */
os.data.DrawingLayerNode.prototype.getChildByFeature = function(feature) {
  return this.childIdMap['' + feature.getId()] || null;
};


/**
 * @param {ol.Feature|undefined} feature The feature to remove
 * @protected
 */
os.data.DrawingLayerNode.prototype.removeFeature = function(feature) {
  var am = os.query.AreaManager.getInstance();
  if (feature && !os.data.DrawingLayerNode.isHidden(feature) && !am.contains(feature)) {
    var node = this.getChildByFeature(feature);

    if (node) {
      this.removeChild(node);
    }
  }
};


/**
 * @param {!ol.Feature} feature The feature
 * @return {boolean} Whether or not a feature is hidden
 */
os.data.DrawingLayerNode.isHidden = function(feature) {
  var node = feature.get(os.data.RecordField.DRAWING_LAYER_NODE);
  node = node === undefined ? true : node;
  return !node;
};
