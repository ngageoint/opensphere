goog.provide('plugin.file.csv.CSVExporter');
goog.require('goog.log');
goog.require('ol.format.WKT');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.geo');
goog.require('os.object');
goog.require('os.ol.wkt');
goog.require('os.style');
goog.require('os.ui.file.csv.AbstractCSVExporter');



/**
 * The CSV exporter.
 * @extends {os.ui.file.csv.AbstractCSVExporter.<ol.Feature>}
 * @constructor
 */
plugin.file.csv.CSVExporter = function() {
  plugin.file.csv.CSVExporter.base(this, 'constructor');
  this.log = plugin.file.csv.CSVExporter.LOGGER_;
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
 * @inheritDoc
 */
plugin.file.csv.CSVExporter.prototype.processItem = function(item) {
  var result = null;

  // this cast is incorrect, but will serve our needs wrt the compiler
  var geom = item ? /** @type {ol.geom.Point|undefined} */ (item.getGeometry()) : null;
  if (goog.isDefAndNotNull(geom)) {
    geom = /** @type {ol.geom.Point|undefined} */ (geom.clone().toLonLat());
    result = {};

    try {
      // only populate these fields for point geometries, which will return an array of numbers. unfortunately we can't
      // detect a point geometry with instanceof because of external tools
      var coords = geom.getCoordinates();
      if (coords && goog.isNumber(coords[0])) {
        result[os.Fields.LAT] = String(coords[1]);
        result[os.Fields.LON] = String(coords[0]);
        result[os.Fields.LAT_DDM] = os.geo.toDegreesDecimalMinutes(coords[1], false, false);
        result[os.Fields.LON_DDM] = os.geo.toDegreesDecimalMinutes(coords[0], true, false);
        result[os.Fields.LAT_DMS] = os.geo.toSexagesimal(coords[1], false, false);
        result[os.Fields.LON_DMS] = os.geo.toSexagesimal(coords[0], true, false);
        result[os.Fields.MGRS] = osasm.toMGRS(coords);
      }
    } catch (e) {
      // didn't have a getCoordinates function... carry on
    }

    // all geometry fields should at least be on the result to make PapaParse happier
    if (!(os.Fields.LAT in result)) {
      result[os.Fields.LAT] = '';
      result[os.Fields.LON] = '';
      result[os.Fields.LAT_DDM] = '';
      result[os.Fields.LON_DDM] = '';
      result[os.Fields.LAT_DMS] = '';
      result[os.Fields.LON_DMS] = '';
      result[os.Fields.MGRS] = '';
    }

    result[os.Fields.GEOMETRY] = os.ol.wkt.FORMAT.writeFeature(item);

    var time = /** @type {os.time.ITime|undefined} */ (item.get(os.data.RecordField.TIME));
    if (time) {
      result[os.Fields.TIME] = time.toISOString('/');
    }

    if (this.fields) {
      for (var i = 0, n = this.fields.length; i < n; i++) {
        var field = this.fields[i];
        if (!(field in result)) {
          var value = item.get(this.fields[i]);
          if (!goog.isDefAndNotNull(value)) {
            value = '';
          }

          if (os.object.isPrimitive(value) && !goog.isArray(value)) {
            result[field] = value;
          }
        }
      }
    }
  }

  return result;
};
