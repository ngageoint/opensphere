goog.provide('plugin.file.kml.ui.KMLNode');
goog.provide('plugin.file.kml.ui.KMLNodeAction');

goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('os.data.IExtent');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriState');
goog.require('os.ui.featureInfoDirective');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('plugin.file.kml.ui.GeometryIcons');
goog.require('plugin.file.kml.ui.kmlNodeUIDirective');


/**
 * KML node actions
 * @enum {string}
 */
plugin.file.kml.ui.KMLNodeAction = {
  FEATURE_INFO: 'featureInfo'
};



/**
 * Base KML tree node
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.ISearchable}
 * @implements {os.data.IExtent}
 * @constructor
 */
plugin.file.kml.ui.KMLNode = function() {
  plugin.file.kml.ui.KMLNode.base(this, 'constructor');
  this.nodeUI = '<kmlnodeui></kmlnodeui>';

  // KML nodes should save their collapsed state in the file content if needed because their getId values are not
  // reliable for saving collapsed state.
  this.saveCollapsed = false;

  // default KML nodes to being turned on
  this.setState(os.structs.TriState.ON);

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = plugin.file.kml.ui.KMLNode.LOGGER_;

  /**
   * If children can be added to the node.
   * @type {boolean}
   */
  this.canAddChildren = false;

  /**
   * If the node can be edited by the user.
   * @type {boolean}
   */
  this.editable = false;

  /**
   * If the node can be removed by the user.
   * @type {boolean}
   */
  this.removable = false;

  /**
   * If the node is loading.
   * @type {boolean}
   * @protected
   */
  this.loading = false;

  /**
   * If the node is marked for removal.
   * @type {boolean}
   */
  this.marked = false;

  /**
   * The kml ground image
   * @type {os.layer.Image}
   * @private
   */
  this.image_ = null;

  /**
   * The kml screen overlay window ID
   * @type {?string}
   * @private
   */
  this.overlay_ = null;

  /**
   * The map feature
   * @type {ol.Feature}
   * @private
   */
  this.feature_ = null;

  /**
   * Flag to track when the mouse is hovering a feature node
   * @type {boolean}
   * @private
   */
  this.highlight_ = false;

  /**
   * The KML source
   * @type {plugin.file.kml.KMLSource}
   * @protected
   */
  this.source = null;

  /**
   * If the source should be updated on state change
   * @type {boolean}
   * @private
   */
  this.updateSource_ = true;

  /**
   * @type {Object<string, !Array<!plugin.file.kml.ui.KMLNode>>}
   * @protected
   */
  this.childLabelMap = {};
};
goog.inherits(plugin.file.kml.ui.KMLNode, os.ui.slick.SlickTreeNode);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.ui.KMLNode.LOGGER_ = goog.log.getLogger('plugin.file.kml.ui.KMLNode');


/**
 * Tree events that should be handled while the source is loading. Handling all events while loading will result in
 * the Layers window hanging.
 * @type {!Array<string>}
 * @private
 * @const
 */
plugin.file.kml.ui.KMLNode.CHILD_LOADING_EVENTS_ = ['children', 'state', 'collapsed'];


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.disposeInternal = function() {
  plugin.file.kml.ui.KMLNode.base(this, 'disposeInternal');

  this.feature_ = null;
  this.image_ = null;
  this.source = null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.canDropInternal = function(dropItem, moveMode) {
  return dropItem.isFolder() || moveMode == os.ui.slick.SlickTreeNode.MOVE_MODE.SIBLING;
};


/**
 * Get the feature for this node.
 * @return {ol.Feature} The feature
 */
plugin.file.kml.ui.KMLNode.prototype.getFeature = function() {
  return this.feature_;
};


/**
 * Set the feature for this node.
 * @param {ol.Feature} feature The feature
 */
plugin.file.kml.ui.KMLNode.prototype.setFeature = function(feature) {
  if (this.feature_) {
    ol.events.unlisten(this.feature_, goog.events.EventType.PROPERTYCHANGE, this.onFeatureChange, this);
  }

  this.feature_ = feature;

  if (this.feature_) {
    ol.events.listen(this.feature_, goog.events.EventType.PROPERTYCHANGE, this.onFeatureChange, this);
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent('icons'));
  this.dispatchEvent(new os.events.PropertyChangeEvent('label'));
};


/**
 * Handle property change events fired on a feature.
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event The change event.
 * @protected
 */
plugin.file.kml.ui.KMLNode.prototype.onFeatureChange = function(event) {
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p === 'loading') {
      this.setLoading(!!event.getNewValue());
    }
  }
};


