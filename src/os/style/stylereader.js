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
 * @const
 * @type {Array}
 * @private
 */
os.style.StyleReader.scratchStyleIds_ = [];


/**
 * @const
 * @type {Array<string>}
 * @private
 */
os.style.StyleReader.scratchKeys_ = [];


/**
 * @inheritDoc
 *
 * @suppress {checkTypes} To ignore errors caused by ol.style.Style being a struct.
 */
os.style.StyleReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  var geometry;
  var image;
  var fill;
  var stroke;
  var zIndex;
  var styleIds = os.style.StyleReader.scratchStyleIds_;
  styleIds.length = 0;

  var keys = os.style.StyleReader.scratchKeys_;
  keys.length = 0;

  keys.push('zIndex');
  zIndex = /** @type {number|undefined} */ (os.style.getValue(keys, configs)) || 0;
  var hash = this.baseHash + zIndex;
  keys.pop();

  keys.push('geometry');
  geometry = /** @type {string|undefined} */ (os.style.getValue(keys, configs));
  if (geometry) {
    hash += goog.string.hashCode(geometry);
  }
  styleIds.push(hash);
  keys.pop();

  keys.push('image');
  var imageConfig = /** @type {Object.<string, *>|undefined} */ (os.style.getValue(keys, configs));
  if (imageConfig) {
    image = this.readers['image'].getOrCreateStyle(configs, keys);
    styleIds.push(image['id']);
  } else {
    styleIds.push(0);
  }
  keys.pop();

  keys.push('fill');
  var fillConfig = /** @type {Object.<string, *>|undefined} */ (os.style.getValue(keys, configs));
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(configs, keys);
    styleIds.push(fill['id']);
  } else {
    styleIds.push(0);
  }
  keys.pop();

  keys.push('stroke');
  var strokeConfig = /** @type {Object.<string, *>|undefined} */ (os.style.getValue(keys, configs));
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(configs, keys);
    styleIds.push(stroke['id']);
  } else {
    styleIds.push(0);
  }
  keys.pop();

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

    if (zIndex !== undefined && zIndex !== 0) {
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
