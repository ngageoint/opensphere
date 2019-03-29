goog.provide('os.style.FillReader');

goog.require('ol.color');
goog.require('ol.style.Fill');
goog.require('os.style');
goog.require('os.style.AbstractReader');



/**
 * Fill style reader
 * @extends {os.style.AbstractReader<!ol.style.Fill>}
 * @constructor
 */
os.style.FillReader = function() {
  os.style.FillReader.base(this, 'constructor');
};
goog.inherits(os.style.FillReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.FillReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  opt_keys = opt_keys || [];
  opt_keys.push('color');
  var color = /** @type {string|undefined} */ (os.style.getValue(opt_keys, configs)) || os.style.DEFAULT_LAYER_COLOR;
  color = this.multiplyColorByOpacity(ol.color.asString(color), configs);
  opt_keys.pop();

  var hash = this.baseHash + goog.string.hashCode(color);
  if (!this.cache[hash]) {
    this.cache[hash] = new ol.style.Fill({
      color: color
    });

    this.cache[hash]['id'] = hash;
  }

  return /** @type {!ol.style.Fill} */ (this.cache[hash]);
};


/**
 * @inheritDoc
 */
os.style.FillReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Fill) {
    var color = style.getColor();

    if (color === undefined || color === null) {
      // nope
      return;
    }

    var child = {};
    obj['fill'] = child;
    child['color'] = ol.color.asString(/** @type {Array<number>|string} */ (color));
  }
};
