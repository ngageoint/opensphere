goog.provide('os.ogc.wps');

goog.require('os.net.VariableReplacer');
goog.require('os.time');
goog.require('os.time.TimeRange');
goog.require('os.time.TimeRangePresets');
goog.require('os.time.TimelineController');


/**
 * WPS parameter names
 * @enum {string}
 */
os.ogc.wps.WPSParams = {
  AREA: 'area',
  AREA_NAMES: 'areanames',
  DATA: 'data',
  DATA_INPUTS: 'datainputs',
  ID: 'identifier',
  REQUEST: 'request',
  SERVICE: 'service',
  TIME: 'time',
  TIME_DESCRIPTIONS: 'timeDescriptions',
  VERSION: 'version',
  ROOT_NAME: 'exposedWpsProcesses'
};


/**
 * This method preserves the parameter capitalization since some OGC servers do not implement the OGC spec and use
 * case-sensitive parameters.
 * @param {!goog.Uri.QueryData} params The params object
 * @param {string} key The key
 * @param {*} value The value
 * @param {boolean=} opt_replace If an existing param should be replaced. Defaults to true.
 */
os.ogc.wps.setParam = function(params, key, value, opt_replace) {
  var replace = opt_replace != null ? opt_replace : true;
  var lcKey = key.toLowerCase();
  var keys = params.getKeys();
  var foundKey = null;
  for (var i = 0, n = keys.length; i < n; i++) {
    if (keys[i].toLowerCase() == lcKey) {
      foundKey = keys[i];
      break;
    }
  }

  if (foundKey && replace) {
    params.set(foundKey, value);
  } else if (!foundKey) {
    params.set(key, value);
  }
};
