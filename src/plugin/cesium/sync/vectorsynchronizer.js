goog.provide('plugin.cesium.sync.VectorSynchronizer');

goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('os.MapEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.layer.PropertyChange');
goog.require('os.source.PropertyChange');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('plugin.cesium.sync.CesiumSynchronizer');
goog.require('plugin.cesium.sync.FeatureConverter');


/**
 * Synchronizes a single OpenLayers vector layer to Cesium.
 *
 * @param {!ol.layer.Vector} layer The vector layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @param {plugin.cesium.sync.FeatureConverter=} opt_converter
 * @extends {plugin.cesium.sync.CesiumSynchronizer<os.layer.Vector>}
 * @constructor
 */
plugin.cesium.sync.VectorSynchronizer = function(layer, map, scene, opt_converter) {
  plugin.cesium.sync.VectorSynchronizer.base(this, 'constructor', layer, map, scene);

  /**
   * @type {!plugin.cesium.sync.FeatureConverter}
   * @protected
   */
  this.converter = opt_converter || new plugin.cesium.sync.FeatureConverter(scene);

  /**
   * @type {plugin.cesium.VectorContext}
   * @protected
   */
  this.csContext = null;

  /**
   * @type {ol.source.Vector}
   * @protected
   */
  this.source = this.layer.getSource();
  if (this.source instanceof os.source.Vector) {
    this.converter.setAltitudeMode(this.source.getAltitudeMode());
  }

  /**
   * @type {number}
   * @private
   */
  this.zIndex_ = 1;

  /**
   * @type {number}
   * @private
   */
  this.zIndexMax_ = 1;
};
goog.inherits(plugin.cesium.sync.VectorSynchronizer, plugin.cesium.sync.CesiumSynchronizer);


/**
 * Layer properties that should trigger a refresh.
 * @type {!Array<string>}
 * @private
 * @const
 */
plugin.cesium.sync.VectorSynchronizer.REFRESH_PROPERTIES_ = [
  os.layer.PropertyChange.LABEL_VISIBILITY,
  os.layer.PropertyChange.STYLE
];


/**
 * @inheritDoc
 */
plugin.cesium.sync.VectorSynchronizer.prototype.disposeInternal = function() {
  this.disposeLayerPrimitives_();
  this.source = null;

  plugin.cesium.sync.VectorSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.VectorSynchronizer.prototype.synchronize = function() {
  this.disposeLayerPrimitives_();
  this.createLayerPrimitives_();
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.VectorSynchronizer.prototype.reset = function() {
  if (this.source) {
    this.resetFeatures_(this.source.getFeatures(), true);
  }
};


/**
 * Create Cesium primitives for the OpenLayers vector layer.
 *
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.createLayerPrimitives_ = function() {
  goog.asserts.assertInstanceof(this.layer, ol.layer.Vector);
  goog.asserts.assert(this.view !== null);

  this.csContext = this.converter.olVectorLayerToCesium(this.layer, this.view);
  this.onLayerVisibility_();

  if (this.csContext) {
    // add the primitive collection to Cesium and initialize all features in the source
    this.initializePrimitives_(this.source.getFeatures());
    this.scene.primitives.add(this.csContext.collection);
    this.scene.groundPrimitives.add(this.csContext.groundCollection);

    // add layer listeners
    ol.events.listen(this.layer, 'change:visible', this.onLayerVisibility_, this);
    ol.events.listen(this.layer, 'change:opacity', this.onLayerOpacity_, this);
    ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

    // add source listeners
    ol.events.listen(this.source, ol.source.VectorEventType.CHANGEFEATURE, this.onChangeFeature_, this);

    if (this.source instanceof os.source.Vector) {
      ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    } else {
      // sources will handle the below using property change events
      ol.events.listen(this.source, ol.source.VectorEventType.ADDFEATURE, this.onAddFeature_, this);
      ol.events.listen(this.source, ol.source.VectorEventType.REMOVEFEATURE, this.onRemoveFeature_, this);
      ol.events.listen(this.source, ol.source.VectorEventType.CLEAR, this.clearFeatures_, this);
    }
  }
};


/**
 * Dispose of all Cesium primitives.
 *
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.disposeLayerPrimitives_ = function() {
  if (this.csContext) {
    // clean up layer listeners
    ol.events.unlisten(this.layer, 'change:visible', this.onLayerVisibility_, this);
    ol.events.unlisten(this.layer, 'change:opacity', this.onLayerOpacity_, this);
    ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

    // clean up source listeners
    ol.events.unlisten(this.source, ol.source.VectorEventType.CHANGEFEATURE, this.onChangeFeature_, this);
    ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);

    // sources don't listen to these events (see above)
    if (!(this.source instanceof os.source.Vector)) {
      ol.events.unlisten(this.source, ol.source.VectorEventType.ADDFEATURE, this.onAddFeature_, this);
      ol.events.unlisten(this.source, ol.source.VectorEventType.REMOVEFEATURE, this.onRemoveFeature_, this);
      ol.events.unlisten(this.source, ol.source.VectorEventType.CLEAR, this.clearFeatures_, this);
    }

    // remove the primitive collection from Cesium. this will cascade the destroy to the layer primitives.
    this.csContext.dispose();
    this.scene.primitives.remove(this.csContext.collection);
    this.scene.groundPrimitives.remove(this.csContext.groundCollection);
    this.csContext = null;

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @param {ol.Object.Event=} opt_event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onLayerVisibility_ = function(opt_event) {
  if (this.csContext && this.layer) {
    // hide the collection on the context
    this.csContext.collection.show = this.layer.getVisible();
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * Handle style changes to the layer, updating all features.
 *
 * @param {goog.events.Event} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onLayerOpacity_ = function(event) {
  if (this.source) {
    this.refreshFeatures_(this.source.getFeatures());
  }
};


/**
 * Handle property change event from the source.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
  goog.asserts.assertInstanceof(this.layer, os.layer.Vector, 'not an os layer');

  var p;
  try {
    // openlayers' ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure
    // the event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  if (this.source && p && plugin.cesium.sync.VectorSynchronizer.REFRESH_PROPERTIES_.indexOf(p) > -1) {
    var features = /** @type {Array<!ol.Feature>} */ (event.getNewValue() || this.source.getFeatures());
    this.refreshFeatures_(features);
  }
};


