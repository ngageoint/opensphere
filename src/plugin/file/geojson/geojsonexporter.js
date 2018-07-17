goog.provide('plugin.file.geojson.GeoJSONExporter');

goog.require('goog.log');
goog.require('ol.format.GeoJSON');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.ex.AbstractExporter');
goog.require('os.map');

/**
 * The GeoJSON exporter.
 * @extends {os.ex.AbstractExporter.<ol.Feature>}
 * @constructor
 */
plugin.file.geojson.GeoJSONExporter = function() {
  plugin.file.geojson.GeoJSONExporter.base(this, 'constructor');
  this.log = plugin.file.geojson.GeoJSONExporter.LOGGER_;
};
goog.inherits(plugin.file.geojson.GeoJSONExporter, os.ex.AbstractExporter);

/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.geojson.GeoJSONExporter.LOGGER_ = goog.log.getLogger('plugin.file.geojson.GeoJSONExporter');

/**
 * Fields for GeoJson export.
 * @enum {string}
 */
plugin.file.geojson.GeoJSONExporter.FIELDS = {
  START_TIME: 'START_TIME',
  END_TIME: 'END_TIME'
};

/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONExporter.prototype.getLabel = function() {
  return 'GeoJSON';
};

/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONExporter.prototype.getExtension = function() {
  return 'geojson';
};

/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONExporter.prototype.getMimeType = function() {
  return 'application/vnd.geo+json';
};

/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONExporter.prototype.process = function() {
  // Insert calculated TIME to each item if present
  var timeAdded = false;
  var timeRangeAdded = false;
  for (var i = 0, n = this.items.length; i < n; i++) {
    var time = /** @type {os.time.ITime|undefined} */ (this.items[i].get(os.data.RecordField.TIME));
    if (time) {
      if (os.instanceOf(time, os.time.TimeRange.NAME)) {
        this.items[i].set(plugin.file.geojson.GeoJSONExporter.FIELDS.START_TIME, time.getStartISOString());
        this.items[i].set(plugin.file.geojson.GeoJSONExporter.FIELDS.END_TIME, time.getEndISOString());
        if (!timeRangeAdded) {
          this.fields.push(plugin.file.geojson.GeoJSONExporter.FIELDS.START_TIME);
          this.fields.push(plugin.file.geojson.GeoJSONExporter.FIELDS.END_TIME);
          timeRangeAdded = true;
        }
      } else {
        this.items[i].set(os.Fields.TIME, time.toISOString());
        if (!timeAdded) {
          this.fields.push(os.Fields.TIME);
          timeAdded = true;
        }
      }
    }
  }

  var format = new ol.format.GeoJSON();
  this.output = format.writeFeatures(this.items, {
    featureProjection: os.map.PROJECTION,
    dataProjection: os.proj.EPSG4326,
    fields: this.fields
  });
};
