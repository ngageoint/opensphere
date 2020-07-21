goog.provide('plugin.heatmap.Heatmap');

goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.geom.GeometryType');
goog.require('ol.render.Event');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ILayer');
goog.require('os.layer.Vector');
goog.require('os.registerClass');
goog.require('os.source');
goog.require('os.source.Request');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.ui.Icons');
goog.require('os.ui.renamelayer');
goog.require('plugin.heatmap');
goog.require('plugin.heatmap.heatmapLayerUIDirective');



/**
 * Layer representing a heatmap of another layer. This class contains all the business logic of drawing blurred
 * images to represent each feature in the original layer. These are drawn as alpha < 1 monochrome images that are
 * then composited together and colored with a gradient (in the heatmap source). The more features that overlap in
 * a given area, the higher the alpha in that area and the more intense the color in the final image.
 *
 * @extends {os.layer.Vector}
 * @param {olx.layer.VectorOptions} options
 * @constructor
 */
plugin.heatmap.Heatmap = function(options) {
  options = options || {};

  // Openlayers 4.6.0 moved vector image rendering to ol.layer.Vector with renderMode: 'image'
  if (!options['renderMode']) {
    options['renderMode'] = 'image';
  }

  plugin.heatmap.Heatmap.base(this, 'constructor', options);

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
  this.actualGradient_ = plugin.heatmap.createGradient(this.gradient_);

  /**
   * The last modified image.
   * @type {?ol.ImageCanvas}
   * @private
   */
  this.lastImage_ = null;

  /**
   * The number of features for max intensity.
   * @type {number}
   * @private
   */
  this.intensity_ = 25;

  /**
   * Draw radius for each feature.
   * @type {number}
   * @private
   */
  this.size_ = 5;

  /**
   * Point blur factor.
   * @type {number}
   * @private
   */
  this.pointBlur_ = 5;

  /**
   * Line blur factor.
   * @type {number}
   * @private
   */
  this.lineStringBlur_ = 5;

  /**
   * Polygon blur factor.
   * @type {number}
   * @private
   */
  this.polygonBlur_ = 10;

  /**
   * Caches point images. Significantly speeds up point rendering because they don't need to be redrawn.
   * @type {Object<number, !Array<!ol.style.Style>>}
   * @private
   */
  this.pointStyleCache_ = {};

  // this is an image overlay, but it needs to appear in the layers window
  this.setHidden(false);
  this.setLayerUI('heatmaplayerui');
  this.setSynchronizerType(plugin.heatmap.SynchronizerType.HEATMAP);
  this.setOSType(os.layer.LayerType.IMAGE);
  this.setExplicitType(os.layer.ExplicitLayerType.IMAGE);
  this.setDoubleClickHandler(null);

  if (options['title']) {
    this.setTitle('Heatmap - ' + options['title']);
  }

  this.setStyle(this.styleFunc.bind(this));

  // For performance reasons, don't sort the features before rendering.
  // The render order is not relevant for a heatmap representation.
  this.setRenderOrder(null);

  ol.events.listen(this, ol.render.EventType.PRECOMPOSE, this.onPreCompose_, this);
};
goog.inherits(plugin.heatmap.Heatmap, os.layer.Vector);
os.implements(plugin.heatmap.Heatmap, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
plugin.heatmap.Heatmap.prototype.disposeInternal = function() {
  plugin.heatmap.Heatmap.base(this, 'disposeInternal');

  this.pointStyleCache_ = null;
};


/**
 * @param {!ol.render.Event} event The render event.
 * @private
 * @suppress {accessControls}
 */
plugin.heatmap.Heatmap.prototype.onPreCompose_ = function(event) {
  if (event && event.context) {
    var mapContainer = os.MapContainer.getInstance();
    var map = mapContainer.getMap();
    var layer = /** @type {ol.layer.Layer} */ (event.target);
    var layerRenderer = /** @type {ol.renderer.canvas.ImageLayer} */ (map.getRenderer().getLayerRenderer(layer));
    var image = layerRenderer ? /** @type {ol.ImageCanvas} */ (layerRenderer.image_) : undefined;

    if (!image || image === this.lastImage_) {
      // image isn't ready or has already been colored - nothing to do.
      return;
    }

    // save the last image that was updated so we don't try to modify it further
    this.lastImage_ = image;

    var canvas = image.getImage();
    var context = canvas.getContext('2d');
    var frameState = event.frameState;
    var extent = frameState ? frameState.extent : undefined;
    var pixelRatio = frameState ? frameState.pixelRatio : undefined;
    var resolution = frameState ? frameState.viewState.resolution : undefined;

    if (context && canvas && extent && pixelRatio != null && resolution != null) {
      // Apply the gradient pixel by pixel. This is slow, so should be done as infrequently as possible.
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      var view8 = imageData.data;
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
      context.putImageData(imageData, 0, 0);

      // scale the extent so the heatmap isn't clipped
      extent = extent.slice();
      ol.extent.scaleFromCenter(extent, plugin.heatmap.EXTENT_SCALE_FACTOR);

      // copy the image
      var c = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
      c.width = canvas.width;
      c.height = canvas.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(canvas, 0, 0);

      // cache the image and its data URL for the synchronizer
      this.set('url', c.toDataURL());
      this.set('canvas', c);
    }
  }
};


/**
 * Creates the heatmap styles for each feature to draw to the canvas.
 *
 * @param {ol.Feature} feature
 * @param {number} resolution
 * @return {Array<ol.style.Style>}
 */
plugin.heatmap.Heatmap.prototype.styleFunc = function(feature, resolution) {
  var style;
  var opacity = 1 / this.intensity_;
  var useCache = feature.get(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY) instanceof ol.geom.Point;

  if (useCache) {
    // point styles are indexed by intensity
    style = this.pointStyleCache_[this.intensity_];
  }

  if (!style) {
    // only create the style if it wasn't in the cache
    var img = this.createImage(feature);
    var icon = new ol.style.Icon({
      opacity: opacity,
      img: img,
      imgSize: [img.width, img.height]
    });

    style = [
      new ol.style.Style({
        image: icon
      })
    ];

    if (useCache) {
      this.pointStyleCache_[this.intensity_] = style;
    }
  }

  return style;
};


/**
 * @param {ol.Feature} feature
 * @return {HTMLCanvasElement} Data URL for a circle.
 * @protected
 */
plugin.heatmap.Heatmap.prototype.createImage = function(feature) {
  // start with a tiny blank canvas in case we fail to draw the image (for some reason)
  var context = ol.dom.createCanvasContext2D(1, 1);
  var type = /** @type {string} */ (feature.get(plugin.heatmap.HeatmapField.GEOMETRY_TYPE));
  var geom = /** @type {ol.geom.Geometry} */ (feature.get(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY));

  switch (type) {
    case ol.geom.GeometryType.POINT:
      context = this.drawPoint(geom);
      break;
    case ol.geom.GeometryType.MULTI_POINT:
      context = this.drawMultiPoint(geom);
      break;
    case ol.geom.GeometryType.LINE_STRING:
      context = this.drawLineString(geom);
      break;
    case ol.geom.GeometryType.POLYGON:
      context = this.drawPolygon(geom);
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      context = this.drawMultiPolygon(geom);
      break;
    default:
      break;
  }

  return context.canvas;
};


/**
 * Draws a circle for the passed in feature.
 *
 * @param {ol.geom.Geometry} geom
 * @return {CanvasRenderingContext2D} Data URL for a circle.
 */
plugin.heatmap.Heatmap.prototype.drawPoint = function(geom) {
  var radius = this.size_;
  var blur = this.pointBlur_;
  var halfSize = radius + blur + 1;
  var size = 2 * halfSize;
  var center = halfSize - 250;

  var context = ol.dom.createCanvasContext2D(size, size);
  context.shadowOffsetX = context.shadowOffsetY = 250;
  context.shadowBlur = blur;
  context.shadowColor = '#000';
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2, true);
  context.fill();

  return context;
};


