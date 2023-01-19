goog.declareModuleId('plugin.file.geojson.mime');

import GeoJSON from 'ol/src/format/GeoJSON.js';

import * as json from '../../../os/file/mime/json.js';
import * as mime from '../../../os/file/mime.js';


const Promise = goog.require('goog.Promise');


/**
 * @type {string}
 */
export const TYPE = 'application/vnd.geo+json';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const isGeoJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && find_(/** @type {Object|null} */ (opt_context))) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

/**
 * @param {Array|Object} obj
 * @return {boolean}
 * @suppress {accessControls}
 */
const find_ = function(obj) {
  var type = obj['type'];
  if (type) {
    if (type === 'FeatureCollection' || type === 'Feature' || type in GeoJSON.GEOMETRY_READERS_) {
      return true;
    }
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var val = obj[key];
      if (goog.isObject(val) || Array.isArray(val)) {
        var retVal = find_(val);
        if (retVal) {
          return retVal;
        }
      }
    }
  }

  return false;
};


mime.register(TYPE, isGeoJSON, 0, json.TYPE);