/**
 * If the node has one or more features beneath it.
 * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false.
 * @return {boolean} If the node has one or more features beneath it.
 */
plugin.file.kml.ui.KMLNode.prototype.hasFeatures = function(opt_unchecked) {
  if (this.feature_) {
    return true;
  }

  var children = this.getChildren();
  return !!children && children.some(function(child) {
    return (opt_unchecked || child.getState() != os.structs.TriState.OFF) && child.hasFeatures(opt_unchecked);
  });
};


/**
 * Get the feature(s) associated with this node.
 * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false.
 * @return {!Array<!ol.Feature>} The features
 */
plugin.file.kml.ui.KMLNode.prototype.getFeatures = function(opt_unchecked) {
  if (this.feature_) {
    return [this.feature_];
  }

  var features = [];
  var children = this.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var node = children[i];
      if (node.getState() != os.structs.TriState.OFF || opt_unchecked) {
        // unchecked nodes are hidden from the map so exclude them unless the flag is set.
        var childFeatures = node.getFeatures(opt_unchecked);
        if (childFeatures) {
          features = features.concat(childFeatures);
        }
      }
    }
  }

  return features;
};


/**
 * Get the image layer for this node.
 * @return {os.layer.Image} The feature
 */
plugin.file.kml.ui.KMLNode.prototype.getImage = function() {
  return this.image_;
};


/**
 * Set the image layer for this node.
 * @param {os.layer.Image} image The feature
 */
plugin.file.kml.ui.KMLNode.prototype.setImage = function(image) {
  if (this.image_) {
    ol.events.unlisten(this.image_, goog.events.EventType.PROPERTYCHANGE, this.onImagePropertyChange, this);
  }

  this.image_ = image;

  if (this.image_) {
    ol.events.listen(this.image_, goog.events.EventType.PROPERTYCHANGE, this.onImagePropertyChange, this);
    this.setState(this.image_.getLayerVisible() ? os.structs.TriState.ON : os.structs.TriState.OFF);
  }
};


/**
 * @param {os.events.PropertyChangeEvent} e The event
 * @protected
 */
plugin.file.kml.ui.KMLNode.prototype.onImagePropertyChange = function(e) {
  if (e instanceof os.events.PropertyChangeEvent) {
    var p = e.getProperty();
    if (p === os.layer.PropertyChange.VISIBLE) {
      this.setState(e.getNewValue() ? os.structs.TriState.ON : os.structs.TriState.OFF);
    }
  }
};


/**
 * Get the overlay window for this node.
 * @return {?string} The overlay window ID
 */
plugin.file.kml.ui.KMLNode.prototype.getOverlay = function() {
  return this.overlay_;
};


/**
 * Set the overlay window for this node.
 * @param {string} overlay The overlay window ID
 */
plugin.file.kml.ui.KMLNode.prototype.setOverlay = function(overlay) {
  this.overlay_ = overlay;
};


/**
 * Get the images(s) associated with this node.
 * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false
 * @return {!Array<!os.layer.Image>} The image layers
 */
plugin.file.kml.ui.KMLNode.prototype.getImages = function(opt_unchecked) {
  if (this.image_) {
    return [this.image_];
  }

  var images = [];
  var children = this.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var node = children[i];
      if (node.getState() != os.structs.TriState.OFF || opt_unchecked) {
        // unchecked nodes are hidden from the map so exclude them unless the flag is set.
        var childImages = node.getImages(opt_unchecked);
        if (childImages) {
          images = images.concat(childImages);
        }
      }
    }
  }

  return images;
};


/**
 * Get the overlay(s) associated with this node.
 * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false
 * @return {!Array<!string>} The overlay window IDs
 */
plugin.file.kml.ui.KMLNode.prototype.getOverlays = function(opt_unchecked) {
  if (this.overlay_) {
    return [this.overlay_];
  }

  var overlays = [];
  var children = this.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var node = children[i];
      if (node.getState() != os.structs.TriState.OFF || opt_unchecked) {
        // unchecked nodes are hidden from the map so exclude them unless the flag is set.
        var childOverlays = node.getOverlays(opt_unchecked);
        if (childOverlays) {
          overlays = overlays.concat(childOverlays);
        }
      }
    }
  }

  return overlays;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.getExtent = function() {
  var extent = null;

  if (this.image_) {
    extent = this.image_.getExtent();
    if (!extent) {
      extent = null;
    }
  } else {
    var features = this.getFeatures();
    if (features && features.length) {
      extent = ol.extent.createEmpty();
      for (var i = 0, n = features.length; i < n; i++) {
        var geometry = features[i].getGeometry();
        if (goog.isDefAndNotNull(geometry)) {
          ol.extent.extend(extent, geometry.getExtent());
        }
      }
    }
  }

  return extent;
};


