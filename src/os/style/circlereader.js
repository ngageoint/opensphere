goog.declareModuleId('os.style.CircleReader');

import Circle from 'ol/src/style/Circle.js';

import {toRgbArray} from '../color.js';
import AbstractReader from './abstractreader.js';
import {DEFAULT_FEATURE_SIZE} from './style.js';

const {hashCode} = goog.require('goog.string');


/**
 * Circle style reader
 *
 * @extends {AbstractReader<!Circle>}
 */
class CircleReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.baseHash = 31 * this.baseHash + hashCode('circle') >>> 0;
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    var fill;
    var stroke;
    var opacity;

    var radius = config['radius'] !== undefined ? /** @type {number} */ (config['radius']) : DEFAULT_FEATURE_SIZE;
    var hash = 31 * this.baseHash + hashCode(radius.toString()) >>> 0;

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
      hash = 31 + hash + hashCode(color) >>> 0;

      var rgbArray = toRgbArray(color);
      if (rgbArray) {
        opacity = rgbArray[3];
      }
    }

    if (!this.cache[hash]) {
      var style = new Circle({
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

    return /** @type {!Circle} */ (this.cache[hash]);
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    if (style instanceof Circle) {
      var cs = /** @type {Circle} */ (style);

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
  }
}

export default CircleReader;
