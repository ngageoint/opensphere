/**
 * @fileoverview mixins for Cesium
 * @suppress {missingProvide}
 */
goog.provide('os.mixin.cesium');

goog.require('olcs.OLCesium');
goog.require('os.I3DSupport');


/**
 * Timeout id to resize the Cesium canvas.
 * @type {number|undefined}
 */
olcs.OLCesium.prototype.resizeTimeout;


/**
 * @private
 * @suppress {accessControls|duplicate|unusedPrivateMembers}
 */
olcs.OLCesium.prototype.handleResize_ = function() {
  var width = this.canvas_.clientWidth;
  var height = this.canvas_.clientHeight;

  if (width === 0 || height === 0) {
    // The canvas DOM element is not ready yet.
    return;
  }

  if (width === this.canvasClientWidth_ &&
      height === this.canvasClientHeight_ &&
      !this.resolutionScaleChanged_) {
    return;
  }

  // if the canvas is resized too soon, Cesium may exhibit broken rendering behavior. this includes drawing lines
  // through the globe, and the "black hole" effect where primitives in the middle of the screen are not drawn at all.
  // this delay is intended to let the DOM adjust, then resize Cesium's canvas.
  if (this.resizeTimeout == null) {
    this.setBlockCesiumRendering(true);

    this.resizeTimeout = setTimeout(function() {
      var resolutionScale = this.resolutionScale_;
      if (!olcs.util.supportsImageRenderingPixelated()) {
        resolutionScale *= window.devicePixelRatio || 1.0;
      }
      this.resolutionScaleChanged_ = false;

      this.canvasClientWidth_ = width;
      this.canvasClientHeight_ = height;

      width *= resolutionScale;
      height *= resolutionScale;

      this.canvas_.width = width;
      this.canvas_.height = height;
      this.scene_.camera.frustum.aspectRatio = width / height;

      this.resizeTimeout = undefined;
      this.setBlockCesiumRendering(false);
    }.bind(this), 100);
  }
};


/**
 * Changed to allow some interactions to be disabled rather than removed entirely
 * @param {boolean} enable
 * @suppress {accessControls|duplicate}
 */
olcs.OLCesium.prototype.setEnabled = function(enable) {
  if (this.enabled_ === enable) {
    return;
  }
  this.enabled_ = enable;

  // some Cesium operations are operating with canvas.clientWidth,
  // so we can't remove it from DOM or even make display:none;
  this.container_.style.visibility = this.enabled_ ? 'visible' : 'hidden';

  if (this.enabled_) {
    if (this.isOverMap_) {
      var interactions = this.map_.getInteractions();
      interactions.forEach(function(el, i, arr) {
        try {
          var interaction = /** @type {ol.interaction.Interaction} */ (el);
          if (!(/** @type {os.I3DSupport} */ (interaction)).is3DSupported()) {
            interaction.setActive(false);
          }
        } catch (e) {
          interaction.setActive(false);
        }
      });

      var rootGroup = this.map_.getLayerGroup();
      if (rootGroup.getVisible()) {
        this.hiddenRootGroup_ = rootGroup;
        this.hiddenRootGroup_.setVisible(false);
      }
    }

    // enable the cesium camera and update it from ol3 view
    /** @type {os.olcs.Camera} */ (this.camera_).setEnabled(true);
    this.camera_.readFromView();
    this.render_();
  } else {
    // update the ol3 view from the cesium camera, then disable the camera
    this.camera_.updateView();
    /** @type {os.olcs.Camera} */ (this.camera_).setEnabled(false);

    if (this.isOverMap_) {
      interactions = this.map_.getInteractions();
      interactions.forEach(function(el, i, arr) {
        try {
          var interaction = /** @type {ol.interaction.Interaction} */ (el);
          if (!(/** @type {os.I3DSupport} */ (interaction)).is3DSupported()) {
            interaction.setActive(true);
          }
        } catch (e) {
          interaction.setActive(true);
        }
      });

      if (!goog.isNull(this.hiddenRootGroup_)) {
        this.hiddenRootGroup_.setVisible(true);
        this.hiddenRootGroup_ = null;
      }
    }
  }
};


/**
 * This "fixes" Cesium's lackluster crossOrigin support by setting crossOrigin on the image to an actual value.
 * Firefox will not be able to load tiles without this change.
 * @param {string} url
 * @param {boolean} crossOrigin
 * @param {*} deferred
 * @suppress {accessControls|duplicate}
 */
Cesium.loadImage.createImage = function(url, crossOrigin, deferred) {
  var image = new Image();

  /**
   * @param {Event} e
   */
  image.onload = function(e) {
    deferred.resolve(image);
  };

  /**
   * @param {Event} e
   */
  image.onerror = function(e) {
    deferred.reject(e);
  };

  if (crossOrigin) {
    image.crossOrigin = os.net.getCrossOrigin(url);
  }

  image.src = url;
};


/**
 * @suppress {accessControls|duplicate}
 */
Cesium.loadImage.defaultCreateImage = Cesium.loadImage.createImage;


/**
 * @param {Cesium.Context} context
 * @param {number} key
 * @param {Cesium.Color} color
 * @constructor
 */
Cesium.PickId = function(context, key, color) {
  /**
   * @type {?Cesium.Context}
   * @private
   */
  this.context_ = context;

  /**
   * @type {number}
   */
  this.key = key;

  /**
   * @type {Cesium.Color}
   */
  this.color = color;
};

Cesium.defineProperties(Cesium.PickId.prototype, {
  'object': {
    get:
        /**
         * @return {Object|undefined}
         * @this Cesium.PickId
         */
        function() {
          return this.context_.getPickObjects()[this.key];
        },
    set:
        /**
         * @param {Object} value
         * @this Cesium.PickId
         */
        function(value) {
          this.context_.getPickObjects()[this.key] = value;
        }
  }
});


/**
 * @return {undefined}
 */
Cesium.PickId.prototype.destroy = function() {
  this.context_.getPickObjects()[this.key] = undefined;
  this.context_ = null;
  return undefined;
};
goog.exportProperty(Cesium.PickId.prototype, 'destroy', Cesium.PickId.prototype.destroy);


/**
 * Remove undefined values from the pick id array.
 */
Cesium.Context.prototype.cleanupPickIds = function() {
  this._pickObjects = os.object.prune(this._pickObjects);
};


/**
 * Gets pick objects reference.
 * @return {Object} [description]
 */
Cesium.Context.prototype.getPickObjects = function() {
  return this._pickObjects;
};


/**
 * Creates a unique ID associated with the input object for use with color-buffer picking.
 * The ID has an RGBA color value unique to this context.  You must call destroy()
 * on the pick ID when destroying the input object.
 *
 * @param {Object} object The object to associate with the pick ID.
 * @return {Object} A PickId object with a <code>color</code> property.
 */
Cesium.Context.prototype.createPickId = function(object) {
  if (!Cesium.defined(object)) {
    throw new Cesium.DeveloperError('object is required.');
  }

  // the increment and assignment have to be separate statements to
  // actually detect overflow in the Uint32 value
  ++this._nextPickColor[0];
  var key = this._nextPickColor[0];
  if (key === 0) {
    // In case of overflow
    throw new Cesium.RuntimeError('Out of unique Pick IDs.');
  }

  this._pickObjects[key] = object;
  return new Cesium.PickId(this, key, Cesium.Color.fromRgba(key));
};
goog.exportProperty(Cesium.Context.prototype, 'createPickId', Cesium.Context.prototype.createPickId);


