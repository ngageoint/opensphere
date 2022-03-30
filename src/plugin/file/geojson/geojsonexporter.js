goog.declareModuleId('plugin.file.geojson.GeoJSONExporter');

import GeoJSON from 'ol/src/format/GeoJSON.js';

import RecordField from '../../../os/data/recordfield.js';
import AbstractExporter from '../../../os/ex/abstractexporter.js';
import Fields from '../../../os/fields/fields.js';
import instanceOf from '../../../os/instanceof.js';
import {PROJECTION} from '../../../os/map/map.js';
import * as osProj from '../../../os/proj/proj.js';
import TimeRange from '../../../os/time/timerange.js';


const log = goog.require('goog.log');

/**
 * The GeoJSON exporter.
 *
 * @extends {AbstractExporter.<ol.Feature>}
 */
export default class GeoJSONExporter extends AbstractExporter {
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
      var time = /** @type {ITime|undefined} */ (this.items[i].get(RecordField.TIME));
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
      featureProjection: PROJECTION,
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
