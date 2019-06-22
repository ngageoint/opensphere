goog.provide('os.style.StrokeReader');

goog.require('ol.color');
goog.require('ol.style.Stroke');
goog.require('os.style');
goog.require('os.style.AbstractReader');



/**
 * Stroke style reader
 * @extends {os.style.AbstractReader<!ol.style.Stroke>}
 * @constructor
 */
os.style.StrokeReader = function() {
  os.style.StrokeReader.base(this, 'constructor');
  this.baseHash = 31 * this.baseHash + goog.string.hashCode('stroke') >>> 0;
};
goog.inherits(os.style.StrokeReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.StrokeReader.prototype.getOrCreateStyle = function(config) {
  var width = /** @type {number|undefined} */ (config['width']) || os.style.DEFAULT_STROKE_WIDTH;
  var hash = 31 * this.baseHash + width >>> 0;

  var color = /** @type {string|undefined} */ (config['color']) || os.style.DEFAULT_LAYER_COLOR;
  color = ol.color.asString(color);

  hash = 31 * hash + goog.string.hashCode(color) >>> 0;

  var dash = /** @type {!Array<number>} */ (config['lineDash']);
  if (dash) {
    hash = 31 * hash + goog.string.hashCode(dash.join()) >>> 0;
  }

  if (!this.cache[hash]) {
    this.cache[hash] = new ol.style.Stroke({
      lineDash: dash,
      width: width,
      color: color
    });

    this.cache[hash]['id'] = hash;
  }

  return /** @type {!ol.style.Stroke} */ (this.cache[hash]);
};


/**
 * @inheritDoc
 */
os.style.StrokeReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Stroke) {
    var color = style.getColor();

    var child = {};
    obj['stroke'] = child;

    if (color !== null && color !== undefined) {
      child['color'] = ol.color.asString(/** @type {Array<number>|string} */ (color));
    }

    var width = style.getWidth();
    if (width !== null && width !== undefined) {
      child['width'] = width;
    }

    var dash = style.getLineDash();
    if (dash !== null && dash !== undefined) {
      child['lineDash'] = dash;
    }
  }
};
