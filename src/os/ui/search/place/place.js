goog.module('os.ui.search.place');
goog.module.declareLegacyNamespace();

const Feature = goog.require('ol.Feature');
const osObject = goog.require('os.object');
const StyleField = goog.require('os.style.StyleField');
const StyleType = goog.require('os.style.StyleType');
const {GOOGLE_EARTH_URL, GoogleEarthIcons} = goog.require('os.ui.file.kml');
const {getUid} = goog.require('ol');
const {setFeatureStyle} = goog.require('os.style');


/**
 * @type {Object}
 */
const FEATURE_CONFIG = {
  'image': {
    'type': 'icon',
    'scale': 0.75,
    'src': GOOGLE_EARTH_URL + GoogleEarthIcons.WHT_BLANK,
    'color': 'rgba(0,255,255,1)'
  },
  'text': {}
};


/**
 * Creates a feature representing a coordinate result.
 *
 * @param {Object.<string, *>=} opt_options Feature options.
 * @return {!ol.Feature}
 */
const createFeature = function(opt_options) {
  // grab the label off the options if it exists. we don't want it on the feature.
  var label;
  if (opt_options && 'label' in opt_options) {
    label = /** @type {string} */ (opt_options['label']);
    delete opt_options['label'];
  }

  var feature = new Feature(opt_options);
  feature.setId(getUid(feature));

  var featureConfig = osObject.unsafeClone(FEATURE_CONFIG);
  feature.set(StyleType.FEATURE, featureConfig);

  // configure labels for the feature
  if (label) {
    featureConfig[StyleField.LABELS] = [{
      'column': label,
      'showColumn': false
    }];
  }

  setFeatureStyle(feature);
  return feature;
};


exports = {createFeature, FEATURE_CONFIG};
