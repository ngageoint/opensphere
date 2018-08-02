goog.provide('plugin.file.kml.ui.KMLLayerNode');
goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('os.data.LayerNode');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriState');
goog.require('plugin.file.kml.KMLSource');



/**
 * Tree node for KML layers
 * @param {!os.layer.Vector} layer The KML layer
 * @extends {os.data.LayerNode}
 * @constructor
 */
plugin.file.kml.ui.KMLLayerNode = function(layer) {
  plugin.file.kml.ui.KMLLayerNode.base(this, 'constructor');

  /**
   * The KML data source
   * @type {plugin.file.kml.KMLSource}
   * @private
   */
  this.source_ = null;

  /**
   * Number of loading children.
   * @type {number}
   * @private
   */
  this.childLoadCount_ = 0;

  /**
   * Root node listen key.
   * @type {goog.events.ListenableKey|undefined}
   * @private
   */
  this.rootListenKey_ = undefined;

  this.setLayer(layer);
};
goog.inherits(plugin.file.kml.ui.KMLLayerNode, os.data.LayerNode);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLLayerNode.prototype.disposeInternal = function() {
  var layer = this.getLayer();
  if (layer instanceof plugin.file.kml.KMLLayer) {
    layer.collapsed = this.collapsed;
  }

  if (this.rootListenKey_) {
    goog.events.unlistenByKey(this.rootListenKey_);
    this.rootListenKey_ = undefined;
  }

  // update the layer first so it isn't affected by the children changing
  this.setLayer(null);

  // remove child nodes so the KML tree isn't destroyed
  this.setChildren(null);

  plugin.file.kml.ui.KMLLayerNode.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLLayerNode.prototype.onChildChange = function(e) {
  plugin.file.kml.ui.KMLLayerNode.base(this, 'onChildChange', e);

  var p = e.getProperty();
  if (p == 'loading') {
    if (e.getNewValue()) {
      this.childLoadCount_++;
    } else {
      this.childLoadCount_--;
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('loading'));
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLLayerNode.prototype.isLoading = function() {
  return this.childLoadCount_ > 0 || plugin.file.kml.ui.KMLLayerNode.base(this, 'isLoading');
};
goog.exportProperty(
    plugin.file.kml.ui.KMLLayerNode.prototype,
    'isLoading',
    plugin.file.kml.ui.KMLLayerNode.prototype.isLoading);


/**
 * If the KML can be edited.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLLayerNode.prototype.isEditable = function() {
  var layer = this.getLayer();
  if (layer instanceof plugin.file.kml.KMLLayer) {
    return layer.editable;
  }

  return false;
};


/**
 * Set the KML data source
 * @param {plugin.file.kml.KMLSource} source The source
 * @private
 */
plugin.file.kml.ui.KMLLayerNode.prototype.setSource_ = function(source) {
  if (this.source_) {
    ol.events.unlisten(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }

  this.source_ = source;

  if (source) {
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    this.updateFromSource_();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLLayerNode.prototype.setLayer = function(value) {
  plugin.file.kml.ui.KMLLayerNode.base(this, 'setLayer', value);

  var source = null;
  if (value instanceof plugin.file.kml.KMLLayer) {
    var layerSource = /** @type {os.layer.Vector} */ (value).getSource();
    if (layerSource instanceof plugin.file.kml.KMLSource) {
      source = layerSource;
    }

    this.collapsed = value.collapsed;
  }

  this.setSource_(source);
};


/**
 * Handles changes on the source
 * @param {os.events.PropertyChangeEvent} e The event
 * @private
 */
plugin.file.kml.ui.KMLLayerNode.prototype.onSourceChange_ = function(e) {
  if (e instanceof os.events.PropertyChangeEvent) {
    var p = e.getProperty();
    if (p == 'loading') {
      this.updateFromSource_();
    }
  }
};


/**
 * Updates the tree from the KML source
 * @private
 */
plugin.file.kml.ui.KMLLayerNode.prototype.updateFromSource_ = function() {
  if (this.source_ && !this.source_.isLoading()) {
    // call getRoot to handle both when the root node is shown/not shown
    var children = this.getChildren();
    var currentRoot = children && children.length > 0 ? children[0].getRoot() : null;

    // only update the children if the root node has changed
    var rootNode = this.source_.getRootNode();
    if (currentRoot !== rootNode) {
      // remove existing listener
      if (this.rootListenKey_) {
        goog.events.unlistenByKey(this.rootListenKey_);
        this.rootListenKey_ = undefined;
      }

      var showRoot = true;
      var layer = this.getLayer();
      if (layer instanceof plugin.file.kml.KMLLayer) {
        showRoot = layer.showRoot;
      }

      if (rootNode) {
        if (showRoot) {
          // we are showing all of the children of the kml root node
          this.setChildren(rootNode.getChildren());
        } else {
          // we are not showing the children of the kml root node, so we must listen for change events to update the
          // displayed children
          this.updateFromRoot_();
          this.rootListenKey_ = rootNode.listen(goog.events.EventType.PROPERTYCHANGE, this.onRootChange_, false, this);
        }
      } else {
        this.setChildren(null);
      }
    }
  }
};


/**
 * Handle changes to the KML root node when it isn't being displayed in the tree.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.file.kml.ui.KMLLayerNode.prototype.onRootChange_ = function(event) {
  var p = event.getProperty();
  if (p == 'children') {
    this.updateFromRoot_();
  }
};


/**
 * Updates the tree from the root node.
 * @private
 */
plugin.file.kml.ui.KMLLayerNode.prototype.updateFromRoot_ = function() {
  var rootNode = this.source_ ? this.source_.getRootNode() : null;

  var children = null;
  if (rootNode) {
    if (rootNode.getLabel() == 'kmlroot') {
      // a main kml root node exists, go down one more layer to get to the nodes we care about
      children = rootNode.getChildren()[0].getChildren();
    } else {
      // there was no parsed kml root node...just proceed
      children = rootNode.getChildren();
    }
  }

  // do not reparent the children
  this.setChildren(children, true);
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLLayerNode.prototype.getExtent = function() {
  var extent = null;

  var children = this.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var cExtent = /** @type {plugin.file.kml.ui.KMLNode} */ (children[i]).getExtent();

      if (cExtent) {
        if (!extent) {
          extent = cExtent;
        } else {
          ol.extent.extend(extent, cExtent);
        }
      }
    }
  }

  return extent;
};

