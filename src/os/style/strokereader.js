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
};
goog.inherits(os.style.StrokeReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.StrokeReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  opt_keys = opt_keys || [];

  opt_keys.push('width');
  var width = /** @type {number|undefined} */ (os.style.getValue(opt_keys, configs)) || os.style.DEFAULT_STROKE_WIDTH;
  var hash = this.baseHash + width;
  opt_keys.pop();

  opt_keys.push('color');
  var color = /** @type {string|undefined} */ (os.style.getValue(opt_keys, configs)) || os.style.DEFAULT_LAYER_COLOR;
  color = this.multiplyColorByOpacity(ol.color.asString(color), configs);
  hash += goog.string.hashCode(color);
  opt_keys.pop();

  if (!this.cache[hash]) {
    this.cache[hash] = new ol.style.Stroke({
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
  }
};
