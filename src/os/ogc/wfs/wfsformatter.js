goog.provide('os.ogc.wfs.WFSFormatter');

goog.require('os.config.Settings');
goog.require('os.net.IDataFormatter');
goog.require('os.ogc');



/**
 * Create a WFS request payload.
 * @implements {os.net.IDataFormatter}
 * @constructor
 */
os.ogc.wfs.WFSFormatter = function() {};


/**
 * WFS parameters.
 * @type {!Array<string>}
 * @const
 */
os.ogc.wfs.WFSFormatter.WFS_PARAMS = [
  'filter',
  'maxfeatures',
  'namespace',
  'outputformat',
  'request',
  'resulttype',
  'service',
  'sortby',
  'srsname',
  'typename',
  'version'
];


/**
 * @inheritDoc
 */
os.ogc.wfs.WFSFormatter.prototype.getContentType = function() {
  return 'text/xml';
};


/**
 * @inheritDoc
 */
os.ogc.wfs.WFSFormatter.prototype.format = function(uri) {
  var queryData = uri.getQueryData();
  var keys = queryData.getKeys();

  // save WFS params with a lowercase key and remove them from the query data so they aren't sent in the URL
  var wfsParams = {};
  os.ogc.wfs.WFSFormatter.WFS_PARAMS.forEach(function(p) {
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === p) {
        wfsParams[p] = queryData.get(keys[i]);
        queryData.remove(keys[i]);
        keys.splice(i, 1);
        break;
      }
    }
  });

  // honor the value in the uri params first, then try the application limit. never exceed the server-imposed maximum
  // of 300k features.
  var qdMax = /** @type {number|undefined} */ (wfsParams['maxfeatures']);
  var maxFeatures = Math.min(qdMax != undefined ? qdMax : (os.ogc.getMaxFeatures() + 1), 300000);
  var maxFeaturesString = 'maxFeatures="' + maxFeatures + '"';

  var version = /** @type {string} */ (wfsParams['version']) || '1.1.0';
  var ns = /** @type {string} */ (wfsParams['namespace']) || '';
  var resultType = /** @type {string} */ (wfsParams['resulttype']) || 'results';
  if (resultType == 'hits') {
    maxFeaturesString = ''; // unused for hit count
  }

  var data = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" xmlns:ogc="http://www.opengis.net/ogc" ' +
      ns + ' service="WFS" version="' + version + '" resultType="' + resultType + '" ' + maxFeaturesString;

  var format = /** @type {string} */ (wfsParams['outputformat']);
  if (format) {
    data += ' outputFormat="' + format + '"';
  }

  data += '>';

  var srs = /** @type {string} */ (wfsParams['srsname']) || os.ogc.defaultProjection;
  data += '<wfs:Query srsName="' + srs + '" typeName="' + /** @type {string} */ (wfsParams['typename']) + '">';

  var sort = /** @type {string} */ (wfsParams['sortby']);
  if (sort) {
    data += '<ogc:SortBy>' + sort + '</ogc:SortBy>';
  }

  var filter = /** @type {string} */ (wfsParams['filter']);
  if (filter) {
    data += filter;
  }

  data += '</wfs:Query></wfs:GetFeature>';

  return data;
};
