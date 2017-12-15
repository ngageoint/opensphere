goog.provide('plugin.file.geojson.GeoJSONTypeMethod');

goog.require('os.file.IContentTypeMethod');



/**
 * @constructor
 * @implements {os.file.IContentTypeMethod}
 */
plugin.file.geojson.GeoJSONTypeMethod = function() {
};


/**
 * Test if a string starts with a { or [.
 * @type {RegExp}
 * @const
 */
plugin.file.geojson.GeoJSONTypeMethod.STARTS_WITH = /^[{\[]/;


/**
 * Test if a string ends with a } or ].
 * @type {RegExp}
 * @const
 */
plugin.file.geojson.GeoJSONTypeMethod.ENDS_WITH = /[}\]]$/;


/**
 * Test if a string contains a Feature* type.
 * @type {RegExp}
 * @const
 */
plugin.file.geojson.GeoJSONTypeMethod.FEATURE_TYPE = /"type"\s*:\s*"Feature/;


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONTypeMethod.prototype.getContentType = function() {
  return 'application/vnd.geo+json';
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONTypeMethod.prototype.getLayerType = function() {
  return 'GeoJSON';
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONTypeMethod.prototype.getPriority = function() {
  return -50;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  // GeoJSON does not currently support zipped content
  if (!opt_zipEntries) {
    var score = 0;

    // check content type
    var type = file.getContentType();
    if (type == this.getContentType() || type == 'application/json') {
      score += 3;
    }

    // check file extension
    var name = file.getFileName();
    if (name && goog.string.endsWith(name, '.geojson')) {
      score += 7;
    }

    if (name && goog.string.endsWith(name, '.json')) {
      score += 3;
    }

    // check contents
    var contents = file.getContent();
    if (typeof contents == 'string') {
      contents = contents.trim();

      if (contents && plugin.file.geojson.GeoJSONTypeMethod.STARTS_WITH.test(contents) &&
          plugin.file.geojson.GeoJSONTypeMethod.ENDS_WITH.test(contents)) {
        score += 3;

        if (plugin.file.geojson.GeoJSONTypeMethod.FEATURE_TYPE.test(contents)) {
          score += 10;
        }
      }
    }

    return score > 10;
  }

  return false;
};
