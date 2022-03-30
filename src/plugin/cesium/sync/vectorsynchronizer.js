goog.declareModuleId('plugin.cesium.sync.VectorSynchronizer');

import {listen, unlistenByKey} from 'ol/src/events.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';
import * as dispatcher from '../../../os/dispatcher.js';
import SelectionType from '../../../os/events/selectiontype.js';
import LayerPropertyChange from '../../../os/layer/propertychange.js';
import VectorLayer from '../../../os/layer/vector.js';
import MapEvent from '../../../os/map/mapevent.js';
import MapContainer from '../../../os/mapcontainer.js';
import SourcePropertyChange from '../../../os/source/propertychange.js';
import VectorSource from '../../../os/source/vectorsource.js';
import {ELLIPSE_REGEXP, LOB_REGEXP, SELECTED_REGEXP} from '../../../os/style/style.js';
import {isPrimitiveShown, setPrimitiveShown} from '../primitive.js';
import VectorContext from '../vectorcontext.js';
import CesiumSynchronizer from './cesiumsynchronizer.js';
import convert from './featureconverter.js';

const asserts = goog.require('goog.asserts');
const EventType = goog.require('goog.events.EventType');
const objectUtils = goog.require('goog.object');


/**
 * Layer properties that should trigger a refresh.
 * @type {!Object<string, boolean>}
 */
const REFRESH_PROPERTIES = {
  [LayerPropertyChange.LABEL_VISIBILITY]: true,
  [LayerPropertyChange.STYLE]: true
};


/**
 * Synchronizes a single OpenLayers vector layer to Cesium.
 * @extends {CesiumSynchronizer<OLVectorLayer>}
 */
export default class VectorSynchronizer extends CesiumSynchronizer {
  /**
   * Synchronizes a single OpenLayers vector layer to Cesium.
   *
   * @param {!OLVectorLayer} layer The vector layer.
   * @param {!PluggableMap} map The OpenLayers map.
   * @param {!Cesium.Scene} scene The Cesium scene.
   */
  constructor(layer, map, scene) {
    super(layer, map, scene);

    /**
     * @type {VectorContext}
     * @protected
     */
    this.csContext = null;

    /**
     * @type {OLVectorSource}
     * @protected
     */
    this.source = this.layer.getSource();

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

    this.visibleListenKey;
    this.opacityListenKey;
    this.layerListenKey;
    this.changeFeatureListenKey;
    this.sourceListenKey;
    this.addFeatureListenKey;
    this.removeFeatureListenKey;
    this.clearListenKey;
  }


  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.disposeLayerPrimitives_();
    this.source = null;

