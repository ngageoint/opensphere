goog.provide('plugin.heatmap.HeatmapSource');
goog.require('goog.async.Delay');
goog.require('ol.Feature');
goog.require('ol.ImageCanvas');
goog.require('ol.geom.Point');
goog.require('ol.source.ImageVector');
goog.require('os.data.OSDataManager');
goog.require('os.source.Vector');



/**
 * Takes a vector source and clones its features in such a way as to preserve only their rendered geometries.
 * These geometries are drawn by the heatmap layer, then the heatmap source takes the final image and applies a
 * colored gradient to it based on the alpha level at each pixel in the image. This is done only once every 250ms
 * for performance reasons.
 * @param {olx.source.ImageVectorOptions} options Options.
 * @extends {ol.source.ImageVector}
 * @suppress {accessControls}
 * @constructor
 */
plugin.heatmap.HeatmapSource = function(options) {
  // generate our own source with special feature clones designed for the heatmap
  var sourceId = /** @type {string} */ (options['sourceId']);
  var source = os.osDataManager.getSource(sourceId);
  var feats = [];
  if (source) {
    var sourceFeats = source.getFeatures();
    for (var i = 0, n = sourceFeats.length; i < n; i++) {
      var origFeature = /** @type {ol.Feature} */ (sourceFeats[i]);
      if (origFeature) {
        var clone = plugin.heatmap.HeatmapSource.clone(origFeature);
        if (clone) {
          clone.setId(i);
          feats.push(clone);
        }
      }
    }
  }

  var newSource = new os.source.Vector({
    features: feats
  });

  options.source = newSource;
  plugin.heatmap.HeatmapSource.base(this, 'constructor', options);

  /**
   * @type {os.source.Vector}
   * @private
   */
  this.osSource_ = newSource;

  /**
   * The array of hex colors. Used for external interface.
   * @type {Array<string>}
   * @private
   */
  this.gradient_ = os.color.THERMAL_HEATMAP_GRADIENT_HEX;

  /**
   * The array of rgba values used to actually apply the gradient
   * @type {Uint8ClampedArray}
   * @private
   */
  this.actualGradient_ = plugin.heatmap.HeatmapSource.createGradient(this.gradient_);

  /**
   * @type {?ol.ImageCanvas}
   * @private
   */
  this.currentCanvas_ = null;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.delay_ = new goog.async.Delay(this.onDelay_, 500, this);

  /**
   * @type {boolean}
   * @private
   */
  this.dirty_ = true;
};
goog.inherits(plugin.heatmap.HeatmapSource, ol.source.ImageVector);


/**
 * Clean up.
 */
plugin.heatmap.HeatmapSource.prototype.disposeInternal = function() {
  plugin.heatmap.HeatmapSource.base(this, 'disposeInternal');
  goog.dispose(this.osSource_);
  this.osSource_ = null;
};


/**
 * Gets the gradient.
 * @return {Array<string>}
 */
plugin.heatmap.HeatmapSource.prototype.getGradient = function() {
  return this.gradient_;
};


/**
 * Sets the gradient.
 * @param {Array<string>} value
 */
plugin.heatmap.HeatmapSource.prototype.setGradient = function(value) {
  this.gradient_ = value;
  this.actualGradient_ = plugin.heatmap.HeatmapSource.createGradient(this.gradient_);
};


/**
 * Gets the current canvas (or null).
 * @return {?ol.ImageCanvas}
 */
plugin.heatmap.HeatmapSource.prototype.getCurrentCanvas = function() {
  return this.currentCanvas_;
};


/**
 * Sets the dirty flag. The source will not return its cached canvas while dirty.
 */
plugin.heatmap.HeatmapSource.prototype.markDirty = function() {
  this.dirty_ = true;
};


/**
 * @return {ol.Extent}
 */
plugin.heatmap.HeatmapSource.prototype.getExtent = function() {
  var canvas = this.getCurrentCanvas();
  if (canvas) {
    // get it from the canvas
    return canvas.getExtent();
  } else {
    // return the full map extent
    var extent = os.MapContainer.getInstance().getViewExtent().slice();
    ol.extent.scaleFromCenter(extent, 1.5);
    return extent;
  }
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.heatmap.HeatmapSource.prototype.renderFeature_ = function(feature, resolution, pixelRatio, replayGroup) {
  var styles;
  if (this.styleFunction_) {
    styles = this.styleFunction_(feature, resolution);
  }
  if (!styles) {
    return false;
  }
  var loading = false;
  if (!Array.isArray(styles)) {
    styles = [styles];
  }
  for (var i = 0, ii = styles.length; i < ii; ++i) {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles[i],
        ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
        this.handleImageChange_, this) || loading;
  }
  return loading;
};


