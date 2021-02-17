goog.module('os.ogc.wmts');
goog.module.declareLegacyNamespace();

const {DATETIME_FORMATS} = goog.require('os.time');


/**
 * Preferred WMTS image formats.
 * @type {!Array<!string>}
 */
const preferredFormats = ['image/vnd.jpeg-png', 'image/png', 'image/jpeg'];


/**
 * Detect WMTS date/time formats.
 * @param {Array<Object>} dimensions Dimensions from the capabilities document.
 * @param {Object<string, *>} config The WMTS config object.
 */
const detectDateTimeFormats = (dimensions, config) => {
  if (dimensions) {
    const timeDimension = dimensions.find(hasTimeExtent);
    if (timeDimension) {
      // note that this assumes that the Units of Measure is ISO8601, but the OL parser
      // does not pull out that information to check it
      let defaultValue = timeDimension['Default'];
      if (defaultValue) {
        let timeFormat = '{start}';

        if (defaultValue.indexOf('/') > -1) {
          defaultValue = defaultValue.split(/\//)[0];
          timeFormat += '/{end}';
        }

        config['dateFormat'] = DATETIME_FORMATS[0].substring(0, defaultValue.length);
        config['timeFormat'] = timeFormat;
      }
    }
  }
};


/**
 * If a dimension has a time extent.
 * @param {Object} dimension The dimension.
 * @return {boolean}
 */
const hasTimeExtent = (dimension) => {
  return !!dimension && /time/i.test(dimension['Identifier']);
};


/**
 * Get the projection from WMTS options.
 * @param {?olx.source.WMTSOptions} options The options.
 * @return {?string} The projection, or null if not defined.
 */
const optionsToProjection = (options) =>
    options && options.projection ? options.projection.getCode() : null;


/**
 * Sort formats based on the preferred order.
 * @param {string} a Format a
 * @param {string} b Format b
 * @return {number} per typical compare function
 */
const sortFormats = (a, b) => {
  let ax = preferredFormats.indexOf(a);
  ax = ax < 0 ? Number.MAX_SAFE_INTEGER : ax;
  let bx = preferredFormats.indexOf(b);
  bx = bx < 0 ? Number.MAX_SAFE_INTEGER : bx;
  return ax - bx;
};


exports = {
  detectDateTimeFormats,
  hasTimeExtent,
  optionsToProjection,
  sortFormats
};
