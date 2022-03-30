goog.declareModuleId('os.ui.search.place.CoordinateResult');

import {transformExtent} from 'ol/src/proj.js';

import RecordField from '../../../data/recordfield.js';
import {flyTo, getTitle} from '../../../feature/feature.js';
import osImplements from '../../../implements.js';
import * as osMap from '../../../map/map.js';
import MapContainer from '../../../mapcontainer.js';
import {unsafeClone} from '../../../object/object.js';
import {EPSG4326} from '../../../proj/proj.js';
import AbstractSearchResult from '../../../search/abstractsearchresult.js';
import ISortableResult from '../../../search/isortableresult.js';
import SortType from '../../../search/sorttype.js';
import {setFeatureStyle} from '../../../style/style.js';
import StyleField from '../../../style/stylefield.js';
import StyleType from '../../../style/styletype.js';
import ITime from '../../../time/itime.js';
import {directiveTag as searchUi} from './coordinateresultcard.js';
import {FEATURE_CONFIG} from './place.js';

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
