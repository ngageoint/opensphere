goog.declareModuleId('os.ol.wkt');

const WKT = goog.require('ol.format.WKT');


/**
 * Global reusable instance of the OpenLayers WKT format.
 * @type {!WKT}
 */
export const FORMAT = new WKT();
