goog.declareModuleId('plugin.file.csv.CSVExporter');

import Point from 'ol/src/geom/Point.js';

import RecordField from '../../../os/data/recordfield.js';
import {createEllipse} from '../../../os/feature/feature.js';
import Fields from '../../../os/fields/fields.js';
import instanceOf from '../../../os/instanceof.js';
import {PROJECTION} from '../../../os/map/map.js';
import * as osObject from '../../../os/object/object.js';
import * as wkt from '../../../os/ol/wkt.js';
import * as osProj from '../../../os/proj/proj.js';
import TimeRange from '../../../os/time/timerange.js';
import AbstractCSVExporter from '../../../os/ui/file/csv/abstractcsvexporter.js';
import {directiveTag as exportUi} from './ui/csvexportui.js';


const log = goog.require('goog.log');


/**
 * The CSV exporter.
 *
 * @extends {AbstractCSVExporter.<Feature>}
 */
export default class CSVExporter extends AbstractCSVExporter {
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
          var ellipse = createEllipse(feature);
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
    var time = item ? /** @type {ITime|undefined} */ (item.get(RecordField.TIME)) : null;
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
        featureProjection: PROJECTION
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
