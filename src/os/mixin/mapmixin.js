/**
 * @fileoverview Modifications to {@link ol.Map}.
 */
goog.provide('os.mixin.map');

goog.require('ol.Map');


/**
 * Modified to only render if the feature wasn't skipped already.
 * @param {ol.Feature} feature Feature.
 * @suppress {accessControls|duplicate|checkTypes}
 */
ol.Map.prototype.skipFeature = function(feature) {
  // do not change this from using ol.getUid, or the OL3 renderer will not recognize it!!
  var featureUid = ol.getUid(feature).toString();
  if (!this.skippedFeatureUids_[featureUid]) {
    this.skippedFeatureUids_[featureUid] = true;
    this.render();
  }
};


/**
 * Modified to only render if the feature was previously skipped.
 * @param {ol.Feature} feature Feature.
 * @suppress {accessControls|duplicate|checkTypes}
 */
ol.Map.prototype.unskipFeature = function(feature) {
  // do not change this from using ol.getUid, or the OL3 renderer will not recognize it!!
  var featureUid = ol.getUid(feature).toString();
  if (this.skippedFeatureUids_[featureUid]) {
    delete this.skippedFeatureUids_[featureUid];
    this.render();
  }
};
