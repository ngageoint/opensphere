goog.provide('os.style.CircleReader');

goog.require('ol.style.Circle');
goog.require('os.style');
goog.require('os.style.AbstractReader');



/**
 * Circle style reader
 * @extends {os.style.AbstractReader<!ol.style.Circle>}
 * @constructor
 */
os.style.CircleReader = function() {
  os.style.CircleReader.base(this, 'constructor');
};
goog.inherits(os.style.CircleReader, os.style.AbstractReader);


/**
 * @inheritDoc
 */
os.style.CircleReader.prototype.getOrCreateStyle = function(configs, opt_keys) {
  opt_keys = opt_keys || [];
  var fill;
  var stroke;

  opt_keys.push('radius');
  var radius = /** @type {number} */ (os.style.getValue(opt_keys, configs));
  radius = radius == null ? os.style.DEFAULT_FEATURE_SIZE : radius;
  var hash = this.baseHash + radius;
  opt_keys.pop();

  opt_keys.push('fill');
  var fillConfig = /** @type {Object.<string, *>|undefined} */ (os.style.getValue(opt_keys, configs));
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(configs, opt_keys);
    hash += fill['id'];
  }
  opt_keys.pop();

  opt_keys.push('stroke');
  var strokeConfig = /** @type {Object.<string, *>|undefined} */ (os.style.getValue(opt_keys, configs));
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(configs, opt_keys);
    hash += stroke['id'];
  }
  opt_keys.pop();

  if (!this.cache[hash]) {
    this.cache[hash] = new ol.style.Circle({
      radius: radius,
      fill: fill,
      stroke: stroke
    });

    this.cache[hash]['id'] = hash;
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
