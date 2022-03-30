goog.declareModuleId('os.ui.search.place');

import Feature from 'ol/src/Feature.js';
import {getUid} from 'ol/src/util.js';
import {unsafeClone} from '../../../object/object.js';
import {setFeatureStyle} from '../../../style/style.js';
import StyleField from '../../../style/stylefield.js';
import StyleType from '../../../style/styletype.js';
import {GOOGLE_EARTH_URL, GoogleEarthIcons} from '../../file/kml/kml.js';


/**
 * @type {Object}
 */
export const FEATURE_CONFIG = {
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
 * @return {!Feature}
 */
export const createFeature = function(opt_options) {
  // grab the label off the options if it exists. we don't want it on the feature.
  var label;
  if (opt_options && 'label' in opt_options) {
    label = /** @type {string} */ (opt_options['label']);
    delete opt_options['label'];
  }

  var feature = new Feature(opt_options);
  feature.setId(getUid(feature));

  var featureConfig = unsafeClone(FEATURE_CONFIG);
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