/**
 * Handle feature add event from the source.
 *
 * @param {ol.source.Vector.Event} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onAddFeature_ = function(event) {
  var feature = event.feature;
  goog.asserts.assert(feature != null);
  this.addFeature(feature);
};


/**
 * Handle feature remove event from the source.
 *
 * @param {ol.source.Vector.Event} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onRemoveFeature_ = function(event) {
  var feature = event.feature;
  goog.asserts.assert(feature != null);
  this.removeFeature(feature);
};


/**
 * Handle feature change event from the source.
 *
 * @param {ol.source.Vector.Event} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onChangeFeature_ = function(event) {
  var feature = event.feature;
  goog.asserts.assert(feature != null);
  this.updateFeature_(feature);
};


/**
 * Handle clear event from the source.
 *
 * @param {ol.source.Vector.Event=} opt_event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.clearFeatures_ = function(opt_event) {
  goog.object.forEach(this.csContext.featureToCesiumMap, function(val, key) {
    this.removeFeature(key);
  }, this);
};


/**
 * Handle property change event from the source.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.onSourcePropertyChange_ = function(event) {
  var p;
  try {
    // openlayers' ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure
    // the event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  var source = /** @type {os.source.Vector} */ (this.source);

  switch (p) {
    case os.source.PropertyChange.CLEARED:
      this.clearFeatures_();
      break;
    case os.source.PropertyChange.FEATURE_VISIBILITY:
      // ignore visibility events if visibility is being controlled by the timeline. animation frame events will update
      // primitive visibility below.
      if (!source.getTimeEnabled() || !source.getAnimationEnabled()) {
        // handle visibility toggled via the list tool or other means
        var features = /** @type {Array<!ol.Feature>} */ (event.getNewValue());
        if (features) {
          for (var i = 0, n = features.length; i < n; i++) {
            var feature = features[i];
            if (feature && !feature.isDisposed()) {
              var shown = !source.isHidden(feature);
              this.updatePrimitiveVisibility_(feature, shown);
            }
          }
        }
      }
      break;
    case os.source.PropertyChange.ANIMATION_FRAME:
      // each frame fires a map of features that changed visibility
      var showChangeMap = /** @type {Object<number, boolean>} */ (event.getNewValue());
      if (showChangeMap) {
        goog.object.forEach(showChangeMap, function(shown, id) {
          var feature = source.getFeatureById(id);
          if (feature) {
            this.updatePrimitiveVisibility_(feature, shown);
          }
        }, this);
      }
      break;
    case os.source.PropertyChange.ALTITUDE:
      if (this.source instanceof os.source.Vector) {
        this.converter.setAltitudeMode(this.source.getAltitudeMode());
        this.refreshFeatures_(source.getFeatures());
      }
      break;
    case os.source.PropertyChange.ANIMATION_ENABLED:
      // when animation is enabled, hide all currently displayed features. when disabled, show all features that
      // match the current filter.
      this.initializePrimitives_(source.getFeatures());
      break;
    case os.source.PropertyChange.FEATURES:
      // handle new features added to the source
      var added = /** @type {Array<!ol.Feature>} */ (event.getNewValue());
      if (added) {
        for (var i = 0, n = added.length; i < n; i++) {
          this.addFeature(added[i]);
        }
      }

      // handle features removed from the source
      var removed = /** @type {Array<!ol.Feature>} */ (event.getOldValue());
      if (removed) {
        for (var i = 0, n = removed.length; i < n; i++) {
          this.removeFeature(removed[i]);
        }

        this.csContext.pruneMaps();
      }
      break;
    case os.source.PropertyChange.HIGHLIGHTED_ITEMS:
      var oldVal = /** @type {Array<!ol.Feature>} */ (event.getOldValue());
      if (oldVal) {
        this.updateHighlightedItems_(oldVal, false);
      }

      var newVal = /** @type {Array<!ol.Feature>} */ (event.getNewValue());
      if (newVal) {
        this.updateHighlightedItems_(newVal, true);
      }
      break;
    case os.events.SelectionType.ADDED:
    case os.events.SelectionType.REMOVED:
    case os.events.SelectionType.CHANGED:
      var shape = source.getGeometryShape();
      var isSelectedShape = shape.match(os.style.SELECTED_REGEXP);

      var features = /** @type {Array<!ol.Feature>} */ (event.getNewValue());
      if (isSelectedShape) {
        this.resetFeatures_(features);
      } else {
        this.refreshFeatures_(features);
      }

      if (p == os.events.SelectionType.CHANGED) {
        features = /** @type {Array<!ol.Feature>} */ (event.getOldValue());
        if (isSelectedShape) {
          this.resetFeatures_(features);
        } else {
          this.refreshFeatures_(features);
        }
      }
      break;
    case os.source.PropertyChange.GEOMETRY_SHAPE:
    case os.source.PropertyChange.GEOMETRY_CENTER_SHAPE:
      var oldVal = /** @type {string|undefined} */ (event.getOldValue());
      var newVal = /** @type {string|undefined} */ (event.getNewValue());
      if (os.style.ELLIPSE_REGEXP.test(newVal) || os.style.ELLIPSE_REGEXP.test(oldVal) ||
        os.style.LOB_REGEXP.test(newVal) || os.style.LOB_REGEXP.test(oldVal)) {
        // until we support something other than points in Cesium, only do this when changing to/from ellipse and lob
        var features = source.getFeatures();
        this.resetFeatures_(features);
      }
      break;
    default:
      break;
  }
};


