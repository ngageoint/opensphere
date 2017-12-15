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
os.style.CircleReader.prototype.getOrCreateStyle = function(config) {
  var fill;
  var stroke;

  var radius = goog.isDef(config['radius']) ? /** @type {number} */ (config['radius']) :
      os.style.DEFAULT_FEATURE_SIZE;
  var hash = this.baseHash + radius;

  var fillConfig = /** @type {Object.<string, *>|undefined} */ (config['fill']);
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(fillConfig);
    hash += fill['id'];
  }

  var strokeConfig = /** @type {Object.<string, *>|undefined} */ (config['stroke']);
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
    hash += stroke['id'];
  }

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