/**
 * Draws a circle for the passed in feature.
 *
 * @param {ol.geom.Geometry} geom
 * @return {CanvasRenderingContext2D} Data URL for a circle.
 */
plugin.heatmap.Heatmap.prototype.drawMultiPoint = function(geom) {
  var mp = /** @type {ol.geom.MultiPoint} */ (geom);
  var context = null;

  if (mp) {
    var pixelExtent = plugin.heatmap.Heatmap.getPixelExtent(mp);
    var points = mp.getCoordinates();

    var radius = this.size_;
    var blur = this.pointBlur_;
    var sizeX = Math.abs(pixelExtent[1][0] - pixelExtent[0][0]) + 2 * blur;
    var sizeY = Math.abs(pixelExtent[1][1] - pixelExtent[0][1]) + 2 * blur;
    context = ol.dom.createCanvasContext2D(sizeX, sizeY);
    context.shadowOffsetY = 4 * sizeY;
    context.shadowBlur = blur;
    context.shadowColor = '#000';

    for (var i = 0, ii = points.length; i < ii; i++) {
      var coordinate = points[i];
      var pixel = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate(coordinate);
      var xPos = Math.abs(pixelExtent[0][0] - pixel[0]) + blur;
      var yPos = Math.abs(pixelExtent[0][1] - pixel[1]) + blur - 4 * sizeY;

      context.beginPath();
      context.arc(xPos, yPos, radius, 0, Math.PI * 2, true);
      context.fill();
    }
  }

  return context;
};


