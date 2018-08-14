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
os.style.FillReader.prototype.getOrCreateStyle = function(config) {
  var color = /** @type {string|undefined} */ (config['color']) || os.style.DEFAULT_LAYER_COLOR;
  color = ol.color.asString(color);

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
