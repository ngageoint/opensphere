goog.module('plugin.file.geojson.GeoJSONExporter');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const GeoJSON = goog.require('ol.format.GeoJSON');
const Fields = goog.require('os.Fields');
const RecordField = goog.require('os.data.RecordField');
const AbstractExporter = goog.require('os.ex.AbstractExporter');
const instanceOf = goog.require('os.instanceOf');
const osMap = goog.require('os.map');


const osProj = goog.require('os.proj');
const TimeRange = goog.require('os.time.TimeRange');


/**
 * The GeoJSON exporter.
 *
 * @extends {AbstractExporter.<ol.Feature>}
 */
class GeoJSONExporter extends AbstractExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'GeoJSON';
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return 'geojson';
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return 'application/vnd.geo+json';
  }

  /**
   * @inheritDoc
   */
  process() {
    // Insert calculated TIME to each item if present
    var timeAdded = false;
    var timeRangeAdded = false;
    for (var i = 0, n = this.items.length; i < n; i++) {
      var time = /** @type {os.time.ITime|undefined} */ (this.items[i].get(RecordField.TIME));
      if (time) {
        if (instanceOf(time, TimeRange.NAME)) {
          this.items[i].set(GeoJSONExporter.FIELDS.START_TIME, /** @type {TimeRange} */ (time).getStartISOString());
          this.items[i].set(GeoJSONExporter.FIELDS.END_TIME, /** @type {TimeRange} */ (time).getEndISOString());
          if (!timeRangeAdded) {
            this.fields.push(GeoJSONExporter.FIELDS.START_TIME);
            this.fields.push(GeoJSONExporter.FIELDS.END_TIME);
            timeRangeAdded = true;
          }
        } else {
          this.items[i].set(Fields.TIME, time.toISOString());
          if (!timeAdded) {
            this.fields.push(Fields.TIME);
            timeAdded = true;
          }
        }
      }
    }

    var format = new GeoJSON();
    this.output = format.writeFeatures(this.items, {
      featureProjection: osMap.PROJECTION,
      dataProjection: osProj.EPSG4326,
      fields: this.fields
    });
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.file.geojson.GeoJSONExporter');

/**
 * Fields for GeoJson export.
 * @enum {string}
 */
GeoJSONExporter.FIELDS = {
  START_TIME: 'START_TIME',
  END_TIME: 'END_TIME'
};

exports = GeoJSONExporter;
