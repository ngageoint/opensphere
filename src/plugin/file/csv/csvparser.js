goog.declareModuleId('plugin.file.csv.CSVParser');

import Feature from 'ol/src/Feature.js';
import {getUid} from 'ol/src/util.js';

import ColumnDefinition from '../../../os/data/columndefinition.js';
import RecordField from '../../../os/data/recordfield.js';
import {isInternalField} from '../../../os/feature/feature.js';
import LatMapping from '../../../os/im/mapping/latmapping.js';
import LonMapping from '../../../os/im/mapping/lonmapping.js';
import PositionMapping from '../../../os/im/mapping/positionmapping.js';
import WKTMapping from '../../../os/im/mapping/wktmapping.js';
import AbstractCsvParser from '../../../os/ui/file/csv/abstractcsvparser.js';

const googString = goog.require('goog.string');

/**
 * A CSV parser driven by PapaParse.
 *
 * @extends {AbstractCsvParser.<Feature>}
 */
export default class CSVParser extends AbstractCsvParser {
  /**
   * Constructor.
   * @param {CSVParserConfig} config
   */
  constructor(config) {
    super(config);
  }

  /**
   * @inheritDoc
   */
  parsePreview(source, opt_mappings) {
    this.columns.length = 0;

    // parse a subset of the source for immediate consumption
    source = this.prepareSource(source);
    var results = Papa.parse(source, {
      'comments': this.config['commentChar'] || false,
      'preview': AbstractCsvParser.PREVIEW_SIZE,
      'delimiter': this.config['delimiter'],
      'dynamicTyping': false,
      'header': this.config['useHeader']
    });

    var features = [];
    if (results && results.data && results.data.length > 0) {
      this.preprocessResults(results);

      for (var i = 0, n = results.data.length; i < n; i++) {
        var feature = this.processResult(results.data[i], opt_mappings);
        if (feature) {
          features.push(feature);
        }
      }

      if (opt_mappings) {
        if (features && features.length > 0) {
          this.updateColumnsFromFeature_(features[0]);
        }
      } else {
        this.updateColumnsFromResults(results);
      }
    }

    return features;
  }

  /**
   * @inheritDoc
   */
  processResult(result, opt_mappings) {
    var feature = new Feature(result);

    if (this.config['ignoreMissingGeomRows']) {
      var mappings = opt_mappings != null ? opt_mappings : this.config['mappings'];
      var latField = LatMapping.ID;
      var lonField = LonMapping.ID;

      if (mappings) { // see if lat lon was mapped to something else
        for (var i = 0; i < mappings.length; i++) {
          if (mappings[i].getId() == LatMapping.ID) {
            latField = mappings[i].field;
          } else if (mappings[i].getId() == LonMapping.ID) {
            lonField = mappings[i].field;
          } else if (mappings[i] instanceof PositionMapping ||
              mappings[i] instanceof WKTMapping) {
            latField = mappings[i].field;
            lonField = mappings[i].field;
          }
        }
      }

      var lat = /** @type {string} */ (feature.get(latField));
      var lon = /** @type {string} */ (feature.get(lonField));

      // if both lat and lon aren't set, throw the feature out
      if (lat != null && lon != null) {
        if (googString.isEmptyOrWhitespace(lat) || googString.isEmptyOrWhitespace(lon)) {
          return null;
        }
      } else {
        return null;
      }
    }

    feature.setId(String(getUid(feature)));
    return feature;
  }

  /**
   * Determines columns from a feature. Useful when mappings are applied that change the feature properties.
   *
   * @param {Feature} feature
   * @private
   */
  updateColumnsFromFeature_(feature) {
    this.columns.length = 0;

    var hasTime = false;

    if (feature.get(RecordField.TIME) != null) {
      var timeColumn = new ColumnDefinition(RecordField.TIME);
      timeColumn['id'] = 'TIME';
      timeColumn['name'] = 'TIME';
      timeColumn['selectable'] = false;
      timeColumn['sortable'] = false;
      this.columns.push(timeColumn);

      hasTime = true;
    }

    var properties = feature.getProperties();
    for (var key in properties) {
      if (!isInternalField(key) && (!hasTime || key != 'TIME')) {
        var col = new ColumnDefinition(key);
        col['selectable'] = false;
        col['sortable'] = false;
        this.columns.push(col);
      }
    }
  }
}