/**
 * Refreshes the Cesium primitive style for a set of features.
 *
 * @param {!ol.Feature} feature The features to refresh
 * @private
 *
 * @suppress {accessControls|checkTypes} To allow checking if the feature exists on the source without a function call.
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updateFeature_ = function(feature) {
  // make sure the feature is still on the source in case an update was triggered post-removal
  if (this.view && this.csContext && this.source && this.source.idIndex_[feature.id_] != null) {
    var resolution = this.view.getResolution();
    if (resolution != null) {
      this.converter.convert(feature, resolution, this.csContext);

      // added to fix initial primitive.show state when the geometry changes on a feature
      // putting this in featureconverter causes ellipse flickers
      if (this.source instanceof os.source.Vector &&
          (!this.source.getTimeEnabled() || !this.source.getAnimationEnabled())) {
        this.initializePrimitives_([feature]);
      }

      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};


/**
 * Refreshes the Cesium primitive style for a set of features.
 *
 * @param {Array<!ol.Feature>} features The features to refresh
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.refreshFeatures_ = function(features) {
  if (this.active) {
    for (var i = 0, n = features.length; i < n; i++) {
      this.updateFeature_(features[i]);
    }
  }
};


/**
 * Removes and adds features so their Cesium objects are recreated.
 *
 * @param {Array<ol.Feature>} features The features to reset
 * @param {boolean=} opt_force If the reset should be forced
 * @private
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.resetFeatures_ = function(features, opt_force) {
  if (this.active || opt_force) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      goog.asserts.assert(feature !== null);

      var prims = this.csContext.featureToCesiumMap[feature['id']];
      var shown = prims && prims.length > 0 && plugin.cesium.VectorContext.isShown(prims[0]);
      this.removeFeature(feature);
      this.addFeature(feature);

      // set the show value based on the previous primitive
      this.updatePrimitiveVisibility_(feature, shown);
    }

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @param {!ol.Feature} feature
 * @protected
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.addFeature = function(feature) {
  goog.asserts.assert(this.view !== null);
  goog.asserts.assert(this.csContext !== null);

  this.updateFeature_(feature);

  var featureId = feature['id'];
  var primitives = this.csContext.featureToCesiumMap[featureId];
  if (primitives) {
    for (var i = 0, n = primitives.length; i < n; i++) {
      this.initializePrimitive(primitives[i], feature);
    }

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  } else {
    // primitive(s) haven't been created, so mark if they should be shown on creation. this typically happens when an
    // icon needs to be loaded prior to creating a billboard.
    this.csContext.featureToShownMap[featureId] = this.shouldShowFeature(feature);
  }
};


/**
 * @param {ol.Feature|number|string} feature Feature or feature id.
 * @protected
 */
