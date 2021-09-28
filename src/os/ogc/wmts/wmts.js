goog.declareModuleId('os.ogc.wmts');

import {DATETIME_FORMATS} from '../../time/time.js';


/**
 * Preferred WMTS image formats.
 * @type {!Array<!string>}
 */
const preferredFormats = ['image/vnd.jpeg-png', 'image/png', 'image/jpeg'];


/**
 * @typedef {{
 *   dateFormat: string,
 *   timeFormat: string
 * }}
 */
export let WMTSDateTimeFormats;

/**
 * Detect WMTS date/time formats.
 * @param {Array<Object>} dimensions Dimensions from the capabilities document.
 * @return {!WMTSDateTimeFormats} config The WMTS config object.
 */
export const detectDateTimeFormats = (dimensions) => {
  const result = {
    dateFormat: '',
    timeFormat: ''
  };

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

        result.dateFormat = DATETIME_FORMATS[0].substring(0, defaultValue.length);
        result.timeFormat = timeFormat;
      }
    }
  }

  return result;
};

/**
 * Get the time key from a set of WMTS dimensions.
 * @param {Object} dimensions The dimensions.
 * @return {?string} The key, or null if not found.
 */
export const getTimeKey = (dimensions) => {
  if (dimensions) {
    for (const key in dimensions) {
      if (/time/i.test(key)) {
        return key;
      }
    }
  }

  return null;
};

/**
 * If a dimension has a time extent.
 * @param {Object} dimension The dimension.
 * @return {boolean}
 */
export const hasTimeExtent = (dimension) => {
  return !!dimension && /time/i.test(dimension['Identifier']);
};

/**
 * Get the projection from WMTS options.
 * @param {?olx.source.WMTSOptions} options The options.
 * @return {?string} The projection, or null if not defined.
 */
export const optionsToProjection = (options) =>
    options && options.projection ? options.projection.getCode() : null;

/**
 * Sort formats based on the preferred order.
 * @param {string} a Format a
 * @param {string} b Format b
 * @return {number} per typical compare function
 */
export const sortFormats = (a, b) => {
  let ax = preferredFormats.indexOf(a);
  ax = ax < 0 ? Number.MAX_SAFE_INTEGER : ax;
  let bx = preferredFormats.indexOf(b);
  bx = bx < 0 ? Number.MAX_SAFE_INTEGER : bx;
  return ax - bx;
};
