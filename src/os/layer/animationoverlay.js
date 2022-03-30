goog.declareModuleId('os.layer.AnimationOverlay');

import OLVectorSource from 'ol/src/source/Vector.js';

import {getMapContainer} from '../map/mapinstance.js';
import AnimationVector from './animationvector.js';

const Disposable = goog.require('goog.Disposable');
const {clone} = goog.require('goog.array');

const {default: AnimationOverlayOptions} = goog.requireType('os.layer.AnimationOverlayOptions');


/**
 * Renders features in a source that has spatial indexing disabled and avoids firing events when the features change.
 * This dramatically increases animation performance by reducing the overhead involved in changing which features are
 * rendered.
 */
export default class AnimationOverlay extends Disposable {
  /**
   * Constructor.
   * @param {AnimationOverlayOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super();

    var options = opt_options !== undefined ? opt_options : {};

    /**
     * @type {!Array<!Feature>}
     * @private
     */
    this.features_ = [];

    /**
     * @type {OLVectorSource}
     * @private
     */
    this.source_ = new OLVectorSource({
      features: this.features_,
      useSpatialIndex: false
    });

    /**
     * @type {OLVectorLayer}
     * @private
     */
    this.layer_ = new AnimationVector({
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

    if (options.features != null && Array.isArray(options.features)) {
      this.setFeatures(clone(options.features));
    }

    if (options.map != null) {
      this.setMap(options.map);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.setMap(null);

    this.features_.length = 0;
    this.source_.dispose();
    this.source_ = null;
    this.layer_.dispose();
    this.layer_ = null;
  }

  /**
   * Fires a changed event on the source to trigger rendering.
   *
   * Performance note: Do NOT fire events while in 3D mode because this layer will be rendered by the 2D map since it is
   * not in the hidden root layer group.
   */
  changed() {
    if (this.source_ && !getMapContainer().is3DEnabled()) {
      this.source_.changed();
    }
  }

  /**
   * Get the features in the overlay.
   *
   * @return {!Array<!Feature>} Features collection.
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * Set the features rendered on the map.
   *
   * @param {Array<!Feature>|undefined} features Features collection.
   */
  setFeatures(features) {
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
  }

  /**
   * Set the map reference on the layer.
   *
   * @param {ol.PluggableMap} map Map.
   */
  setMap(map) {
    if (this.layer_) {
      this.layer_.setMap(map);
    }
  }

  /**
   * Set the style for features.  This can be a single style object, an array of styles, or a function that takes a
   * feature and resolution and returns an array of styles.
   *
   * @param {Style|Array<Style>|ol.StyleFunction} style Overlay style.
   */
  setStyle(style) {
    if (this.layer_) {
      this.layer_.setStyle(style);
    }
  }

  /**
   * Sets the overall opacity on the overlay layer.
   *
   * @param {number} value
   */
  setOpacity(value) {
    if (this.layer_) {
      this.layer_.setOpacity(value);
    }
  }

  /**
   * Sets the z-index on the overlay layer.
   *
   * @param {number} value
   */
  setZIndex(value) {
    if (this.layer_) {
      this.layer_.setZIndex(value);
    }
  }
}