/**
 * Draws a polygon for the passed in feature.
 *
 * @param {ol.geom.Geometry} geom
 * @return {CanvasRenderingContext2D}
 */
plugin.heatmap.Heatmap.prototype.drawPolygon = function(geom) {
  var polygon = /** @type {ol.geom.Polygon} */ (geom);
  var context = null;

  if (polygon) {
    var pixelExtent = plugin.heatmap.Heatmap.getPixelExtent(polygon);
    var rings = polygon.getCoordinates();

    var blur = this.polygonBlur_;
    var sizeX = Math.abs(pixelExtent[1][0] - pixelExtent[0][0]) + 2 * blur;
    var sizeY = Math.abs(pixelExtent[1][1] - pixelExtent[0][1]) + 2 * blur;
    context = ol.dom.createCanvasContext2D(sizeX, sizeY);

    for (var i = 0, ii = rings.length; i < ii; i++) {
      var coordinates = rings[i];
      for (var j = 0, jj = coordinates.length; j < jj; j++) {
        var coordinate = coordinates[j];
        var pixel = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate(coordinate);
        var xPos = Math.abs(pixelExtent[0][0] - pixel[0]) + blur;
        var yPos = Math.abs(pixelExtent[0][1] - pixel[1]) + blur - 4 * sizeY;
        j === 0 ? context.moveTo(xPos, yPos) : context.lineTo(xPos, yPos);
      }
    }

    plugin.heatmap.Heatmap.drawShadow(context, sizeY, blur);
  }

  return context;
};


/**
 * Draws a polygon for the passed in feature.
 *
 * @param {ol.geom.Geometry} geom
 * @return {CanvasRenderingContext2D}
 */
plugin.heatmap.Heatmap.prototype.drawMultiPolygon = function(geom) {
  var mp = /** @type {ol.geom.MultiPolygon} */ (geom);
  var context = null;

  if (mp) {
    var pixelExtent = plugin.heatmap.Heatmap.getPixelExtent(mp);
    var polygons = mp.getCoordinates();

    var blur = this.polygonBlur_;
    var sizeX = Math.abs(pixelExtent[1][0] - pixelExtent[0][0]) + 2 * blur;
    var sizeY = Math.abs(pixelExtent[1][1] - pixelExtent[0][1]) + 2 * blur;
    context = ol.dom.createCanvasContext2D(sizeX, sizeY);

    for (var i = 0, ii = polygons.length; i < ii; i++) {
      var rings = polygons[i];
      for (var j = 0, jj = rings.length; j < jj; j++) {
        var coordinates = rings[j];
        for (var k = 0, kk = coordinates.length; k < kk; k++) {
          var coordinate = coordinates[k];
          var pixel = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate(coordinate);
          var xPos = Math.abs(pixelExtent[0][0] - pixel[0]) + blur;
          var yPos = Math.abs(pixelExtent[0][1] - pixel[1]) + blur - 4 * sizeY;
          k === 0 ? context.moveTo(xPos, yPos) : context.lineTo(xPos, yPos);
        }
      }
    }

    // add the shadow
    plugin.heatmap.Heatmap.drawShadow(context, sizeY, blur);
  }

  return context;
};


/**
 * Draws a linestring for the passed in feature.
 *
 * @param {ol.geom.Geometry} geom
 * @return {CanvasRenderingContext2D}
 */
plugin.heatmap.Heatmap.prototype.drawLineString = function(geom) {
  var lineString = /** @type {ol.geom.LineString} */ (geom);
  var context = null;

  if (lineString) {
    var pixelExtent = plugin.heatmap.Heatmap.getPixelExtent(lineString);
    var coordinates = lineString.getCoordinates();

    var blur = this.lineStringBlur_;
    var sizeX = Math.abs(pixelExtent[1][0] - pixelExtent[0][0]) + 4 * blur;
    var sizeY = Math.abs(pixelExtent[1][1] - pixelExtent[0][1]) + 4 * blur;
    context = ol.dom.createCanvasContext2D(sizeX, sizeY);

    for (var i = 0, ii = coordinates.length; i < ii; i++) {
      var coordinate = coordinates[i];
      var pixel = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate(coordinate);
      var xPos = Math.abs(pixelExtent[0][0] - pixel[0]) + 2 * blur;
      var yPos = Math.abs(pixelExtent[0][1] - pixel[1]) + 2 * blur - 4 * sizeY;
      i === 0 ? context.moveTo(xPos, yPos) : context.lineTo(xPos, yPos);
    }

    // add the shadow and do a stroke instead of a fill (lineStrings are special)
    context.lineWidth = this.size_;
    context.shadowOffsetY = 4 * sizeY;
    context.shadowBlur = blur;
    context.shadowColor = '#000';
    context.stroke();
  }

  return context;
};


