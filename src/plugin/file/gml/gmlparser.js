goog.provide('plugin.file.gml.GMLParser');

goog.require('goog.log');
goog.require('ol.format.GML2');
goog.require('ol.format.GML3');
goog.require('os.data.ColumnDefinition');
goog.require('os.parse.IParser');
goog.require('os.ui.file.gml.GMLParser');



/**
 * @extends {os.ui.file.gml.GMLParser}
 * @constructor
 */
plugin.file.gml.GMLParser = function() {
  plugin.file.gml.GMLParser.base(this, 'constructor');
};
goog.inherits(plugin.file.gml.GMLParser, os.ui.file.gml.GMLParser);


/**
 * Fields to ignore when creating the column list.
 * @type {RegExp}
 * @private
 * @const
 */
plugin.file.gml.GMLParser.SKIPPED_COLUMNS_ = /^(geometry|recordtime|time|styleurl)$/i;


/**
 * @inheritDoc
 */
plugin.file.gml.GMLParser.prototype.getProjection = function() {
  return /** @type {!ol.proj.Projection} */ (os.map.PROJECTION);
};


/**
 * dispose
 */
plugin.file.gml.GMLParser.prototype.dispose = function() {
  this.cleanup();
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLParser.prototype.cleanup = function() {
  this.features = null;
  this.nextIndex = 0;
};


/**
 * Parse a limited set of results from the source
 * @param {Object|null|string} source
 * @param {Array<os.im.mapping.IMapping>=} opt_mappings The set of mappings to apply to parsed features
 * @return {!Array<!ol.Feature>}
 */
plugin.file.gml.GMLParser.prototype.parsePreview = function(source, opt_mappings) {
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
 * Get columns detected in the GML
 * @return {Array<!os.data.ColumnDefinition>}
 */
plugin.file.gml.GMLParser.prototype.getColumns = function() {
  if (!this.columns_ && this.columnMap_) {
    // translate the column map into slickgrid columns
    this.columns_ = [];

    for (var column in this.columnMap_) {
      if (column === os.data.RecordField.TIME) {
        // display the recordTime field as TIME
        this.columns_.push(new os.data.ColumnDefinition(os.Fields.TIME, os.data.RecordField.TIME));
      } else if (!plugin.file.gml.GMLParser.SKIPPED_COLUMNS_.test(column)) {
        this.columns_.push(new os.data.ColumnDefinition(column));
      }
    }

    this.columnMap_ = null;
  }

  return this.columns_;
};
