goog.provide('os.ui.search.place.CoordinateResult');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('os.search.AbstractSearchResult');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.ui.search.place.coordResultCardDirective');



/**
 * Search results containing a coordinate to display on the map.
 * @param {ol.Feature} result The search result, as an Openlayers feature.
 * @param {string=} opt_label The feature label field.
 * @param {number=} opt_score The search result score.
 * @extends {os.search.AbstractSearchResult<!ol.Feature>}
 * @constructor
 */
os.ui.search.place.CoordinateResult = function(result, opt_label, opt_score) {
  var score = opt_score != null ? opt_score : 100;
  os.ui.search.place.CoordinateResult.base(this, 'constructor', result, score);

  var featureConfig = this.createFeatureStyleConfig(result);
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
};
goog.inherits(os.ui.search.place.CoordinateResult, os.search.AbstractSearchResult);


/**
 * @type {Object}
 * @const
 */
os.ui.search.place.FEATURE_CONFIG = {
  'image': {
    'type': 'icon',
    'scale': 0.75,
    'src': os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_BLANK,
    'color': 'rgba(0,255,255,1)'
  },
  'text': os.style.label.DEFAULT_CONFIG
};


/**
 * Create a style config for a feature.
 * @param {ol.Feature} feature The feature.
 * @return {!Object} The style config.
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
  } else {
    var geom = this.result.getGeometry();
    if (geom instanceof ol.geom.Point) {
      // for point geometries, simply center the map
      os.MapContainer.getInstance().flyTo(/** @type {!osx.map.FlyToOptions} */ ({
        center: geom.getFirstCoordinate()
      }));
    } else if (geom) {
      extent = geom.getExtent();
    }
  }

  if (extent) {
    os.MapContainer.getInstance().flyToExtent(extent, 2, 16);
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
os.ui.search.place.CoordinateResult.prototype.setSearchUI = function(value) {
  // does nothing until the search UI is implemented as a directive
};


/**
 * Creates a feature representing a coordinate result.
 * @param {Object.<string, *>=} opt_options Feature options.
 * @return {!ol.Feature}
 */
os.ui.search.place.createFeature = function(opt_options) {
  // grab the label off the options if it exists. we don't want it on the feature.
  var label;
  if (opt_options && 'label' in opt_options) {
    label = /** @type {string} */ (opt_options['label']);
    delete opt_options['label'];
  }

  var feature = new ol.Feature(opt_options);

  var featureConfig = os.object.unsafeClone(os.ui.search.place.FEATURE_CONFIG);
  feature.set(os.style.StyleType.FEATURE, featureConfig);

  // configure labels for the feature
  if (label) {
    featureConfig[os.style.StyleField.LABELS] = [{
      'column': label,
      'showColumn': false
    }];
  }

  os.style.setFeatureStyle(feature);
  return feature;
};
