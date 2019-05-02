goog.provide('plugin.file.csv.CSVExporter');
goog.require('goog.log');
goog.require('ol.Feature');
goog.require('ol.format.WKT');
goog.require('ol.geom.SimpleGeometry');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.geo');
goog.require('os.object');
goog.require('os.ol.wkt');
goog.require('os.style');
goog.require('os.ui.file.csv.AbstractCSVExporter');
goog.require('plugin.file.csv.ui.csvExportDirective');



/**
 * The CSV exporter.
 * @extends {os.ui.file.csv.AbstractCSVExporter.<ol.Feature>}
 * @constructor
 */
plugin.file.csv.CSVExporter = function() {
  plugin.file.csv.CSVExporter.base(this, 'constructor');
  this.log = plugin.file.csv.CSVExporter.LOGGER_;

  /**
   * Export the ellipses
   * @type {boolean}
   * @private
   */
  this.exportEllipses_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.alwaysIncludeWkt_ = true;
};
goog.inherits(plugin.file.csv.CSVExporter, os.ui.file.csv.AbstractCSVExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.csv.CSVExporter.LOGGER_ = goog.log.getLogger('plugin.file.csv.CSVExporter');


/**
 * Fields for CSV export.
 * @enum {string}
 */
plugin.file.csv.CSVExporter.FIELDS = {
  START_TIME: 'START_TIME',
  END_TIME: 'END_TIME'
};



/**
 * Get if ellipses should be exported.
 * @return {boolean}
 */
plugin.file.csv.CSVExporter.prototype.getExportEllipses = function() {
  return this.exportEllipses_;
};


/**
 * Set if ellipses should be exported.
 * @param {boolean} value
 */
plugin.file.csv.CSVExporter.prototype.setExportEllipses = function(value) {
  this.exportEllipses_ = value;
};


/**
 * Get the geometry for a feature.
 * @param {ol.Feature} feature The feature
 * @return {ol.geom.GeometryCollection|ol.geom.SimpleGeometry|undefined}
 */
plugin.file.csv.CSVExporter.prototype.getGeometry_ = function(feature) {
  var geometry;
  if (feature) {
    geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (feature.get(os.data.RecordField.GEOM));

    if (geometry) {
      geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (geometry.clone().toLonLat());

      if (this.exportEllipses_) {
        var ellipse = os.feature.createEllipse(feature);
        if (ellipse && !(ellipse instanceof ol.geom.Point)) {
          geometry = /** @type {(ol.geom.SimpleGeometry|undefined)} */ (ellipse);
        }
      }
    }
  }

  return geometry;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVExporter.prototype.getUI = function() {
  return '<csvexport exporter="exporter"></csvexport>';
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVExporter.prototype.processItem = function(item) {
  var result = item == null ? null : {};

  if (this.fields) {
    for (var i = 0, n = this.fields.length; i < n; i++) {
      var field = this.fields[i];
      if (field === os.data.RecordField.TIME) {
        this.writeTime(item, result);
      } else if (!(field in result)) {
        var value = item.get(this.fields[i]);
        if (value == null) {
          value = '';
        }

        if (os.object.isPrimitive(value) && !goog.isArray(value)) {
          result[field] = value;
        }
      }
    }
  }

  this.writeGeometry(item, result);

  return result;
};


/**
 * Get whether to always include WKT geometry in the export
 * @return {boolean} If true, WKT geometry will always be included in the export
 */
plugin.file.csv.CSVExporter.prototype.getAlwaysIncludeWkt = function() {
  return this.alwaysIncludeWkt_;
};


/**
 * Set wheather to always include WKT geometry in the export
 * @param {boolean} newValue Set to true if WKT geometry should always be included in the export
 */
plugin.file.csv.CSVExporter.prototype.setAlwaysIncludeWkt = function(newValue) {
  this.alwaysIncludeWkt_ = newValue;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVExporter.prototype.supportsTime = function() {
  return true;
};


/**
 * Conditionally writes the time field(s) to the result object
 * @param {T} item The items
 * @param {Object.<string, string>} result The Papa item
 * @protected
 * @template T
 */
plugin.file.csv.CSVExporter.prototype.writeTime = function(item, result) {
  var time = item ? /** @type {os.time.ITime|undefined} */ (item.get(os.data.RecordField.TIME)) : null;
  if (time != null) {
    if (os.instanceOf(time, os.time.TimeRange.NAME)) {
      // time ranges need to be put into two separate fields so that we can reimport our own exports
      result[plugin.file.csv.CSVExporter.FIELDS.START_TIME] = time.getStartISOString();
      result[plugin.file.csv.CSVExporter.FIELDS.END_TIME] = time.getEndISOString();
    } else {
      result[os.Fields.TIME] = time.toISOString();
    }
  }
};


/**
 * Conditionally writes the geometry field to the result object
 * @param {T} item The items
 * @param {Object.<string, string>} result The Papa item
 * @protected
 * @template T
 */
plugin.file.csv.CSVExporter.prototype.writeGeometry = function(item, result) {
  var geom = item ? /** @type {ol.geom.SimpleGeometry|undefined} */ (item.getGeometry()) : null;
  if (this.alwaysIncludeWkt_ && geom != null) {
    geom = /** @type {ol.geom.SimpleGeometry|undefined} */ (geom.clone().toLonLat());
    result[os.Fields.GEOMETRY] = os.ol.wkt.FORMAT.writeFeature(item, {
      dataProjection: os.proj.EPSG4326,
      featureProjection: os.map.PROJECTION
    });

    if (this.exportEllipses_) {
      result[os.Fields.SEMI_MAJOR] = item.get(os.Fields.SEMI_MAJOR);
      result[os.Fields.SEMI_MINOR] = item.get(os.Fields.SEMI_MINOR);
    }
  }
};
