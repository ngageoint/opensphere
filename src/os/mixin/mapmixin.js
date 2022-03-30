/**
 * @fileoverview Modifications to {@link PluggableMap}.
 */
goog.declareModuleId('os.mixin.map');

import PluggableMap from 'ol/src/PluggableMap.js';

// const Feature = goog.requireTyped('ol.Feature');

/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * Modified to only render if the feature wasn't skipped already.
   *
   * @param {Feature} feature Feature.
   * @suppress {accessControls|duplicate|checkTypes}
   */
  PluggableMap.prototype.skipFeature = function(feature) {
    feature.set('savedStyle', feature.getStyle());
    feature.setStyle(new Style(null));
  };


  /**
   * Modified to only render if the feature was previously skipped.
   *
   * @param {Feature} feature Feature.
   * @suppress {accessControls|duplicate|checkTypes}
   */
  PluggableMap.prototype.unskipFeature = function(feature) {
    const featureSavedStyle = feature.get('savedStyle');
    feature.setStyle(featureSavedStyle);
  };
};

init();