/**
 * Returns an appropriate ID based on the type of KML node this is, or the base class version.
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.getId = function() {
  var id;
  if (this.feature_) {
    id = this.feature_.getId();
    if (id) {
      return id.toString();
    }
  }

  if (this.image_) {
    id = this.image_.getId();
    if (id) {
      return id;
    }
  }

  if (this.overlay_) {
    return this.overlay_;
  }

  return plugin.file.kml.ui.KMLNode.base(this, 'getId');
};


/**
 * Whether or not the KML node is loading.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLNode.prototype.isLoading = function() {
  return this.loading;
};
goog.exportProperty(
    plugin.file.kml.ui.KMLNode.prototype,
    'isLoading',
    plugin.file.kml.ui.KMLNode.prototype.isLoading);


/**
 * Set if the node is loading.
 * @param {boolean} value The new value
 * @protected
 */
plugin.file.kml.ui.KMLNode.prototype.setLoading = function(value) {
  if (this.loading != value) {
    this.loading = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', value, !value));
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.getSearchText = function() {
  return this.getLabel() || '';
};


/**
 * Get the KML source associated with the node.
 * @return {plugin.file.kml.KMLSource}
 */
plugin.file.kml.ui.KMLNode.prototype.getSource = function() {
  return this.source;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.getTags = function() {
  return null;
};


/**
 * The KML merge requires quick access to the node. Also, the KML parser does not produce consistent
 * IDs for the nodes on subsequent runs. Therefore, the label is going to be used for the index. To
 * support multiple items with the same label, the index points to a list of those items.
 */


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.index = function(child) {
  var label = child.getLabel() || '';

  if (child instanceof plugin.file.kml.ui.KMLNode) {
    if (!(label in this.childLabelMap)) {
      this.childLabelMap[label] = [];
    }

    this.childLabelMap[label].push(child);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.unindex = function(child) {
  var label = child.getLabel() || '';

  if (label in this.childLabelMap) {
    var list = /** @type {Array<plugin.file.kml.ui.KMLNode>} */ (this.childLabelMap[label]);

    var x = list.indexOf(/** @type {plugin.file.kml.ui.KMLNode} */ (child));
    if (x > -1) {
      list.splice(x, 1);
    }

    if (list.length === 0) {
      delete this.childLabelMap[label];
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.hasChild = function(child) {
  var label = child.getLabel() || '';
  if (label in this.childLabelMap) {
    return /** @type {Array<plugin.file.kml.ui.KMLNode>} */ (
        this.childLabelMap[label]).indexOf(/** @type {plugin.file.kml.ui.KMLNode} */ (child)) !== -1;
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.addChild = function(child, opt_skipaddparent, opt_index) {
  if (child instanceof plugin.file.kml.ui.KMLNode) {
    var previous = this.merge(child);

    if (!previous) {
      return plugin.file.kml.ui.KMLNode.base(this, 'addChild', child, opt_skipaddparent, opt_index);
    }

    return previous;
  }

  goog.log.error(this.log, 'Unable to add non-KML node "' + child.getLabel() + '" to the KML tree!');
  return null;
};


/**
 * @param {!plugin.file.kml.ui.KMLNode} child
 * @return {?plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.ui.KMLNode.prototype.merge = function(child) {
  var children = /** {Array<!plugin.file.kml.ui.KMLNode>|undefined} */ (this.childLabelMap[child.getLabel() || '']);

  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var prevChild = children[i];

      if (prevChild.marked) {
        prevChild.setFeature(child.getFeature());
        prevChild.marked = false;
        prevChild.setId(child.getId());
        return prevChild;
      }
    }
  }

  return null;
};


/**
 * If the node is a KML Folder.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLNode.prototype.isFolder = function() {
  return (this.feature_ == null && this.image_ == null && this.overlay_ == null);
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.formatIcons = function() {
  if (this.isFolder()) {
    var open = this.hasChildren() && !this.collapsed;
    return '<i class="fa fa-folder' + (open ? '-open' : '') + ' fa-fw"></i>';
  } else if (this.image_) {
    return '<i class="fa fa-photo fa-fw compact" title="Ground Overlay"></i>';
  } else if (this.overlay_) {
    return '<i class="fa fa-photo fa-fw compact" title="Screen Overlay"></i>';
  } else {
    // start with the base info icon that will launch a feature info dialog
    var icons = '<i class="fa fa-info-circle fa-fw compact gold-icon pointer" title="Feature Info" ' +
        'ng-click="itemAction(\'' + plugin.file.kml.ui.KMLNodeAction.FEATURE_INFO + '\')"></i>';

    var geom = this.feature_.getGeometry();
    if (geom) {
      // if the node has a geometry, add the geometry icon
      var type = geom.getType();
      if (type in plugin.file.kml.ui.GeometryIcons) {
        var geomIcon = plugin.file.kml.ui.GeometryIcons[type];
        var color = /** @type {string|undefined} */ (os.feature.getColor(this.feature_));
        if (color) {
          // disregard opacity - only interested in displaying the color
          geomIcon = geomIcon.replace('><', ' style="color:' + os.color.toHexString(color) + '"><');
        }

        icons = geomIcon + icons;
      }
    }

    return icons;
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.performAction = function(type) {
  if (type == plugin.file.kml.ui.KMLNodeAction.FEATURE_INFO) {
    if (this.feature_) {
      var title = this.source ? this.source.getTitle() : undefined;
      os.ui.launchFeatureInfo(this.feature_, title);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.onChildChange = function(e) {
  var p = e.getProperty();

  // if the source is loading, filter out which events are handled to avoid excessive tree updates
  if (this.source && this.source.isLoading() &&
      p && plugin.file.kml.ui.KMLNode.CHILD_LOADING_EVENTS_.indexOf(p) == -1) {
    return;
  }

  plugin.file.kml.ui.KMLNode.base(this, 'onChildChange', e);

  if (p == 'collapsed') {
    // propagate the collapsed event up the tree so the KML can be saved if necessary
    this.dispatchEvent(new os.events.PropertyChangeEvent(p));
  } else if (p === 'loading') {
    // propagate loading events up the tree so the layer can show the overall loading state
    this.dispatchEvent(new os.events.PropertyChangeEvent(p, e.getNewValue(), e.getOldValue()));
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.onMouseEnter = function() {
  if (this.feature_ && this.source) {
    // always set this to ensure features are immediately highlighted when enabled via their own checkbox
    this.highlight_ = true;

    if (!this.source.isHidden(this.feature_)) {
      // only highlight the feature if it isn't hidden
      this.source.setHighlightedItems([this.feature_]);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.onMouseLeave = function() {
  if (this.feature_ && this.source) {
    this.highlight_ = false;
    this.source.setHighlightedItems(null);
  }
};


/**
 * Set the KML source for this node.
 * @param {plugin.file.kml.KMLSource} source The source
 */
plugin.file.kml.ui.KMLNode.prototype.setSource = function(source) {
  this.source = source;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.setState = function(value) {
  var old = this.getState();

  plugin.file.kml.ui.KMLNode.base(this, 'setState', value);
  var s = this.getState();

  if (this.getOverlay()) {
    // hide/show the screen overlay window
    var toggle = os.ui.window.toggleVisibility(this.getOverlay());
    if (toggle && s === os.structs.TriState.ON) {
      toggle();
    }
  } else if (old != s && this.updateSource_ && this.source) {
    if (s !== os.structs.TriState.BOTH) {
      this.source.scheduleUpdateFromNodes();

      if (this.highlight_) {
        if (s === os.structs.TriState.ON) {
          // mouse is on a leaf node, so highlight the feature
          this.source.setHighlightedItems([this.feature_]);
        } else {
          // mouse is on a leaf node, so remove the highlight feature
          this.source.setHighlightedItems(null);
        }
      }
    }
  }
};


/**
 * Sets the state without trying to update features on the source. This is used to prevent duplicate source visibility
 * calls when the source caused the state change, or the state is being propagated through the tree.
 * @param {string} value The new state value
 */
plugin.file.kml.ui.KMLNode.prototype.setStateOnly = function(value) {
  this.updateSource_ = false;
  this.setState(value);
  this.updateSource_ = true;
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNode.prototype.updateChild = function(child, state) {
  // avoid changing source visibility when updating children, so the visibility calls aren't massively duplicated. the
  // visibility will be changed at the level toggled by the user, resulting in a single call to the source.
  child.setStateOnly(state);
};


/**
 * Collapses all nodes under the target that do not have children.
 * @param {!plugin.file.kml.ui.KMLNode} target The target node to collapse
 */
plugin.file.kml.ui.KMLNode.collapseEmpty = function(target) {
  var children = target.getChildren();
  if (children && children.length > 0) {
    for (var i = 0, n = children.length; i < n; i++) {
      plugin.file.kml.ui.KMLNode.collapseEmpty(/** @type {!plugin.file.kml.ui.KMLNode} */ (children[i]));
    }
  } else {
    target.collapsed = true;
  }
};