/**
 * The base class generates the base blurred feature image and this extension applies the gradient to it and makes
 * its own cached copy. The cached copy will be returned if we're not dirty and we aren't in 3D mode.
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.heatmap.HeatmapSource.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  // return the cached canvas if we haven't experienced any changes
  if (this.currentCanvas_ && !this.dirty_ && !os.MapContainer.getInstance().is3DEnabled()) {
    if (this.currentCanvas_.getResolution() != resolution) {
      // zoom changed, so we need to rerender eventually
      this.delay_.start();
    }

    return this.currentCanvas_;
  }

  // get the new canvas
  var imageCanvas =
      plugin.heatmap.HeatmapSource.base(this, 'getImageInternal', extent, resolution, pixelRatio, projection);

  // wipe out the parent's cached canvas, that's our job now
  this.canvas_ = null;

  if (imageCanvas) {
    // Apply the gradient pixel by pixel. This is slow, so should be done as infrequently as possible.
    var canvas = imageCanvas.getImage();
    var context = canvas.getContext('2d');
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    var view8 = image.data;
    var alpha;
    for (var i = 0, ii = view8.length; i < ii; i += 4) {
      alpha = view8[i + 3] * 4;
      if (alpha) {
        view8[i] = this.actualGradient_[alpha];
        view8[i + 1] = this.actualGradient_[alpha + 1];
        view8[i + 2] = this.actualGradient_[alpha + 2];
        view8[i + 3] = alpha * 4;
      }
    }
    context.putImageData(image, 0, 0);

    // scale the extent... just do it, trust me
    extent = extent.slice();
    ol.extent.scaleFromCenter(extent, this.ratio_);

    // copy the image
    var c = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    c.width = canvas.width;
    c.height = canvas.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0);

    // cache the image and its data URL for the synchronizer
    this.currentCanvas_ = new ol.ImageCanvas(extent, resolution, pixelRatio, this.getAttributions(), c);
    this.set('url', c.toDataURL());
    this.dirty_ = false;
  }

  return imageCanvas;
};


/**
 * @private
 */
plugin.heatmap.HeatmapSource.prototype.onDelay_ = function() {
  // purge the cached canvas and force a rerender to generate a new one
  this.currentCanvas_ = null;
  this.changed();
};


/**
 * Clones a feature. This avoids copying style information since we handle styles very differently than base OL3.
 * @param {!ol.Feature} feature The feature to clone
 * @return {?ol.Feature} The cloned feature
 */
plugin.heatmap.HeatmapSource.clone = function(feature) {
  var clone = null;
  var geometry = feature.getGeometry();

  if (geometry && geometry.getExtent().indexOf(Infinity) === -1) {
    clone = new ol.Feature();

    // get the real geometry name and put it on the feature
    var geometryType = geometry.getType();
    clone.set(plugin.heatmap.HeatmapField.GEOMETRY_TYPE, geometryType);

    // put a clone of the geometry on the feature
    clone.set(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY, os.ol.feature.cloneGeometry(geometry));

    // get the ellipse and put it on the feature (if applicable)
    var ellipse = feature.get(os.data.RecordField.ELLIPSE);
    var shapeName = os.feature.getShapeName(feature);
    if (ellipse && (shapeName == os.style.ShapeType.ELLIPSE || shapeName == os.style.ShapeType.ELLIPSE_CENTER)) {
      clone.set(plugin.heatmap.HeatmapField.GEOMETRY_TYPE, ellipse.getType());
      clone.set(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY, os.ol.feature.cloneGeometry(ellipse));
    }

    // generate the centerpoint and center the feature there for rendering
    var extent = geometry.getExtent();
    var center = ol.extent.getCenter(extent);
    var pointGeometry = new ol.geom.Point(center);
    clone.setGeometry(pointGeometry);
  }

  return clone;
};


/**
 * Takes a list of color strings and constructs a gradient image data array.
 * @param {Array<string>} colors
 * @return {Uint8ClampedArray} An array.
 */
plugin.heatmap.HeatmapSource.createGradient = function(colors) {
  var width = 1;
  var height = 256;
  var context = ol.dom.createCanvasContext2D(width, height);

  var gradient = context.createLinearGradient(0, 0, width, height);
  var step = 1 / (colors.length - 1);
  for (var i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  return context.getImageData(0, 0, width, height).data;
};
