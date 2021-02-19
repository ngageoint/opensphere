goog.declareModuleId('os.ogc.wmts.AbstractWMTSLayerParser');

const {default: IWMTSLayerParser} = goog.requireType('os.ogc.wmts.IWMTSLayerParser');


/**
 * Abstract WMTS layer parser.
 * @implements {IWMTSLayerParser}
 * @abstract
 */
export default class AbstractWMTSLayerParser {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  parseLayerId(layer) {
    return layer && /** @type {string} */ (layer['Identifier']) || null;
  }

  /**
   * @inheritDoc
   */
  parseLayerTitle(layer) {
    return layer && /** @type {string} */ (layer['Title']) || null;
  }
}
