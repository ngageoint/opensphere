goog.declareModuleId('plugin.file.geojson.GeoJSONParser');

import GeoJSON from 'ol/src/format/GeoJSON.js';
import {getUid} from 'ol/src/util.js';
import ColumnDefinition from '../../../os/data/columndefinition.js';
import * as osFeature from '../../../os/feature/feature.js';
import * as text from '../../../os/file/mime/text.js';
import * as fn from '../../../os/fn/fn.js';
import * as osMap from '../../../os/map/map.js';

const Disposable = goog.require('goog.Disposable');
const googObject = goog.require('goog.object');


/**
 * Parses a GeoJSON source
 *
 * @implements {IParser<ol.Feature>}
 */
export default class GeoJSONParser extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!GeoJSON}
     * @private
     */
    this.format_ = new GeoJSON();

    /**
     * @type {?Array<GeoJSONObject>}
     */
    this.features = null;

    /**
     * @type {Object<string, !ColumnDefinition>}
     * @private
     */
    this.columns_ = {};

    /**
     * The index of the next feature to os.parse.
     * @type {number}
     * @protected
     */
    this.nextIndex = 0;

    /**
     * The ID of the data source this is parsing for.
     * @type {?string}
     * @protected
     */
    this.sourceId = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.cleanup();
  }

  /**
   * Get the source ID.
   *
   * @return {?string}
   */
  getSourceId() {
    return this.sourceId;
  }

  /**
   * Set the source ID.
   *
   * @param {?string} value
   */
  setSourceId(value) {
    this.sourceId = value;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.features = null;
    this.nextIndex = 0;

    var src;
    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    if (Array.isArray(source) && source.length == 1 && (typeof source[0] === 'string' || goog.isObject(source[0]))) {
      // source likely came from a chaining importer
      src = source[0];
    } else if (goog.isObject(source)) {
      src = source;
    } else if (source && typeof source === 'string') {
      // THIN-6240: if the server returns invalid JSON with literal whitespace characters inside tokens, the parser will
      // fail. as a workaround, replace tabs with spaces and strip carriage returns and new lines.
      src = /** @type {Object} */ (JSON.parse(source.replace(/\t/g, ' ').replace(/\r\n/g, '')));
    }

    if (src) {
      if (Array.isArray(src)) {
        // this isn't quite valid GeoJSON, but... no harm no foul?
        this.features = src;
      } else {
        var o = /** @type {GeoJSONObject} */ (src);

        if (o.type == 'FeatureCollection') {
          var c = /** @type {GeoJSONFeatureCollection} */ (o);
          this.features = c.features;
        } else if (o.type) {
          this.features = [o];
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.features = null;
    this.nextIndex = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.features != null && this.features.length > this.nextIndex;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    // unshift is very slow in browsers other than Chrome, so leave the array intact while parsing
    var nextFeature = this.features[this.nextIndex++];
    if (nextFeature) {
      var features = this.format_.readFeatures(nextFeature, {
        // We don't set the data projection because that can technically be specified in the GeoJSON. The
        // GeoJSON format has a default projection of EPSG:4326 if one is not specified
        featureProjection: osMap.PROJECTION
      });

      features.forEach(this.process, this);

      return features;
    }

    return null;
  }

  /**
   * Parse a limited set of results from the source
   *
   * @param {Object|null|string} source
   * @param {Array<IMapping>=} opt_mappings The set of mappings to apply to parsed features
   * @return {!Array<!ol.Feature>}
   */
  parsePreview(source, opt_mappings) {
    this.setSource(source);
    var count = 25;
    var features = [];
    this.columns_ = {};

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

        if (field && !osFeature.isInternalField(field) && !(field in this.columns_)) {
          var col = new ColumnDefinition(field);
          col['selectable'] = true;
          col['sortable'] = true;

          this.columns_[field] = col;
        }
      }
    }

    return features;
  }

  /**
   * @return {Array<ColumnDefinition>}
   */
  getColumns() {
    if (this.columns_) {
      return googObject.getValues(this.columns_);
    }
    return [];
  }
}


/**
 * Method for doing additional processing on features parsed by the GeoJSON format.
 * @param {ol.Feature} feature
 */
GeoJSONParser.prototype.process = fn.noop;
