goog.provide('plugin.file.csv.CSVParser');

goog.require('goog.array');
goog.require('ol.Feature');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.RecordField');
goog.require('os.ui.file.csv.AbstractCsvParser');



/**
 * A CSV parser driven by PapaParse.
 * @param {plugin.file.csv.CSVParserConfig} config
 * @extends {os.ui.file.csv.AbstractCsvParser.<ol.Feature>}
 * @constructor
 */
plugin.file.csv.CSVParser = function(config) {
  plugin.file.csv.CSVParser.base(this, 'constructor', config);
};
goog.inherits(plugin.file.csv.CSVParser, os.ui.file.csv.AbstractCsvParser);


/**
 * @inheritDoc
 */
plugin.file.csv.CSVParser.prototype.parsePreview = function(source, opt_mappings) {
  this.columns.length = 0;

  // parse a subset of the source for immediate consumption
  source = this.prepareSource(source);
  var results = Papa.parse(source, {
    'comments': this.config['commentChar'] || false,
    'preview': os.ui.file.csv.AbstractCsvParser.PREVIEW_SIZE,
    'delimiter': this.config['delimiter'],
    'dynamicTyping': false,
    'header': this.config['useHeader']
  });

  var features = [];
  if (results && results.data && results.data.length > 0) {
    this.preprocessResults(results);

    for (var i = 0, n = results.data.length; i < n; i++) {
      var feature = this.processResult(results.data[i], opt_mappings);
      if (feature) {
        features.push(feature);
      }
    }

    if (opt_mappings) {
      if (features && features.length > 0) {
        this.updateColumnsFromFeature_(features[0]);
      }
    } else {
      this.updateColumnsFromResults(results);
    }
  }

  return features;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVParser.prototype.processResult = function(result, opt_mappings) {
  var feature = new ol.Feature(result);

  if (this.config['ignoreMissingGeomRows']) {
    var mappings = goog.isDefAndNotNull(opt_mappings) ? opt_mappings : this.config['mappings'];
    var latField = os.im.mapping.LatMapping.ID;
    var lonField = os.im.mapping.LonMapping.ID;

    if (mappings) { // see if lat lon was mapped to something else
      for (var i = 0; i < mappings.length; i++) {
        if (mappings[i].getId() == os.im.mapping.LatMapping.ID) {
          latField = mappings[i].field;
        } else if (mappings[i].getId() == os.im.mapping.LonMapping.ID) {
          lonField = mappings[i].field;
        } else if (mappings[i] instanceof os.im.mapping.PositionMapping ||
            mappings[i] instanceof os.im.mapping.WKTMapping) {
          latField = mappings[i].field;
          lonField = mappings[i].field;
        }
      }
    }

    var lat = /** @type {string} */ (feature.get(latField));
    var lon = /** @type {string} */ (feature.get(lonField));

    // if both lat and lon aren't set, throw the feature out
    if (goog.isDefAndNotNull(lat) && goog.isDefAndNotNull(lon)) {
      if (goog.string.isEmpty(lat) || goog.string.isEmpty(lon)) {
        return null;
      }
    } else {
      return null;
    }
  }

  feature.setId(String(ol.getUid(feature)));
  return feature;
};


/**
 * Determines columns from a feature. Useful when mappings are applied that change the feature properties.
 * @param {ol.Feature} feature
 * @private
 */
plugin.file.csv.CSVParser.prototype.updateColumnsFromFeature_ = function(feature) {
  this.columns.length = 0;

  var hasTime = false;

  if (goog.isDefAndNotNull(feature.get(os.data.RecordField.TIME))) {
    var timeColumn = new os.data.ColumnDefinition(os.data.RecordField.TIME);
    timeColumn['id'] = 'TIME';
    timeColumn['name'] = 'TIME';
    timeColumn['selectable'] = false;
    timeColumn['sortable'] = false;
    this.columns.push(timeColumn);

    hasTime = true;
  }

  var properties = feature.getProperties();
  for (var key in properties) {
    if (!os.feature.isInternalField(key) && (!hasTime || key != 'TIME')) {
      var col = new os.data.ColumnDefinition(key);
      col['selectable'] = false;
      col['sortable'] = false;
      this.columns.push(col);
    }
  }
};
