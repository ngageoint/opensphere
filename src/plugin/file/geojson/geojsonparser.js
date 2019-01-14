goog.provide('plugin.file.geojson.GeoJSONParser');

goog.require('goog.Disposable');
goog.require('goog.disposable.IDisposable');
goog.require('ol.format.GeoJSON');
goog.require('os.data.ColumnDefinition');
goog.require('os.file.mime.text');
goog.require('os.map');
goog.require('os.parse.IParser');



/**
 * Parses a GeoJSON source
 * @extends {goog.Disposable}
 * @implements {os.parse.IParser<ol.Feature>}
 * @constructor
 */
plugin.file.geojson.GeoJSONParser = function() {
  /**
   * @type {!ol.format.GeoJSON}
   * @private
   */
  this.format_ = new ol.format.GeoJSON();

  /**
   * @type {?Array<GeoJSONObject>}
   */
  this.features = null;

  /**
   * @type {Object<string, !os.data.ColumnDefinition>}
   * @private
   */
  this.columns_ = {};

  /**
   * The index of the next feature to os.parse.
   * @type {number}
   * @protected
   */
  this.nextIndex = 0;

  /**
   * The ID of the data source this is parsing for.
   * @type {?string}
   * @protected
   */
  this.sourceId = null;
};
goog.inherits(plugin.file.geojson.GeoJSONParser, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParser.prototype.disposeInternal = function() {
  plugin.file.geojson.GeoJSONParser.base(this, 'disposeInternal');
  this.cleanup();
};


/**
 * Get the source ID.
 * @return {?string}
 */
plugin.file.geojson.GeoJSONParser.prototype.getSourceId = function() {
  return this.sourceId;
};


/**
 * Set the source ID.
 * @param {?string} value
 */
plugin.file.geojson.GeoJSONParser.prototype.setSourceId = function(value) {
  this.sourceId = value;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParser.prototype.setSource = function(source) {
  this.features = null;
  this.nextIndex = 0;

  var src;
  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  if (goog.isArray(source) && source.length == 1 && (typeof source[0] === 'string' || goog.isObject(source[0]))) {
    // source likely came from a chaining importer
    src = source[0];
  } else if (goog.isObject(source)) {
    src = source;
  } else if (source && typeof source === 'string') {
    // THIN-6240: if the server returns invalid JSON with literal whitespace characters inside tokens, the parser will
    // fail. as a workaround, replace tabs with spaces and strip carriage returns and new lines.
    src = /** @type {Object} */ (JSON.parse(source.replace(/\t/g, ' ').replace(/\r\n/g, '')));
  }

  if (src) {
    if (goog.isArray(src)) {
      // this isn't quite valid GeoJSON, but... no harm no foul?
      this.features = src;
    } else {
      var o = /** @type {GeoJSONObject} */ (src);

      if (o.type == 'FeatureCollection') {
        var c = /** @type {GeoJSONFeatureCollection} */ (o);
        this.features = c.features;
      } else if (o.type) {
        this.features = [o];
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParser.prototype.cleanup = function() {
  this.features = null;
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParser.prototype.hasNext = function() {
  return this.features != null && this.features.length > this.nextIndex;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParser.prototype.parseNext = function() {
  // unshift is very slow in browsers other than Chrome, so leave the array intact while parsing
  var nextFeature = this.features[this.nextIndex++];
  if (nextFeature) {
    var features = this.format_.readFeatures(nextFeature, {
      // We don't set the data projection because that can technically be specified in the GeoJSON. The
      // GeoJSON format has a default projection of EPSG:4326 if one is not specified
      featureProjection: os.map.PROJECTION
    });

    features.forEach(this.process, this);

    return features;
  }

  return null;
};


/**
 * Method for doing additional processing on features parsed by the GeoJSON format.
 * @param {ol.Feature} feature
 */
plugin.file.geojson.GeoJSONParser.prototype.process = goog.nullFunction;


/**
 * Parse a limited set of results from the source
 * @param {Object|null|string} source
 * @param {Array<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features
 * @return {!Array<!ol.Feature>}
 */
plugin.file.geojson.GeoJSONParser.prototype.parsePreview = function(source, opt_mappings) {
  this.setSource(source);
  var count = 25;
  var features = [];
  this.columns_ = {};

  while (this.hasNext() && count--) {
    var featureSet = this.parseNext();

    if (goog.isArray(featureSet)) {
      for (var i = 0, n = featureSet.length; i < n; i++) {
        var feature = featureSet[i];
        feature.setId(String(ol.getUid(feature)));
        features.push(feature);
      }
    }

    var keys = feature.getKeys();
    for (i = 0, n = keys.length; i < n; i++) {
      var field = keys[i];

      if (field && !os.feature.isInternalField(field) && !(field in this.columns_)) {
        var col = new os.data.ColumnDefinition(field);
        col['selectable'] = true;
        col['sortable'] = true;

        this.columns_[field] = col;
      }
    }
  }

  return features;
};


/**
 * @return {Array<os.data.ColumnDefinition>}
 */
plugin.file.geojson.GeoJSONParser.prototype.getColumns = function() {
  if (this.columns_) {
    return goog.object.getValues(this.columns_);
  }
  return [];
};
