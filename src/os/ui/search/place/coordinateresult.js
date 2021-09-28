goog.declareModuleId('os.ui.search.place.CoordinateResult');

import {flyTo, getTitle} from '../../../feature/feature.js';
import * as osMap from '../../../map/map.js';
import {setFeatureStyle} from '../../../style/style.js';
import {directiveTag as searchUi} from './coordinateresultcard.js';
import {FEATURE_CONFIG} from './place.js';

const {transformExtent} = goog.require('ol.proj');
const MapContainer = goog.require('os.MapContainer');
const RecordField = goog.require('os.data.RecordField');
const osImplements = goog.require('os.implements');
const {unsafeClone} = goog.require('os.object');
const {EPSG4326} = goog.require('os.proj');
const AbstractSearchResult = goog.require('os.search.AbstractSearchResult');
const ISortableResult = goog.require('os.search.ISortableResult');
const SortType = goog.require('os.search.SortType');
const StyleField = goog.require('os.style.StyleField');
const StyleType = goog.require('os.style.StyleType');
const ITime = goog.require('os.time.ITime');

const Feature = goog.requireType('ol.Feature');


/**
 * Search results containing a coordinate to display on the map.
 *
 * @extends {AbstractSearchResult<!Feature>}
 * @implements {ISortableResult}
 */
export default class CoordinateResult extends AbstractSearchResult {
  /**
   * Constructor.
   * @param {Feature} result The search result, as an Openlayers feature.
   * @param {string=} opt_label The feature label field.
   * @param {number=} opt_score The search result score.
   */
  constructor(result, opt_label, opt_score) {
    var score = opt_score != null ? opt_score : 100;
    super(result, score);

    var featureConfig = this.createFeatureStyleConfig(result);
    if (featureConfig) {
      result.set(StyleType.FEATURE, featureConfig);

      var hasName = !!result.get('name');
      var labelField = opt_label || (hasName ? 'name' : undefined);

      // configure labels for the feature
      if (labelField) {
        featureConfig[StyleField.LABELS] = [{
          'column': labelField,
          'showColumn': false
        }];

        // ensure name field is populated for feature info
        if (!hasName) {
          result.set('name', result.get(labelField));
        }
      }

      setFeatureStyle(result);
    }
  }

  /**
   * Create a style config for a feature.
   *
   * @param {Feature} feature The feature.
   * @return {Object|undefined} The style config.
   * @protected
   */
  createFeatureStyleConfig(feature) {
    return /** @type {!Object} */ (unsafeClone(FEATURE_CONFIG));
  }

  /**
   * @inheritDoc
   */
  performAction() {
    // zoom to coordinate
    var extent = /** @type {ol.Extent} */ (this.result.get('extent'));

    if (extent) {
      // an extent set on the feature is most likely in lat/lon
      extent = transformExtent(extent, EPSG4326, osMap.PROJECTION);
      MapContainer.getInstance().flyToExtent(extent, 2, 16);
    } else {
      flyTo(this.result);
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getSearchUI() {
    return `<${searchUi}></${searchUi}>`;
  }

  /**
   * @inheritDoc
   */
  getSortValue(sortType) {
    var value;

    if (this.result) {
      switch (sortType) {
        case SortType.DATE:
          var time = this.result.get(RecordField.TIME);
          if (osImplements(time, ITime.ID)) {
            value = /** @type {ITime} */ (time.getStart());
          }
          break;
        case SortType.TITLE:
          value = getTitle(this.result) || null;
          break;
        default:
          break;
      }
    }

    return value != null ? String(value) : null;
  }
}

osImplements(CoordinateResult, ISortableResult.ID);
