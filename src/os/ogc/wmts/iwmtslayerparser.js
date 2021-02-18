goog.declareModuleId('os.ogc.wmts.IWMTSLayerParser');

const IOGCDescriptor = goog.requireType('os.ui.ogc.IOGCDescriptor');



/**
 * Interface for parsing WMTS layer objects from OpenLayers.
 * @interface
 */
export default class IWMTSLayerParser {
  /**
   * @param {Object} layer
   * @return {?string}
   */
  parseLayerId(layer) {}

  /**
   * @param {Object} layer
   * @return {?string}
   */
  parseLayerTitle(layer) {}

  /**
   * @param {Object} capabilities The WMTS capabilities object.
   * @param {Object} layer The WMTS layer object.
   * @param {IOGCDescriptor} descriptor The descriptor to update.
   */
  parseLayer(capabilities, layer, descriptor) {}

  /**
   * Parse tile matrix sets.
   * @param {Object} capabilities The WMTS capabilities object.
   */
  parseTileMatrixSets(capabilities) {}
}
