goog.provide('os.layer.AnimationOverlay');
goog.provide('os.layer.AnimationVector');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.layer.Vector');
goog.require('ol.render.EventType');
goog.require('ol.source.Vector');
goog.require('os.map');


/**
 * @typedef {{
 *   features: (Array<!ol.Feature>|undefined),
 *   map: (ol.PluggableMap|undefined),
 *   style: (ol.style.Style|Array<ol.style.Style>|ol.StyleFunction|undefined),
 *   opacity: (number|undefined),
 *   zIndex: (number|undefined)
 * }}
 */
os.layer.AnimationOverlayOptions;



/**
 * Renders features in a source that has spatial indexing disabled and avoids firing events when the features change.
 * This dramatically increases animation performance by reducing the overhead involved in changing which features are
 * rendered.
 * @param {os.layer.AnimationOverlayOptions=} opt_options Options.
 * @extends {goog.Disposable}
 * @constructor
 */
os.layer.AnimationOverlay = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.features_ = [];

  /**
   * @type {ol.source.Vector}
   * @private
   */
  this.source_ = new ol.source.Vector({
    features: this.features_,
    useSpatialIndex: false
  });

  /**
   * @type {ol.layer.Vector}
   * @private
   */
  this.layer_ = new os.layer.AnimationVector({
    renderOrder: null,
    source: this.source_,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
    zIndex: options.zIndex
  });

  if (options.opacity != null) {
    this.setOpacity(options.opacity);
  }

  if (options.style != null) {
    this.setStyle(options.style);
  }

  if (options.features != null && goog.isArray(options.features)) {
    this.setFeatures(goog.array.clone(options.features));
  }

  if (options.map != null) {
    this.setMap(options.map);
  }
};
goog.inherits(os.layer.AnimationOverlay, goog.Disposable);


/**
 * @inheritDoc
 */
os.layer.AnimationOverlay.prototype.disposeInternal = function() {
  os.layer.AnimationOverlay.base(this, 'disposeInternal');
  this.setMap(null);

  this.features_.length = 0;
  this.source_.dispose();
  this.source_ = null;
  this.layer_.dispose();
  this.layer_ = null;
};


/**
 * Fires a changed event on the source to trigger rendering.
 *
 * Performance note: Do NOT fire events while in 3D mode because this layer will be rendered by the 2D map since it is
 * not in the hidden root layer group.
 */
os.layer.AnimationOverlay.prototype.changed = function() {
  if (this.source_ && os.map.mapContainer && !os.map.mapContainer.is3DEnabled()) {
    this.source_.changed();
  }
};


/**
 * Get the features in the overlay.
 * @return {!Array<!ol.Feature>} Features collection.
 */
os.layer.AnimationOverlay.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * Set the features rendered on the map.
 * @param {Array<!ol.Feature>|undefined} features Features collection.
 */
os.layer.AnimationOverlay.prototype.setFeatures = function(features) {
  // this function modifies the feature array directly instead of modifying the collection. this will prevent events
  // from being fired by the collection, and instead we call changed on the source once after the update.
  this.features_.length = 0;

  if (features && features.length > 0) {
    this.features_.length = features.length;
    for (var i = 0, n = features.length; i < n; i++) {
      this.features_[i] = features[i];
    }
  }

  this.changed();
};


/**
 * Set the map reference on the layer.
 * @param {ol.PluggableMap} map Map.
 */
os.layer.AnimationOverlay.prototype.setMap = function(map) {
  if (this.layer_) {
    this.layer_.setMap(map);
  }
};


/**
 * Set the style for features.  This can be a single style object, an array of styles, or a function that takes a
 * feature and resolution and returns an array of styles.
 * @param {ol.style.Style|Array<ol.style.Style>|ol.StyleFunction} style Overlay style.
 */
os.layer.AnimationOverlay.prototype.setStyle = function(style) {
  if (this.layer_) {
    this.layer_.setStyle(style);
  }
};


/**
 * Sets the overall opacity on the overlay layer.
 * @param {number} value
 */
os.layer.AnimationOverlay.prototype.setOpacity = function(value) {
  if (this.layer_) {
    this.layer_.setOpacity(value);
  }
};


/**
 * Sets the z-index on the overlay layer.
 * @param {number} value
 */
os.layer.AnimationOverlay.prototype.setZIndex = function(value) {
  if (this.layer_) {
    this.layer_.setZIndex(value);
  }
};



/**
 * Vector layer extension created solely for the purpose of z-indexing unmanaged animation layers against each other.
 * @extends {ol.layer.Vector}
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @constructor
 */
os.layer.AnimationVector = function(options) {
  os.layer.AnimationVector.base(this, 'constructor', options);
};
goog.inherits(os.layer.AnimationVector, ol.layer.Vector);


/**
 * Base offset applied to animation vector layers.
 * @type {number}
 * @const
 */
os.layer.AnimationVector.Z_OFFSET = 100000;


/**
 * This function is replaced because the OL3 version sets the zIndex to Infinity, making all unmanaged layers the same.
 * We still want them to appear on top, but be ordered against one another.
 * @inheritDoc
 * @suppress {accessControls}
 */
os.layer.AnimationVector.prototype.setMap = function(map) {
  if (this.mapPrecomposeKey_) {
    ol.events.unlistenByKey(this.mapPrecomposeKey_);
    this.mapPrecomposeKey_ = null;
  }
  if (!map) {
    this.changed();
  }
  if (this.mapRenderKey_) {
    ol.events.unlistenByKey(this.mapRenderKey_);
    this.mapRenderKey_ = null;
  }
  if (map) {
    this.mapPrecomposeKey_ = ol.events.listen(
        map, ol.render.EventType.PRECOMPOSE, function(evt) {
          var layerState = this.getLayerState();
          layerState.managed = false;

          // offset the z-index by a large enough number that it will push these layers to the top, but they will still
          // be ordered against each other
          layerState.zIndex += os.layer.AnimationVector.Z_OFFSET;

          evt.frameState.layerStatesArray.push(layerState);
          evt.frameState.layerStates[ol.getUid(this)] = layerState;
        }, this);
    this.mapRenderKey_ = ol.events.listen(this, ol.events.EventType.CHANGE, map.render, map);
    this.changed();
  }
};
