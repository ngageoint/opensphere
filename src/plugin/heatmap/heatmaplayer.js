goog.provide('plugin.heatmap.Heatmap');

goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Heatmap');
goog.require('ol.render.Event');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('os.events.LayerEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.layer');
goog.require('os.layer.ILayer');
goog.require('os.layer.Image');
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
 * @extends {os.layer.Image}
 * @param {olx.layer.ImageOptions} options
 * @constructor
 */
plugin.heatmap.Heatmap = function(options) {
  plugin.heatmap.Heatmap.base(this, 'constructor', options);

  /**
   * @type {number}
   * @private
   */
  this.intensity_ = 25;

  /**
   * @type {number}
   * @private
   */
  this.size_ = 5;

  /**
   * @type {number}
   * @private
   */
  this.pointBlur_ = 5;

  /**
   * @type {number}
   * @private
   */
  this.lineStringBlur_ = 5;

  /**
   * @type {number}
   * @private
   */
  this.polygonBlur_ = 10;

  /**
   * Caches point images. Significantly speeds up point rendering because they don't need to be redrawn.
   * @type {Object<string, Array.<ol.style.Style>>}
   * @private
   */
  this.pointStyleCache_ = {};

  // this is an image overlay, but it needs to appear in the layers window
  this.setHidden(false);
  this.setLayerUI('heatmaplayerui');
  this.setSynchronizerType(plugin.heatmap.SynchronizerType.HEATMAP);

  if (options['title']) {
    this.setTitle('Heatmap - ' + options['title']);
  }

  var source = /** @type {plugin.heatmap.HeatmapSource} */ (this.getSource());
  source.setStyle(this.styleFunc.bind(this));
};
goog.inherits(plugin.heatmap.Heatmap, os.layer.Image);
os.implements(plugin.heatmap.Heatmap, os.layer.ILayer.ID);


/**
 * @inheritDoc
 */
plugin.heatmap.Heatmap.prototype.disposeInternal = function() {
  plugin.heatmap.Heatmap.base(this, 'disposeInternal');

  this.pointStyleCache_ = null;
};


/**
 * Creates the heatmap styles for each feature to draw to the canvas.
 * @param {ol.Feature} feature
 * @param {number} resolution
 * @return {Array<ol.style.Style>}
 */
plugin.heatmap.Heatmap.prototype.styleFunc = function(feature, resolution) {
  var style;
  var index;
  var opacity = 1 / this.intensity_;
  var useCache = feature.get(plugin.heatmap.HeatmapField.HEATMAP_GEOMETRY) instanceof ol.geom.Point;

  if (useCache) {
    // point geometries are cached by <id>|<opacity>
    index = feature.getId() + '|' + opacity;
    style = this.pointStyleCache_[index];
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

    if (index) {
      this.pointStyleCache_[index] = style;
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
 * @inheritDoc
 */
plugin.heatmap.Heatmap.prototype.getExtent = function() {
  return /** @type {plugin.heatmap.HeatmapSource} */ (this.getSource()).getExtent();
};


/**
 * Get the intensity
 * @return {number}
 */
plugin.heatmap.Heatmap.prototype.getIntensity = function() {
  return this.intensity_;
};


/**
 * Set the intensity
 * @param {number} value
 */
plugin.heatmap.Heatmap.prototype.setIntensity = function(value) {
  this.intensity_ = value;
  this.markSourceDirty(plugin.heatmap.HeatmapPropertyType.INTENSITY);
};


/**
 * Get the size
 * @return {number}
 */
plugin.heatmap.Heatmap.prototype.getSize = function() {
  return this.size_;
};


/**
 * Set the size
 * @param {number} value
 */
plugin.heatmap.Heatmap.prototype.setSize = function(value) {
  this.size_ = value;
  this.markSourceDirty(plugin.heatmap.HeatmapPropertyType.SIZE);
};


/**
 * Get the gradient. This value is kept on the source.
 * @return {Array<string>}
 */
plugin.heatmap.Heatmap.prototype.getGradient = function() {
  var source = /** @type {plugin.heatmap.HeatmapSource} */ (this.getSource());
  if (source) {
    return source.getGradient();
  }

  return null;
};


/**
 * Set the gradient. This value is kept on the source.
 * @param {Array<string>} value
 */
plugin.heatmap.Heatmap.prototype.setGradient = function(value) {
  var source = /** @type {plugin.heatmap.HeatmapSource} */ (this.getSource());
  if (source) {
    source.setGradient(value);
    this.markSourceDirty(plugin.heatmap.HeatmapPropertyType.GRADIENT);
  }
};


/**
 * Marks the source as dirty and fires a change event to force a rerender. Necessary because the heatmap source
 * deliberately avoids rerendering the heatmap as much as possible.
 * @param {string=} opt_eventType Optional type for the style event.
 */
plugin.heatmap.Heatmap.prototype.markSourceDirty = function(opt_eventType) {
  this.pointStyleCache_ = {};
  var source = /** @type {plugin.heatmap.HeatmapSource} */ (this.getSource());
  if (source) {
    source.markDirty();
    os.style.notifyStyleChange(this, undefined, opt_eventType);
  }
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