plugin.cesium.sync.VectorSynchronizer.prototype.removeFeature = function(feature) {
  if (typeof feature === 'number' || typeof feature === 'string') {
    feature = this.source.getFeatureById(feature);
  }

  if (feature !== null && this.csContext) {
    this.csContext.cleanup(feature);
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * Check if a feature is hidden on the source.
 *
 * @param {!ol.Feature} feature The OpenLayers feature
 * @return {boolean} If the feature is hidden on the source.
 * @protected
 */
plugin.cesium.sync.VectorSynchronizer.prototype.shouldShowFeature = function(feature) {
  if (this.source instanceof os.source.Vector) {
    //
    // show the feature if:
    //  - it is not hidden
    //  - the source is not time enabled, or it is not in the animating state
    //
    // when vector sources are animating, they will fire animation events to update feature visibility. all features
    // should initialize to hidden and their visibility will update as these events are fired.
    //
    return !this.source.isHidden(feature) && (!this.source.getTimeEnabled() || !this.source.getAnimationEnabled());
  }

  return false;
};


/**
 * Performs initialization actions on a Cesium primitive.
 *
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 * @param {!ol.Feature} feature The OpenLayers feature
 * @protected
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.initializePrimitive = function(primitive, feature) {
  if (this.source instanceof os.source.Vector) {
    var featureId = feature['id'];
    this.csContext.featureToShownMap[featureId] = this.shouldShowFeature(feature);
    plugin.cesium.VectorContext.setShow(primitive, this.csContext.featureToShownMap[featureId]);
    this.setPrimEyeOffset_(primitive);
  }
};


/**
 * Refreshes the Cesium primitive style for a set of features.
 *
 * @param {Array<!ol.Feature>} features The features to refresh
 * @private
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.initializePrimitives_ = function(features) {
  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];
    if (feature) {
      var primitives = this.csContext.featureToCesiumMap[feature['id']];
      if (primitives) {
        for (var j = 0, k = primitives.length; j < k; j++) {
          this.initializePrimitive(primitives[j], feature);
        }
      }
    }
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @param {Array<!ol.Feature>} features
 * @param {boolean} value
 * @private
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updateHighlightedItems_ = function(features, value) {
  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];

    // update first to ensure the label primitive has been created
    this.updateFeature_(feature);

    // now update the eye offset
    var prims = this.csContext.featureToCesiumMap[feature['id']];
    if (prims) {
      for (var j = 0, k = prims.length; j < k; j++) {
        this.setFeatureHighlight_(prims[j], value);
      }
    }
  }
};


/**
 * Update the eye offsets of all labels in the collection.
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updateLabelOffsets = function() {
  var camera = os.MapContainer.getInstance().getWebGLCamera();
  if (camera) {
    // Find the z-index step from the camera altitude
    var cameraDistance = camera.getDistanceToCenter();
    var zIndexStep = Math.round(cameraDistance / (this.zIndexMax_ * 10));
    var newOffset = -(this.zIndex_ * zIndexStep);
    this.converter.setLabelEyeOffsetDefault(new Cesium.Cartesian3(0.0, 0.0, newOffset));

    if (this.csContext && this.csContext.labels) {
      for (var i = 0, ii = this.csContext.labels.length; i < ii; i++) {
        var label = this.csContext.labels.get(i);
        if (label) {
          this.converter.setLabelEyeOffset(label, this.scene);
        }
      }
    }
  }
};


/**
 * @param {!ol.Feature} feature The OpenLayers feature or feature id to update
 * @param {boolean} shown If the feature is shown
 * @private
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updatePrimitiveVisibility_ = function(feature, shown) {
  // There are some cases where the primitives are created asynchronously (icon primitives mostly), and thus
  // it is possible to get this event before they exist. Therefore, we'll store it on another map and use that
  // when creating it.
  this.csContext.featureToShownMap[feature['id']] = shown;

  var primitives = this.csContext.featureToCesiumMap[feature['id']];
  if (primitives) {
    for (var i = 0, n = primitives.length; i < n; i++) {
      var primitive = primitives[i];
      plugin.cesium.VectorContext.setShow(primitive, shown);
    }

    if (shown) {
      this.updateFeature_(feature);
    }
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @param {!Cesium.PrimitiveLike} prim
 * @param {boolean} value
 * @private
 *
 * @todo Only Billboards/Labels have eyeOffset support. What if this is a line or polygon?
 */
plugin.cesium.sync.VectorSynchronizer.prototype.setFeatureHighlight_ = function(prim, value) {
  var camera = /** @type {plugin.cesium.Camera} */ (os.MapContainer.getInstance().getWebGLCamera());

  if (prim instanceof Cesium.Billboard) {
    if (value && camera) {
      // boost the feature so it's rendered on top of others nearby. don't allow the offset to exceed the camera
      // distance or the feature will not appear on the screen.
      var cameraDistance = camera.getDistanceToPosition(prim.position);
      if (cameraDistance != null) {
        prim.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, -cameraDistance * 0.67);
      }
    } else {
      // reset the eye offset to the default
      prim.eyeOffset = this.converter.getEyeOffset();
    }
  } else if (prim instanceof Cesium.Label) {
    if (value && this.scene && camera) {
      var cameraDistance = camera.getDistanceToPosition(prim.position);
      if (cameraDistance != null) {
        this.converter.setLabelEyeOffset(prim, this.scene, new Cesium.Cartesian3(0.0, 0.0, -cameraDistance * 0.67));
      }
    } else {
      // reset the eye offset to the default
      this.converter.setLabelEyeOffset(prim, this.scene);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.VectorSynchronizer.prototype.reposition = function(start, end) {
  if (this.zIndex_ != start || this.zIndexMax_ != end) {
    this.zIndex_ = start;
    this.zIndexMax_ = end;
    this.updateLabelOffsets();
    this.updateBillboardOffsets();
  }

  // return the next vector layer index
  return ++start;
};


/**
 * Update the billboard offsets
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updateBillboardOffsets = function() {
  var camera = os.MapContainer.getInstance().getWebGLCamera();
  if (camera) {
    // Find the z-index step from the camera altitude
    var cameraDistance = camera.getDistanceToCenter();
    var zIndexStep = Math.round(cameraDistance / (this.zIndexMax_ * 100));
    var newOffset = -(this.zIndex_ * zIndexStep);

    if (newOffset != this.converter.getEyeOffset()['z']) {
      this.converter.setEyeOffset(new Cesium.Cartesian3(0.0, 0.0, newOffset));

      var features = this.source.getFeatures();
      for (var i = 0, n = features.length; i < n; i++) {
        this.setEyeOffset_(features[i]);
      }
    }
  }
};


/**
 * Updates labels and billboards after the Cesium camera changes.
 *
 * @inheritDoc
 */
plugin.cesium.sync.VectorSynchronizer.prototype.updateFromCamera = function() {
  this.updateLabelOffsets();
  this.updateBillboardOffsets();
  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @param {ol.Feature} feature
 * @private
 * @suppress {checkTypes}
 */
plugin.cesium.sync.VectorSynchronizer.prototype.setEyeOffset_ = function(feature) {
  var prims = this.csContext.featureToCesiumMap[feature['id']];
  if (prims) {
    for (var i = 0, j = prims.length; i < j; i++) {
      this.setPrimEyeOffset_(prims[i]);
    }
  }
};


/**
 * Set the eyeOffset
 *
 * @param {!Cesium.PrimitiveLike} prim The Cesium primitive
 * @private
 */
plugin.cesium.sync.VectorSynchronizer.prototype.setPrimEyeOffset_ = function(prim) {
  if (prim instanceof Cesium.Billboard) {
    prim.eyeOffset = this.converter.getEyeOffset();
  }
};
