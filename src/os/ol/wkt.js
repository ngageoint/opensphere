goog.module('os.ol.wkt');

const WKT = goog.require('ol.format.WKT');


/**
 * Global reusable instance of the OpenLayers WKT format.
 * @type {!WKT}
 */
const FORMAT = new WKT();

exports = {
  FORMAT
};
