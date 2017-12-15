goog.provide('plugin.file.geojson.GeoJSONExporter');

goog.require('goog.log');
goog.require('ol.format.GeoJSON');
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
  var format = new ol.format.GeoJSON();
  this.output = format.writeFeatures(this.items, {
    featureProjection: os.map.PROJECTION,
    dataProjection: os.proj.EPSG4326,
    fields: this.fields
  });
};
