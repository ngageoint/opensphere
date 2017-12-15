goog.provide('os.style.ShapeReader');
goog.require('goog.math');
goog.require('ol.style.RegularShape');
goog.require('os.style');
goog.require('os.style.AbstractReader');


/**
 * @enum {Object}
 */
os.style.ShapeDefaults = {
  'point': {
    points: 1
  },
  'triangle': {
    points: 3
  },
  'square': {
    angle: goog.math.toRadians(45),
    points: 4
  }
};



/**
 * Shape style reader
 * @extends {os.style.AbstractReader<!ol.style.RegularShape>}
 * @constructor
 */
os.style.ShapeReader = function() {
  os.style.ShapeReader.base(this, 'constructor');
};
goog.inherits(os.style.ShapeReader, os.style.AbstractReader);


/**
 * Multiplier used to adjust the shape size so it more closely matches point size.
 * @type {number}
 * @const
 */
os.style.ShapeReader.RADIUS_MULTIPLIER = 1.33;


/**
 * @inheritDoc
 */
os.style.ShapeReader.prototype.getOrCreateStyle = function(config) {
  var fill;
  var radius;
  var radius2;
  var stroke;

  var shapeKey = /** @type {string|undefined} */ (config['subType']) || 'point';
  var hash = this.baseHash + goog.string.hashCode(shapeKey);

  radius = /** @type {number|undefined} */ (config['radius']);
  if (radius == null) {
    radius = os.style.DEFAULT_FEATURE_SIZE;
  }

  // {@link ol.style.RegularShape} draws to a canvas sized by the radius, and results in drawing features smaller than
  // {@link ol.style.Circle} (points) with the same size. this compensates and produces more consistent results.
  radius = Math.round(radius * os.style.ShapeReader.RADIUS_MULTIPLIER);

  hash += radius;

  var fillConfig = /** @type {Object<string, *>|undefined} */ (config['fill']);
  if (fillConfig) {
    fill = this.readers['fill'].getOrCreateStyle(fillConfig);
    hash += fill['id'];
  }

  var strokeConfig = /** @type {Object<string, *>|undefined} */ (config['stroke']);
  if (strokeConfig) {
    stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
    hash += stroke['id'];
  }

  if (!this.cache[hash]) {
    var shapeConfig = os.style.ShapeDefaults[shapeKey];
    if (shapeConfig && goog.isDef(shapeConfig['radius2'])) {
      // radius2 should be an offset of radius, in pixels
      radius2 = radius + shapeConfig['radius2'];
    }

    this.cache[hash] = new ol.style.RegularShape({
      angle: shapeConfig['angle'],
      fill: fill,
      points: shapeConfig['points'],
      radius: radius,
      radius2: radius2,
      snapToPixel: shapeConfig['snapToPixel'],
      stroke: stroke
    });
    this.cache[hash]['id'] = hash;
  }

  return /** @type {!ol.style.RegularShape} */ (this.cache[hash]);
};