/**
 * Gets the last rendered image canvas.
 *
 * @return {?ol.ImageCanvas} The image canvas, or null.
 */
plugin.heatmap.Heatmap.prototype.getLastImage = function() {
  return this.lastImage_;
};


/**
 * @inheritDoc
 */
plugin.heatmap.Heatmap.prototype.getExtent = function() {
  var extent = null;

  var canvas = this.getLastImage();
  if (canvas) {
    // get it from the canvas
    extent = canvas.getExtent().slice();
  } else {
    // use the full map extent if the canvas isn't ready
    extent = os.MapContainer.getInstance().getViewExtent().slice();
  }

  // scale the extent so the image is positioned properly
  ol.extent.scaleFromCenter(extent, plugin.heatmap.EXTENT_SCALE_FACTOR);

  return extent;
};


/**
 * Get the intensity
 *
 * @return {number}
 */
plugin.heatmap.Heatmap.prototype.getIntensity = function() {
  return this.intensity_;
};


/**
 * Set the intensity
 *
 * @param {number} value
 */
plugin.heatmap.Heatmap.prototype.setIntensity = function(value) {
  this.intensity_ = value;
  this.updateSource(plugin.heatmap.HeatmapPropertyType.INTENSITY);
};


/**
 * Get the size
 *
 * @return {number}
 */
plugin.heatmap.Heatmap.prototype.getSize = function() {
  return this.size_;
};


/**
 * Set the size
 *
 * @param {number} value
 */
plugin.heatmap.Heatmap.prototype.setSize = function(value) {
  this.size_ = value;
  this.updateSource(plugin.heatmap.HeatmapPropertyType.SIZE);
};


/**
 * Get the gradient. This value is kept on the source.
 *
 * @return {Array<string>}
 */
plugin.heatmap.Heatmap.prototype.getGradient = function() {
  return this.gradient_;
};


/**
 * Set the gradient. This value is kept on the source.
 *
 * @param {Array<string>} value
 */
plugin.heatmap.Heatmap.prototype.setGradient = function(value) {
  this.gradient_ = value;
  this.actualGradient_ = plugin.heatmap.createGradient(this.gradient_);
  this.updateSource(plugin.heatmap.HeatmapPropertyType.GRADIENT);
};


/**
 * Trigger a render on the source. Necessary because the heatmap source deliberately avoids rerendering the heatmap as
 * much as possible.
 *
 * @param {string=} opt_eventType Optional type for the style event.
 */
plugin.heatmap.Heatmap.prototype.updateSource = function(opt_eventType) {
  this.pointStyleCache_ = {};
  os.style.notifyStyleChange(this, undefined, opt_eventType);
};


/**
 * @inheritDoc
 * @see {os.ui.action.IActionTarget}
 */
plugin.heatmap.Heatmap.prototype.supportsAction = function(type, opt_actionArgs) {
  var source = this.getSource();

  switch (type) {
    case os.action.EventType.REMOVE_LAYER:
    case os.action.EventType.IDENTIFY:
      return true;
    case os.action.EventType.RENAME:
      return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
    case os.action.EventType.REFRESH:
      return source instanceof os.source.Request;
    default:
      break;
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.heatmap.Heatmap.prototype.callAction = function(type) {
  switch (type) {
    case os.action.EventType.EXPORT:
      return plugin.heatmap.exportHeatmap(this);
    case os.action.EventType.IDENTIFY:
      this.identify();
      break;
    case os.action.EventType.REMOVE_LAYER:
      var removeEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, this.getId());
      os.dispatcher.dispatchEvent(removeEvent);
      break;
    case os.action.EventType.RENAME:
      os.ui.renamelayer.launchRenameDialog(this);
      break;
    default:
      break;
  }
};


/**
 * @param {ol.geom.Geometry} geom
 * @return {Array<number>}
 */
plugin.heatmap.Heatmap.getPixelExtent = function(geom) {
  var extent = geom.getExtent();
  var e1 = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate([extent[0], extent[3]]);
  var e2 = os.MapContainer.getInstance().getMap().get2DPixelFromCoordinate([extent[2], extent[1]]);
  return [e1, e2];
};


/**
 * Draws the blurred shadow in the appropriate position.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {number} sizeY
 * @param {number} blur
 */
plugin.heatmap.Heatmap.drawShadow = function(context, sizeY, blur) {
  context.shadowOffsetY = 4 * sizeY;
  context.shadowBlur = blur;
  context.shadowColor = '#000';
  context.fill();
};
