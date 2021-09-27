goog.declareModuleId('os.ogc.wmts.IWMTSLayerParser');

const {default: IOGCDescriptor} = goog.requireType('os.ui.ogc.IOGCDescriptor');


/**
 * Interface for parsing WMTS layer objects from OpenLayers.
 * @interface
 */
export default class IWMTSLayerParser {
  /**
   * Initialize the parser from the WMTS capabilities object.
   * @param {Object} capabilities The WMTS capabilities object.
   */
  initialize(capabilities) {}

  /**
   * Parse the identifier from the Layer object.
   * @param {Object} layer The Layer object.
   * @return {?string}
   */
  parseLayerId(layer) {}

  /**
   * Parse the title from the Layer object.
   * @param {Object} layer The Layer object.
   * @return {?string}
   */
  parseLayerTitle(layer) {}

  /**
   * Parse the Layer object and update an OGC descriptor.
   * @param {Object} capabilities The WMTS capabilities object.
   * @param {Object} layer The WMTS layer object.
   * @param {IOGCDescriptor} descriptor The descriptor to update.
   */
  parseLayer(capabilities, layer, descriptor) {}
}
