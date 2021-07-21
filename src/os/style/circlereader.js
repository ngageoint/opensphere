goog.provide('os.style.CircleReader');

goog.require('goog.string');
goog.require('ol.style.Circle');
goog.require('os.color');
goog.require('os.style');
goog.require('os.style.AbstractReader');



/**
 * Circle style reader
 *
 * @extends {os.style.AbstractReader<!ol.style.Circle>}
 * @constructor
 */
os.style.CircleReader = function() {
  os.style.CircleReader.base(this, 'constructor');
  this.baseHash = 31 * this.baseHash + goog.string.hashCode('circle') >>> 0;
};
goog.inherits(os.style.CircleReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.CircleReader.prototype.getOrCreateStyle = function(config) {
  var fill;
  var stroke;
  var opacity;

  var radius = config['radius'] !== undefined ? /** @type {number} */ (config['radius']) :
    os.style.DEFAULT_FEATURE_SIZE;
  var hash = 31 * this.baseHash + goog.string.hashCode(radius.toString()) >>> 0;

  var fillConfig = /** @type {Object.<string, *>|undefined} */ (config['fill']);
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(fillConfig);
    hash = 31 * hash + fill['id'] >>> 0;
  }

  var strokeConfig = /** @type {Object.<string, *>|undefined} */ (config['stroke']);
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
    hash = 31 * hash + stroke['id'] >>> 0;
  }

  var color = /** @type {string} */ (config['color']);
  if (color) {
    hash = 31 + hash + goog.string.hashCode(color) >>> 0;

    var rgbArray = os.color.toRgbArray(color);
    if (rgbArray) {
      opacity = rgbArray[3];
    }
  }

  if (!this.cache[hash]) {
    var style = new ol.style.Circle({
      radius: radius,
      fill: fill,
      stroke: stroke
    });

    if (opacity != null) {
      // set the opacity if it's defined, this is used by the WebGL synchronizers and is not passed by the options
      // up to the parent style class for some reason (???)
      style.setOpacity(opacity);
    }

    this.cache[hash] = style;

    style['id'] = hash;
  }

  return /** @type {!ol.style.Circle} */ (this.cache[hash]);
};


/**
 * @inheritDoc
 */
os.style.CircleReader.prototype.toConfig = function(style, obj) {
  if (style instanceof ol.style.Circle) {
    var cs = /** @type {ol.style.Circle} */ (style);

    obj['type'] = 'circle';
    obj['radius'] = cs.getRadius();

    var fill = cs.getFill();
    if (fill) {
      this.readers['fill'].toConfig(fill, obj);
    }

    var stroke = cs.getStroke();
    if (stroke) {
      this.readers['stroke'].toConfig(stroke, obj);
    }
  }
};
