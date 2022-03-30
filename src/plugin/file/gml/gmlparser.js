goog.declareModuleId('plugin.file.gml.GMLParser');

import {getUid} from 'ol/src/util.js';

import ColumnDefinition from '../../../os/data/columndefinition.js';
import RecordField from '../../../os/data/recordfield.js';
import * as osFeature from '../../../os/feature/feature.js';
import Fields from '../../../os/fields/fields.js';
import * as osMap from '../../../os/map/map.js';
import BaseGMLParser from '../../../os/ui/file/gml/gmlparser.js';


/**
 */
export default class GMLParser extends BaseGMLParser {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Array of column definitions.
     * @type {Array<!ColumnDefinition>}
     */
    this.columns_ = null;

    /**
     * Map of column field to the column definition.
     * @type {Object<string, !ColumnDefinition>}
     * @private
     */
    this.columnMap_ = null;
  }

  /**
   * @inheritDoc
   */
  getProjection() {
    return /** @type {!Projection} */ (osMap.PROJECTION);
  }

  /**
   * dispose
   */
  dispose() {
    this.cleanup();
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.features = null;
    this.nextIndex = 0;
  }

  /**
   * Parse a limited set of results from the source
   *
   * @param {Object|null|string} source
   * @param {Array<IMapping>=} opt_mappings The set of mappings to apply to parsed features
   * @return {!Array<!Feature>}
   */
  parsePreview(source, opt_mappings) {
    this.setSource(source);
    var count = 25;
    var features = [];
    this.columnMap_ = {};

    while (this.hasNext() && count--) {
      var featureSet = this.parseNext();

      if (Array.isArray(featureSet)) {
        for (var i = 0, n = featureSet.length; i < n; i++) {
          var feature = featureSet[i];
          feature.setId(String(getUid(feature)));
          features.push(feature);
        }
      }

      var keys = feature.getKeys();
      for (i = 0, n = keys.length; i < n; i++) {
        var field = keys[i];

        if (field && !osFeature.isInternalField(field) && !(field in this.columnMap_)) {
          var col = new ColumnDefinition(field);
          col['selectable'] = true;
          col['sortable'] = true;

          this.columnMap_[field] = col;
        }
      }
    }

    return features;
  }

  /**
   * Get columns detected in the GML
   *
   * @return {Array<!ColumnDefinition>}
   */
  getColumns() {
    if (!this.columns_ && this.columnMap_) {
      // translate the column map into slickgrid columns
      this.columns_ = [];

      for (var column in this.columnMap_) {
        if (column === RecordField.TIME) {
          // display the recordTime field as TIME
          this.columns_.push(new ColumnDefinition(Fields.TIME, RecordField.TIME));
        } else if (!GMLParser.SKIPPED_COLUMNS_.test(column)) {
          this.columns_.push(new ColumnDefinition(column));
        }
      }

      this.columnMap_ = null;
    }

    return this.columns_;
  }
}


/**
 * Fields to ignore when creating the column list.
 * @type {RegExp}
 * @private
 * @const
 */
GMLParser.SKIPPED_COLUMNS_ = /^(geometry|recordtime|time|styleurl)$/i;
