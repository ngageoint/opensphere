goog.module('os.style.FillReader');
goog.module.declareLegacyNamespace();

const {hashCode} = goog.require('goog.string');
const {asString} = goog.require('ol.color');
const Fill = goog.require('ol.style.Fill');
const osStyle = goog.require('os.style');
const AbstractReader = goog.require('os.style.AbstractReader');


/**
 * Fill style reader
 *
 * @extends {AbstractReader<!Fill>}
 */
class FillReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.baseHash = 31 * this.baseHash + hashCode('fill') >>> 0;
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    var color = /** @type {string|undefined} */ (config['color']) || osStyle.DEFAULT_LAYER_COLOR;
    color = asString(color);

    var hash = 31 * this.baseHash + hashCode(color) >>> 0;
    if (!this.cache[hash]) {
      this.cache[hash] = new Fill({
        color: color
      });

      this.cache[hash]['id'] = hash;
    }

    return /** @type {!Fill} */ (this.cache[hash]);
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    if (style instanceof Fill) {
      var color = style.getColor();

      if (color === undefined || color === null) {
        // nope
        return;
      }

      var child = {};
      obj['fill'] = child;
      child['color'] = asString(/** @type {Array<number>|string} */ (color));
    }
  }
}

exports = FillReader;
