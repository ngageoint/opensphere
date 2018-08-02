goog.provide('os.style.StyleReader');

goog.require('ol.style.Style');
goog.require('os.style');
goog.require('os.style.AbstractReader');



/**
 * Root style reader
 * @extends {os.style.AbstractReader<!ol.style.Style>}
 * @constructor
 */
os.style.StyleReader = function() {
  os.style.StyleReader.base(this, 'constructor');
};
goog.inherits(os.style.StyleReader, os.style.AbstractReader);


/**
 * @inheritDoc
 *
 * @suppress {checkTypes} To ignore errors caused by ol.style.Style being a struct.
 */
os.style.StyleReader.prototype.getOrCreateStyle = function(config) {
  var geometry;
  var image;
  var fill;
  var stroke;
  var zIndex;
  var styleIds = [];

  zIndex = /** @type {number|undefined} */ (config['zIndex']) || 0;
  var hash = this.baseHash + zIndex;

  geometry = /** @type {string|undefined} */ (config['geometry']);
  if (geometry) {
    hash += goog.string.hashCode(geometry);
  }
  styleIds.push(hash);

  var imageConfig = /** @type {Object.<string, *>|undefined} */ (config['image']);
  if (imageConfig) {
    image = this.readers['image'].getOrCreateStyle(imageConfig);
    styleIds.push(image['id']);
  } else {
    styleIds.push(0);
  }

  var fillConfig = /** @type {Object.<string, *>|undefined} */ (config['fill']);
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(fillConfig);
    styleIds.push(fill['id']);
  } else {
    styleIds.push(0);
  }

  var strokeConfig = /** @type {Object.<string, *>|undefined} */ (config['stroke']);
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
    styleIds.push(stroke['id']);
  } else {
    styleIds.push(0);
  }

  // separate the id's for each style type to avoid collisions in the top-level cache (this one)
  var styleId = styleIds.join('-');
  if (!this.cache[styleId]) {
    this.cache[styleId] = new ol.style.Style({
      geometry: geometry,
      image: image,
      fill: fill,
      stroke: stroke,
      zIndex: zIndex
    });

    this.cache[styleId]['id'] = styleId;
  }

  return /** @type {!ol.style.Style} */ (this.cache[styleId]);
};


/**
 * @inheritDoc
 */
os.style.StyleReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Style) {
    var s = /** @type {ol.style.Style} */ (style);

    var geom = s.getGeometry();

    if (geom) {
      obj['geometry'] = geom;
    }

    var zIndex = s.getZIndex();

    if (goog.isDef(zIndex) && zIndex !== 0) {
      obj['zIndex'] = zIndex;
    }

    var image = s.getImage();
    if (image) {
      this.readers['image'].toConfig(image, obj);
    }

    var fill = s.getFill();
    if (fill) {
      this.readers['fill'].toConfig(fill, obj);
    }

    var stroke = s.getStroke();
    if (stroke) {
      this.readers['stroke'].toConfig(stroke, obj);
    }
  }
};
