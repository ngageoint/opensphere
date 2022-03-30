goog.declareModuleId('os.ui.feature.launchMultiFeatureInfo');

import * as osWindow from '../window.js';
import {directiveTag as multiFeatureInfoUi} from './multifeatureinfo.js';

/**
 * Launches a feature info window for the provided feature(s).
 *
 * @param {Array<Feature|RenderFeature>|Feature|RenderFeature} features The feature or array of features to show.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
const launchMultiFeatureInfo = function(features, opt_titleDetail) {
  features = Array.isArray(features) ? features : [features];
  var winLabel = opt_titleDetail || 'Feature Info';
  var windowId = 'featureInfo';

  // create a new window
  var scopeOptions = {
    'features': features
  };

  // don't constrain the max width/height since content varies widely per feature
  var windowOptions = {
    'id': windowId,
    'label': winLabel,
    'icon': 'fa fa-map-marker',
    'key': 'featureinfo',
    'x': 'center',
    'y': 'center',
    'width': 600,
    'min-width': 500,
    'max-width': 0,
    'height': 350,
    'min-height': 200,
    'max-height': 0,
    'show-close': true
  };

  var template = `<${multiFeatureInfoUi} features="features"></${multiFeatureInfoUi}>`;
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

export default launchMultiFeatureInfo;
