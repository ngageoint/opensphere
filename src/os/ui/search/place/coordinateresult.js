goog.provide('os.ui.search.place.CoordinateResult');

goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.implements');
goog.require('os.search.AbstractSearchResult');
goog.require('os.search.ISortableResult');
goog.require('os.search.SortType');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.time.ITime');
goog.require('os.ui.search.place.coordResultCardDirective');



/**
 * Search results containing a coordinate to display on the map.
 *
 * @param {ol.Feature} result The search result, as an Openlayers feature.
 * @param {string=} opt_label The feature label field.
 * @param {number=} opt_score The search result score.
 * @extends {os.search.AbstractSearchResult<!ol.Feature>}
 * @implements {os.search.ISortableResult}
 * @constructor
 */
os.ui.search.place.CoordinateResult = function(result, opt_label, opt_score) {
  var score = opt_score != null ? opt_score : 100;
  os.ui.search.place.CoordinateResult.base(this, 'constructor', result, score);

  var featureConfig = this.createFeatureStyleConfig(result);
  if (featureConfig) {
    result.set(os.style.StyleType.FEATURE, featureConfig);

    var hasName = !!result.get('name');
    var labelField = opt_label || (hasName ? 'name' : undefined);

    // configure labels for the feature
    if (labelField) {
      featureConfig[os.style.StyleField.LABELS] = [{
        'column': labelField,
        'showColumn': false
      }];

      // ensure name field is populated for feature info
      if (!hasName) {
        result.set('name', result.get(labelField));
      }
    }

    os.style.setFeatureStyle(result);
  }
};
goog.inherits(os.ui.search.place.CoordinateResult, os.search.AbstractSearchResult);
os.implements(os.ui.search.place.CoordinateResult, os.search.ISortableResult.ID);


/**
 * Create a style config for a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @return {Object|undefined} The style config.
 * @protected
 */
os.ui.search.place.CoordinateResult.prototype.createFeatureStyleConfig = function(feature) {
  return /** @type {!Object} */ (os.object.unsafeClone(os.ui.search.place.FEATURE_CONFIG));
};


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateResult.prototype.performAction = function() {
  // zoom to coordinate
  var extent = /** @type {ol.Extent} */ (this.result.get('extent'));

  if (extent) {
    // an extent set on the feature is most likely in lat/lon
    extent = ol.proj.transformExtent(extent, os.proj.EPSG4326, os.map.PROJECTION);
    os.MapContainer.getInstance().flyToExtent(extent, 2, 16);
  } else {
    os.feature.flyTo(this.result);
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateResult.prototype.getSearchUI = function() {
  return '<coordresultcard></coordresultcard>';
};


/**
 * @inheritDoc
 */
os.ui.search.place.CoordinateResult.prototype.getSortValue = function(sortType) {
  var value;

  if (this.result) {
    switch (sortType) {
      case os.search.SortType.DATE:
        var time = this.result.get(os.data.RecordField.TIME);
        if (os.implements(time, os.time.ITime.ID)) {
          value = /** @type {os.time.ITime} */ (time.getStart());
        }
        break;
      case os.search.SortType.TITLE:
        value = os.feature.getTitle(this.result) || null;
        break;
      default:
        break;
    }
  }

  return value != null ? String(value) : null;
};
