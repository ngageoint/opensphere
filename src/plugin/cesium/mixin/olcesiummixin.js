goog.provide('plugin.cesium.mixin.olcs');

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
        var interaction = /** @type {ol.interaction.Interaction} */ (el);
        if (!os.implements(interaction, os.I3DSupport.ID) ||
            !(/** @type {os.I3DSupport} */ (interaction)).is3DSupported()) {
          interaction.setActive(false);
        }
      });

      var rootGroup = this.map_.getLayerGroup();
      if (rootGroup.getVisible()) {
        this.hiddenRootGroup_ = rootGroup;
        this.hiddenRootGroup_.setVisible(false);
      }
    }

    // enable the cesium camera and update it from OpenLayers view
    /** @type {plugin.cesium.Camera} */ (this.camera_).setEnabled(true);
    this.camera_.readFromView();
    this.render_();
  } else {
    // update the OpenLayers view from the cesium camera, then disable the camera
    this.camera_.updateView();
    /** @type {plugin.cesium.Camera} */ (this.camera_).setEnabled(false);

    if (this.isOverMap_) {
      interactions = this.map_.getInteractions();
      interactions.forEach(function(el, i, arr) {
        var interaction = /** @type {ol.interaction.Interaction} */ (el);
        if (!os.implements(interaction, os.I3DSupport.ID) ||
              !(/** @type {os.I3DSupport} */ (interaction)).is3DSupported()) {
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
