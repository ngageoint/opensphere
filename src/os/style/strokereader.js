goog.module('os.style.StrokeReader');
goog.module.declareLegacyNamespace();

const {hashCode} = goog.require('goog.string');
const {asString} = goog.require('ol.color');
const Stroke = goog.require('ol.style.Stroke');
const {DEFAULT_LAYER_COLOR, DEFAULT_STROKE_WIDTH} = goog.require('os.style');
const AbstractReader = goog.require('os.style.AbstractReader');


/**
 * Stroke style reader
 *
 * @extends {AbstractReader<!Stroke>}
 */
class StrokeReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.baseHash = 31 * this.baseHash + hashCode('stroke') >>> 0;
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    var width = /** @type {number|undefined} */ (config['width']) || DEFAULT_STROKE_WIDTH;
    var hash = 31 * this.baseHash + width >>> 0;

    var color = /** @type {string|undefined} */ (config['color']) || DEFAULT_LAYER_COLOR;
    color = asString(color);

    hash = 31 * hash + hashCode(color) >>> 0;

    var dash = /** @type {!Array<number>} */ (config['lineDash']);
    if (dash) {
      hash = 31 * hash + hashCode(dash.join()) >>> 0;
    }

    if (!this.cache[hash]) {
      this.cache[hash] = new Stroke({
        lineDash: dash,
        width: width,
        color: color
      });

      this.cache[hash]['id'] = hash;
    }

    return /** @type {!Stroke} */ (this.cache[hash]);
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    if (style instanceof Stroke) {
      var color = style.getColor();

      var child = {};
      obj['stroke'] = child;

      if (color !== null && color !== undefined) {
        child['color'] = asString(/** @type {Array<number>|string} */ (color));
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
  }
}

exports = StrokeReader;
