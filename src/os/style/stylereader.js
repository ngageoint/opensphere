goog.declareModuleId('os.style.StyleReader');

import Style from 'ol/src/style/Style.js';
import AbstractReader from './abstractreader.js';

const {hashCode} = goog.require('goog.string');


/**
 * Root style reader
 *
 * @extends {AbstractReader<!Style>}
 */
class StyleReader extends AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   *
   * @suppress {checkTypes} To ignore errors caused by Style being a struct.
   */
  getOrCreateStyle(config) {
    var geometry;
    var image;
    var fill;
    var stroke;
    var zIndex;
    var styleIds = [];

    zIndex = /** @type {number|undefined} */ (config['zIndex']) || 0;
    var hash = 31 * this.baseHash + zIndex >>> 0;

    geometry = /** @type {string|undefined} */ (config['geometry']);
    if (geometry) {
      hash = 31 * hash + hashCode(geometry) >>> 0;
    }
    styleIds.push(hash);

    var imageConfig = /** @type {Object.<string, *>|undefined} */ (config['image']);
    if (imageConfig) {
      image = this.readers['image'].getOrCreateStyle(imageConfig);
      styleIds.push(image['id']);
    } else {
      styleIds.push(0);
    }

    var fillConfig = /** @type {Object.<string, *>|undefined} */ (config['fill']);
    if (fillConfig) {
      fill = this.readers['fill'].getOrCreateStyle(fillConfig);
      styleIds.push(fill['id']);
    } else {
      styleIds.push(0);
    }

    var strokeConfig = /** @type {Object.<string, *>|undefined} */ (config['stroke']);
    if (strokeConfig) {
      stroke = this.readers['stroke'].getOrCreateStyle(strokeConfig);
      styleIds.push(stroke['id']);
    } else {
      styleIds.push(0);
    }

    // separate the id's for each style type to avoid collisions in the top-level cache (this one)
    var styleId = styleIds.join('-');
    if (!this.cache[styleId]) {
      this.cache[styleId] = new Style({
        geometry: geometry,
        image: image,
        fill: fill,
        stroke: stroke,
        zIndex: zIndex
      });

      this.cache[styleId]['id'] = styleId;
    }

    return /** @type {!Style} */ (this.cache[styleId]);
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    if (style instanceof Style) {
      var s = /** @type {Style} */ (style);

      var geom = s.getGeometry();

      if (geom) {
        obj['geometry'] = geom;
      }

      var zIndex = s.getZIndex();

      if (zIndex !== undefined && zIndex !== 0) {
        obj['zIndex'] = zIndex;
      }

      var image = s.getImage();
      if (image) {
        this.readers['image'].toConfig(image, obj);
      }

      var fill = s.getFill();
      if (fill) {
        this.readers['fill'].toConfig(fill, obj);
      }

      var stroke = s.getStroke();
      if (stroke) {
        this.readers['stroke'].toConfig(stroke, obj);
      }

      var text = s.getText();
      if (text) {
        this.readers['text'].toConfig(text, obj);
      }
    }
  }
}

export default StyleReader;