    super.disposeInternal();
  }


  /**
   * @inheritDoc
   */
  synchronize() {
    this.disposeLayerPrimitives_();
    this.createLayerPrimitives_();
  }


  /**
   * @inheritDoc
   */
  reset() {
    if (this.source) {
      this.resetFeatures_(this.source.getFeatures(), true);
    }
  }


  /**
   * Create Cesium primitives for the OpenLayers vector layer.
   *
   * @private
   */
  createLayerPrimitives_() {
    asserts.assertInstanceof(this.layer, OLVectorLayer);
    asserts.assert(this.view !== null);

    this.csContext = this.createVectorContext(this.layer, this.view);
    this.onLayerVisibility_();

    if (this.csContext) {
      this.initializePrimitives_(this.source.getFeatures());

      // add layer listeners
      this.visibleListenKey = listen(this.layer, 'change:visible', this.onLayerVisibility_, this);
      this.opacityListenKey = listen(this.layer, 'change:opacity', this.onLayerOpacity_, this);
      this.layerListenKey = listen(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

      // add source listeners
      this.changeFeatureListenKey = listen(this.source, VectorEventType.CHANGEFEATURE, this.onChangeFeature_, this);

      if (this.source instanceof VectorSource) {
        this.sourceListenKey = listen(this.source, EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
      } else {
        // sources will handle the below using property change events
        this.addFeatureListenKey = listen(this.source, VectorEventType.ADDFEATURE, this.onAddFeature_, this);
        this.removeFeatureListenKey = listen(this.source, VectorEventType.REMOVEFEATURE, this.onRemoveFeature_, this);
        this.clearListenKey = listen(this.source, VectorEventType.CLEAR, this.clearFeatures_, this);
      }
    }
  }

  /**
   * @param {!OLVectorLayer} layer
   * @param {!View} view
   * @return {!VectorContext}
   * @protected
   */
  createVectorContext(layer, view) {
    const projection = view.getProjection();
    const resolution = view.getResolution();
    if (projection == null || resolution === undefined) {
      // an assertion is not enough for closure to assume resolution and projection are defined
      throw new Error('view not ready');
    }

    const context = new VectorContext(this.scene, layer, projection);
    const features = layer.getSource().getFeatures();
    for (let i = 0, n = features.length; i < n; i++) {
      const feature = features[i];
      if (feature) {
        convert(feature, resolution, context);
      }
    }

    return context;
  }


  /**
   * Dispose of all Cesium primitives.
   *
   * @private
   */
  disposeLayerPrimitives_() {
    if (this.csContext) {
      // clean up layer listeners
      unlistenByKey(this.visibleListenKey);
      unlistenByKey(this.opacityListenKey);
      unlistenByKey(this.layerListenKey);

      // clean up source listeners
      unlistenByKey(this.changeFeatureListenKey);
      unlistenByKey(this.sourceListenKey);

      // sources don't listen to these events (see above)
      if (!(this.source instanceof VectorSource)) {
        unlistenByKey(this.addFeatureListenKey);
        unlistenByKey(this.removeFeatureListenKey);
        unlistenByKey(this.clearListenKey);
      }

      this.csContext.dispose();
      this.csContext = null;

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }


  /**
   * @param {OLObject.Event=} opt_event
   * @private
   */
  onLayerVisibility_(opt_event) {
    if (this.csContext && this.layer) {
      this.csContext.setVisibility(this.layer.getVisible());
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }


  /**
   * Handle style changes to the layer, updating all features.
   *
   * @param {GoogEvent} event
   * @private
   */
  onLayerOpacity_(event) {
    if (this.source) {
      this.refreshFeatures_(this.source.getFeatures());
    }
  }


  /**
   * Handle property change event from the source.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onLayerPropertyChange_(event) {
    asserts.assertInstanceof(this.layer, VectorLayer, 'not an os layer');

    let p;
    try {
      // openlayers' ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure
      // the event is from us
      p = event.getProperty();
    } catch (e) {
      return;
    }

    if (this.source && p && REFRESH_PROPERTIES[p]) {
      const features = /** @type {Array<!Feature>} */ (event.getNewValue() || this.source.getFeatures());
      this.refreshFeatures_(features);
    }
  }


  /**
   * Handle feature add event from the source.
   *
   * @param {OLVectorSource.Event} event
   * @private
   */
  onAddFeature_(event) {
    const feature = event.feature;
    asserts.assert(feature != null);
    this.addFeature(feature);
  }


  /**
   * Handle feature remove event from the source.
   *
   * @param {OLVectorSource.Event} event
   * @private
   */
  onRemoveFeature_(event) {
    const feature = event.feature;
    asserts.assert(feature != null);
    this.removeFeature(feature);
  }


  /**
   * Handle feature change event from the source.
   *
   * @param {OLVectorSource.Event} event
   * @private
   */
  onChangeFeature_(event) {
    const feature = event.feature;
    asserts.assert(feature != null);
    this.updateFeature_(feature);
  }


  /**
   * Handle clear event from the source.
   *
   * @param {OLVectorSource.Event=} opt_event
   * @private
   */
  clearFeatures_(opt_event) {
    asserts.assert(this.csContext != null);
    objectUtils.forEach(this.csContext.featureToCesiumMap,
        /**
         * @param {Array<!Cesium.PrimitiveLike>|undefined} val
         * @param {number} key
         * @this {VectorSynchronizer}
         */
        function(val, key) {
          this.removeFeature(key);
        }, this);
  }


  /**
   * Handle property change event from the source.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onSourcePropertyChange_(event) {
    let p;
    try {
      // openlayers' ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure
      // the event is from us
      p = event.getProperty();
    } catch (e) {
      return;
    }

    const source = /** @type {VectorSource} */ (this.source);

    let oldVal;
    let newVal;
    switch (p) {
      case SourcePropertyChange.CLEARED:
        this.clearFeatures_();
        break;
      case SourcePropertyChange.FEATURE_VISIBILITY:
        // ignore visibility events if visibility is being controlled by the timeline. animation frame events will update
        // primitive visibility below.
        if (!source.getTimeEnabled() || !source.getAnimationEnabled()) {
          // handle visibility toggled via the list tool or other means
          const features = /** @type {Array<!Feature>} */ (event.getNewValue());
          if (features) {
            for (let i = 0, n = features.length; i < n; i++) {
              const feature = features[i];
              if (feature && !feature.isDisposed()) {
                const shown = !source.isHidden(feature);
                this.updatePrimitiveVisibility_(feature, shown);
              }
            }
          }
        }
        break;
      case SourcePropertyChange.ANIMATION_FRAME:
        // each frame fires a map of features that changed visibility
        const toHide = /** @type {?Array<!Feature>} */ (event.getOldValue());
        const toShow = /** @type {?Array<!Feature>} */ (event.getNewValue());

        if (toHide) {
          for (let i = 0, n = toHide.length; i < n; i++) {
            this.updatePrimitiveVisibility_(toHide[i], false);
          }
        }

        if (toShow) {
          for (let i = 0, n = toShow.length; i < n; i++) {
            this.updatePrimitiveVisibility_(toShow[i], true);
          }
        }

        break;
      case SourcePropertyChange.ALTITUDE:
        if (this.source instanceof VectorSource) {
          this.refreshFeatures_(source.getFeatures());
        }
        break;
      case SourcePropertyChange.ANIMATION_ENABLED:
        // when animation is enabled, hide all currently displayed features. when disabled, show all features that
        // match the current filter.
        this.initializePrimitives_(source.getFeatures());
        break;
      case SourcePropertyChange.FEATURES:
        // handle new features added to the source
        const added = /** @type {Array<!Feature>} */ (event.getNewValue());
        if (added) {
          for (let i = 0, n = added.length; i < n; i++) {
            this.addFeature(added[i]);
          }
        }

        // handle features removed from the source
        const removed = /** @type {Array<!Feature>} */ (event.getOldValue());
        if (removed) {
          for (let i = 0, n = removed.length; i < n; i++) {
            this.removeFeature(removed[i]);
          }

          this.csContext.pruneMaps();
        }
        break;
      case SourcePropertyChange.HIGHLIGHTED_ITEMS:
        oldVal = /** @type {Array<!Feature>} */ (event.getOldValue());
        if (oldVal) {
          this.updateHighlightedItems_(oldVal, false);
        }

        newVal = /** @type {Array<!Feature>} */ (event.getNewValue());
        if (newVal) {
          this.updateHighlightedItems_(newVal, true);
        }
        break;
      case SelectionType.ADDED:
      case SelectionType.REMOVED:
      case SelectionType.CHANGED:
        const shape = source.getGeometryShape();
        const isSelectedShape = shape.match(SELECTED_REGEXP);

        let features = /** @type {Array<!Feature>} */ (event.getNewValue());
        if (isSelectedShape) {
          this.resetFeatures_(features);
        } else {
          this.refreshFeatures_(features);
        }

        if (p == SelectionType.CHANGED) {
          features = /** @type {Array<!Feature>} */ (event.getOldValue());
          if (isSelectedShape) {
            this.resetFeatures_(features);
          } else {
            this.refreshFeatures_(features);
          }
        }
        break;
      case SourcePropertyChange.GEOMETRY_SHAPE:
      case SourcePropertyChange.GEOMETRY_CENTER_SHAPE:
        oldVal = /** @type {string|undefined} */ (event.getOldValue());
        newVal = /** @type {string|undefined} */ (event.getNewValue());
        if (ELLIPSE_REGEXP.test(newVal) || ELLIPSE_REGEXP.test(oldVal) ||
          LOB_REGEXP.test(newVal) || LOB_REGEXP.test(oldVal)) {
          // until we support something other than points in Cesium, only do this when changing to/from ellipse and lob
          this.resetFeatures_(source.getFeatures());
        }
        break;
      default:
        break;
    }
  }


  /**
   * Refreshes the Cesium primitive style for a set of features.
   *
   * @param {!Feature} feature The features to refresh
   * @private
   *
   * @suppress {accessControls} To allow checking if the feature exists on the source without a function call.
   */
  updateFeature_(feature) {
    // make sure the feature is still on the source in case an update was triggered post-removal
    if (this.view && this.csContext && this.source &&
        this.source.idIndex_[/** @type {string} */ (feature.id_)] != null) {
      const resolution = this.view.getResolution();
      if (resolution != null) {
        convert(feature, resolution, this.csContext);

        // added to fix initial primitive.show state when the geometry changes on a feature
        // putting this in featureconverter causes ellipse flickers
        if (this.source instanceof VectorSource &&
            (!this.source.getTimeEnabled() || !this.source.getAnimationEnabled())) {
          this.initializePrimitives_([feature]);
        }

        dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
      }
    }
  }


  /**
   * Refreshes the Cesium primitive style for a set of features.
   *
   * @param {Array<!Feature>} features The features to refresh
   * @private
   */
  refreshFeatures_(features) {
    if (this.active && features) {
      for (let i = 0, n = features.length; i < n; i++) {
        this.updateFeature_(features[i]);
      }
    }
  }


  /**
   * Removes and adds features so their Cesium objects are recreated.
   *
   * @param {Array<Feature>} features The features to reset
   * @param {boolean=} opt_force If the reset should be forced
   * @private
   */
  resetFeatures_(features, opt_force) {
    asserts.assert(this.csContext !== null);

    if (this.active || opt_force) {
      for (let i = 0, n = features.length; i < n; i++) {
        const feature = features[i];
        asserts.assert(feature !== null);

        const prims = this.csContext.featureToCesiumMap[feature.getUid()];
        const shown = prims && prims.length > 0 && isPrimitiveShown(prims[0]);
        this.removeFeature(feature);
        this.addFeature(feature);

        // set the show value based on the previous primitive
        this.updatePrimitiveVisibility_(feature, !!shown);
      }

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }


  /**
   * @param {!Feature} feature
   * @protected
   */
  addFeature(feature) {
    asserts.assert(this.view !== null);
    asserts.assert(this.csContext !== null);

    this.updateFeature_(feature);

    const featureId = feature.getUid();
    const primitives = this.csContext.featureToCesiumMap[featureId];
    if (primitives) {
      for (let i = 0, n = primitives.length; i < n; i++) {
        this.initializePrimitive(primitives[i], feature);
      }

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    } else {
      // primitive(s) haven't been created, so mark if they should be shown on creation. this typically happens when an
      // icon needs to be loaded prior to creating a billboard.
      this.csContext.featureToShownMap[featureId] = this.shouldShowFeature(feature);
    }
  }


  /**
   * @param {Feature|number|string} feature Feature or feature id.
   * @protected
   */
  removeFeature(feature) {
    if (typeof feature === 'number' || typeof feature === 'string') {
      feature = this.source.getFeatureById(feature);
    }

    if (feature !== null && this.csContext) {
      this.csContext.cleanup(feature);
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }


  /**
   * Check if a feature is hidden on the source.
   *
   * @param {!Feature} feature The OpenLayers feature
   * @return {boolean} If the feature is hidden on the source.
   * @protected
   */
  shouldShowFeature(feature) {
    if (this.source instanceof VectorSource) {
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
  }


  /**
   * Performs initialization actions on a Cesium primitive.
   *
   * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
   * @param {!Feature} feature The OpenLayers feature
   * @protected
   */
  initializePrimitive(primitive, feature) {
    if (this.source instanceof VectorSource) {
      const featureId = feature.getUid();
      this.csContext.featureToShownMap[featureId] = this.shouldShowFeature(feature);
      setPrimitiveShown(primitive, !!this.csContext.featureToShownMap[featureId]);

      if (primitive instanceof Cesium.Billboard) {
        primitive.eyeOffset = this.csContext.eyeOffset;
      }
    }
  }


  /**
   * Refreshes the Cesium primitive style for a set of features.
   *
   * @param {Array<!Feature>} features The features to refresh
   * @private
   */
  initializePrimitives_(features) {
    for (let i = 0, n = features.length; i < n; i++) {
      const feature = features[i];
      if (feature) {
        const primitives = this.csContext.featureToCesiumMap[feature.getUid()];
        if (primitives) {
          for (let j = 0, k = primitives.length; j < k; j++) {
            this.initializePrimitive(primitives[j], feature);
          }
        }
      }
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }


  /**
   * @param {Array<!Feature>} features
   * @param {boolean} value
   * @private
   */
  updateHighlightedItems_(features, value) {
    for (let i = 0, n = features.length; i < n; i++) {
      const feature = features[i];

      // update first to ensure the label primitive has been created
      this.updateFeature_(feature);

      // now update the eye offset
      const prims = this.csContext.featureToCesiumMap[feature.getUid()];
      if (prims) {
        for (let j = 0, k = prims.length; j < k; j++) {
          this.setFeatureHighlight_(prims[j], value);
        }
      }
    }
  }


  /**
   * Update the eye offsets of all labels
   */
  updateLabelOffsets() {
    const camera = MapContainer.getInstance().getWebGLCamera();
    if (this.csContext && camera) {
      // Find the z-index step from the camera altitude
      const cameraDistance = camera.getDistanceToCenter();
      const zIndexStep = Math.round(cameraDistance / (this.zIndexMax_ * 10));
      const newOffset = -(this.zIndex_ * zIndexStep);
      this.csContext.setLabelEyeOffset(new Cesium.Cartesian3(0.0, 0.0, newOffset));
    }
  }


  /**
   * @param {!Feature} feature The OpenLayers feature or feature id to update
   * @param {boolean} shown If the feature is shown
   * @private
   */
  updatePrimitiveVisibility_(feature, shown) {
    // There are some cases where the primitives are created asynchronously (icon primitives mostly), and thus
    // it is possible to get this event before they exist. Therefore, we'll store it on another map and use that
    // when creating it.
    const featureId = feature.getUid();
    this.csContext.featureToShownMap[featureId] = shown;

    const primitives = this.csContext.featureToCesiumMap[featureId];
    if (primitives) {
      for (let i = 0, n = primitives.length; i < n; i++) {
        const primitive = primitives[i];
        setPrimitiveShown(primitive, shown);
      }

      if (shown) {
        this.updateFeature_(feature);
      }
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }


  /**
   * @param {!Cesium.PrimitiveLike} primitive
   * @param {boolean} value
   * @private
   */
  setFeatureHighlight_(primitive, value) {
    const camera = /** @type {Camera} */ (MapContainer.getInstance().getWebGLCamera());

    if (primitive && primitive.eyeOffset) {
      if (value && camera) {
        // boost the feature so it's rendered on top of others nearby. don't allow the offset to exceed the camera
        // distance or the feature will not appear on the screen.
        const cameraDistance = camera.getDistanceToPosition(primitive.position);
        if (cameraDistance != null) {
          primitive.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, -cameraDistance * 0.67);
        }
      } else {
        // reset the eye offset to the default
        primitive.eyeOffset = this.getOriginalEyeOffset_(primitive);
      }
    }
  }


  /**
   * @param {!Cesium.PrimitiveLike} primitive
   * @return {!Cesium.Cartesian3}
   * @private
   */
  getOriginalEyeOffset_(primitive) {
    if (primitive instanceof Cesium.Label) {
      return this.csContext.labelEyeOffset;
    }

    return this.csContext.eyeOffset;
  }


  /**
   * @inheritDoc
   */
  reposition(start, end) {
    if (this.zIndex_ != start || this.zIndexMax_ != end) {
      this.zIndex_ = start;
      this.zIndexMax_ = end;
      this.updateLabelOffsets();
      this.updateBillboardOffsets();
    }

    // return the next vector layer index
    return ++start;
  }


  /**
   * Update the billboard offsets
   */
  updateBillboardOffsets() {
    const camera = MapContainer.getInstance().getWebGLCamera();
    if (camera) {
      // Find the z-index step from the camera altitude
      const cameraDistance = camera.getDistanceToCenter();
      const zIndexStep = Math.round(cameraDistance / (this.zIndexMax_ * 100));
      const newOffset = -(this.zIndex_ * zIndexStep);
      if (this.csContext) {
        this.csContext.setEyeOffset(new Cesium.Cartesian3(0.0, 0.0, newOffset));
      }
    }
  }


  /**
   * Updates labels and billboards after the Cesium camera changes.
   *
   * @inheritDoc
   */
  updateFromCamera() {
    this.updateLabelOffsets();
    this.updateBillboardOffsets();
    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }
}
