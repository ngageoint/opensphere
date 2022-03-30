goog.declareModuleId('os.style.TextReader');

import {asString} from 'ol/src/color.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Text from 'ol/src/style/Text.js';

import AbstractReader from './abstractreader.js';
import {getFont} from './label.js';
import StyleField from './stylefield.js';

/**
 * Label style reader
 *
 * @extends {AbstractReader<!Text>}
 */
class TextReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getOrCreateStyle(config) {
    var text = /** @type {string|undefined} */ (config['text']);
    var textAlign = /** @type {string|undefined} */ (config['textAlign']) || 'center';
    var textBaseline = /** @type {string|undefined} */ (config['textBaseline']) || 'middle';
    var font = /** @type {string|undefined} */ (config['font']) || getFont();

    var fillColor;
    var stroke;
    var strokeColor;

    // OpenSphere represents fill/stroke color as a direct property, while style parsers like ol-mapbox-style represent
    // fill/stroke as an object with a color property. Support both, preferring the OpenSphere value.
    if (config['fillColor']) {
      fillColor = /** @type {string} */ (config['fillColor']);
    } else if (config['fill'] && config['fill']['color']) {
      fillColor = /** @type {string} */ (config['fill']['color']);
    } else {
      fillColor = 'rgba(255,255,255,1)';
    }

    if (config['strokeColor']) {
      strokeColor = /** @type {string} */ (config['strokeColor']);
    } else if (config['stroke'] && config['stroke']['color']) {
      strokeColor = /** @type {string} */ (config['stroke']['color']);
    } else if (config['stroke'] !== null) {
      // Set stroke to null for no stroke, undefined for default stroke.
      strokeColor = 'rgba(0,0,0,1)';
    }

    if (strokeColor) {
      var strokeWidth = config['strokeWidth'] !== undefined ? /** @type {number} */ (config['strokeWidth']) : 2;
      stroke = new Stroke({
        color: strokeColor,
        width: strokeWidth
      });
    }

    var offsetX = config['offsetX'] !== undefined ? /** @type {number} */ (config['offsetX']) : 0;
    var offsetY = config['offsetY'] !== undefined ? /** @type {number} */ (config['offsetY']) : 0;
    var placement = /** @type {TextPlacement|undefined} */ (config['placement']);

    // do not cache text styles so they can be modified directly for text/color changes. these will be cached on each
    // feature instead.
    return new Text({
      text: text,
      textAlign: textAlign,
      textBaseline: textBaseline,
      font: font,
      fill: new Fill({
        color: fillColor
      }),
      stroke: stroke,
      offsetX: offsetX,
      offsetY: offsetY,
      placement: placement
    });
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    if (style instanceof Text) {
      const fill = style.getFill();
      if (fill) {
        // Set the same field vector label controls use to override the color. This will ensure highlight/select still
        // work properly, or any UI that might want to change the label color.
        obj[StyleField.LABEL_COLOR] = asString(/** @type {Array<number>|string} */ (fill.getColor()));
      }
    }
  }
}

export default TextReader;
