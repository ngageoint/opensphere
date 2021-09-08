goog.module('plugin.file.csv.CSVExporter');

const log = goog.require('goog.log');
const Point = goog.require('ol.geom.Point');
const Fields = goog.require('os.Fields');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const instanceOf = goog.require('os.instanceOf');
const osMap = goog.require('os.map');
const osObject = goog.require('os.object');
const wkt = goog.require('os.ol.wkt');
const osProj = goog.require('os.proj');
const TimeRange = goog.require('os.time.TimeRange');
const AbstractCSVExporter = goog.require('os.ui.file.csv.AbstractCSVExporter');
const {directiveTag: exportUi} = goog.require('plugin.file.csv.ui.CSVExportUI');

const Logger = goog.requireType('goog.log.Logger');
const Feature = goog.requireType('ol.Feature');
const SimpleGeometry = goog.requireType('ol.geom.SimpleGeometry');


/**
 * The CSV exporter.
 *
 * @extends {AbstractCSVExporter.<Feature>}
 */
class CSVExporter extends AbstractCSVExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

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
  }

  /**
   * Get if ellipses should be exported.
   *
   * @return {boolean}
   */
  getExportEllipses() {
    return this.exportEllipses_;
  }

  /**
   * Set if ellipses should be exported.
   *
   * @param {boolean} value
   */
  setExportEllipses(value) {
    this.exportEllipses_ = value;
  }

  /**
   * Get the geometry for a feature.
   *
   * @param {Feature} feature The feature
   * @return {ol.geom.GeometryCollection|SimpleGeometry|undefined}
   */
  getGeometry_(feature) {
    var geometry;
    if (feature) {
      geometry = /** @type {(SimpleGeometry|undefined)} */ (feature.get(RecordField.GEOM));

      if (geometry) {
        geometry = /** @type {(SimpleGeometry|undefined)} */ (geometry.clone().toLonLat());

        if (this.exportEllipses_) {
          var ellipse = osFeature.createEllipse(feature);
          if (ellipse && !(ellipse instanceof Point)) {
            geometry = /** @type {(SimpleGeometry|undefined)} */ (ellipse);
          }
        }
      }
    }

    return geometry;
  }

  /**
   * @inheritDoc
   */
  getUI() {
    return `<${exportUi} exporter="exporter"></${exportUi}>`;
  }

  /**
   * @inheritDoc
   */
  processItem(item) {
    var result = item == null ? null : {};

    if (this.fields) {
      for (var i = 0, n = this.fields.length; i < n; i++) {
        var field = this.fields[i];
        if (field === RecordField.TIME) {
          this.writeTime(item, result);
        } else if (!(field in result)) {
          var value = item.get(this.fields[i]);
          if (value == null) {
            value = '';
          }

          if (osObject.isPrimitive(value) && !Array.isArray(value)) {
            result[field] = value;
          }
        }
      }
    }

    this.writeGeometry(item, result);

    return result;
  }

  /**
   * Get whether to always include WKT geometry in the export
   *
   * @return {boolean} If true, WKT geometry will always be included in the export
   */
  getAlwaysIncludeWkt() {
    return this.alwaysIncludeWkt_;
  }

  /**
   * Set wheather to always include WKT geometry in the export
   *
   * @param {boolean} newValue Set to true if WKT geometry should always be included in the export
   */
  setAlwaysIncludeWkt(newValue) {
    this.alwaysIncludeWkt_ = newValue;
  }

  /**
   * @inheritDoc
   */
  supportsTime() {
    return true;
  }

  /**
   * Conditionally writes the time field(s) to the result object
   *
   * @param {T} item The items
   * @param {Object.<string, string>} result The Papa item
   * @protected
   * @template T
   */
  writeTime(item, result) {
    var time = item ? /** @type {os.time.ITime|undefined} */ (item.get(RecordField.TIME)) : null;
    if (time != null) {
      if (instanceOf(time, TimeRange.NAME)) {
        // time ranges need to be put into two separate fields so that we can reimport our own exports
        result[CSVExporter.FIELDS.START_TIME] = /** @type {TimeRange} */ (time).getStartISOString();
        result[CSVExporter.FIELDS.END_TIME] = /** @type {TimeRange} */ (time).getEndISOString();
      } else {
        result[Fields.TIME] = time.toISOString();
      }
    }
  }

  /**
   * Conditionally writes the geometry field to the result object
   *
   * @param {T} item The items
   * @param {Object.<string, string>} result The Papa item
   * @protected
   * @template T
   */
  writeGeometry(item, result) {
    var geom = item ? /** @type {SimpleGeometry|undefined} */ (item.getGeometry()) : null;
    if (this.alwaysIncludeWkt_ && geom != null) {
      geom = /** @type {SimpleGeometry|undefined} */ (geom.clone().toLonLat());
      result[Fields.GEOMETRY] = wkt.FORMAT.writeFeature(item, {
        dataProjection: osProj.EPSG4326,
        featureProjection: osMap.PROJECTION
      });

      if (this.exportEllipses_) {
        result[Fields.SEMI_MAJOR] = item.get(Fields.SEMI_MAJOR);
        result[Fields.SEMI_MINOR] = item.get(Fields.SEMI_MINOR);
      }
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.csv.CSVExporter');


/**
 * Fields for CSV export.
 * @enum {string}
 */
CSVExporter.FIELDS = {
  START_TIME: 'START_TIME',
  END_TIME: 'END_TIME'
};



exports = CSVExporter;
