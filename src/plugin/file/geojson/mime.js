goog.declareModuleId('plugin.file.geojson.mime');

import * as mime from '../../../os/file/mime.js';
import * as json from '../../../os/file/mime/json.js';
import {isObject} from '../../../os/object/object.js';

const Promise = goog.require('goog.Promise');
const GeoJSON = goog.require('ol.format.GeoJSON');

const {default: OSFile} = goog.requireType('os.file.File');


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
  if (type === 'FeatureCollection' || type === 'Feature' || type in GeoJSON.GEOMETRY_READERS_) {
    return true;
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var val = obj[key];
      if (isObject(val) || Array.isArray(val)) {
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
