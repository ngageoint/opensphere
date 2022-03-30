goog.declareModuleId('os.style.ShapeReader');

import RegularShape from 'ol/src/style/RegularShape.js';

import AbstractReader from './abstractreader.js';
import {DEFAULT_FEATURE_SIZE} from './style.js';

const {toRadians} = goog.require('goog.math');
const {hashCode} = goog.require('goog.string');


/**
 * @enum {Object}
 */
const ShapeDefaults = {
  'point': {
    points: 1
  },
  'triangle': {
    points: 3
  },
  'square': {
    angle: toRadians(45),
    points: 4
  }
};

/**
 * Shape style reader
 *
 * @extends {AbstractReader<!RegularShape>}
 */
class ShapeReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.baseHash = 31 * this.baseHash + hashCode('shape') >>> 0;
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    var fill;
    var radius;
    var radius2;
    var stroke;

    var shapeKey = /** @type {string|undefined} */ (config['subType']) || 'point';
    var hash = 31 * this.baseHash + hashCode(shapeKey) >>> 0;

    radius = /** @type {number|undefined} */ (config['radius']);
    if (radius == null) {
      radius = DEFAULT_FEATURE_SIZE;
    }

    // {@link RegularShape} draws to a canvas sized by the radius, and results in drawing features smaller than
    // {@link ol.style.Circle} (points) with the same size. this compensates and produces more consistent results.
    radius = Math.round(radius * ShapeReader.RADIUS_MULTIPLIER);

    hash = 31 * hash + radius >>> 0;

    var fillConfig = /** @type {Object<string, *>|undefined} */ (config['fill']);
    if (fillConfig) {
      fill = this.readers['fill'].getOrCreateStyle(fillConfig);
      hash = 31 * hash + fill['id'] >>> 0;
    }

    var strokeConfig = /** @type {Object<string, *>|undefined} */ (config['stroke']);
    if (strokeConfig) {
      stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
      hash = 31 * hash + stroke['id'] >>> 0;
    }

    if (!this.cache[hash]) {
      var shapeConfig = ShapeDefaults[shapeKey];
      if (shapeConfig && shapeConfig['radius2'] !== undefined) {
        // radius2 should be an offset of radius, in pixels
        radius2 = radius + shapeConfig['radius2'];
      }

      this.cache[hash] = new RegularShape({
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

    return /** @type {!RegularShape} */ (this.cache[hash]);
  }
}

/**
 * Multiplier used to adjust the shape size so it more closely matches point size.
 * @type {number}
 * @const
 */
ShapeReader.RADIUS_MULTIPLIER = 1.33;

export default ShapeReader;
