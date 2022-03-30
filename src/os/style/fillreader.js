goog.declareModuleId('os.style.FillReader');

import {asString} from 'ol/src/color.js';
import Fill from 'ol/src/style/Fill.js';

import AbstractReader from './abstractreader.js';
import * as osStyle from './style.js';

const {hashCode} = goog.require('goog.string');


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

export default FillReader;
