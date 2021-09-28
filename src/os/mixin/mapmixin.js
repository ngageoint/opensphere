/**
 * @fileoverview Modifications to {@link PluggableMap}.
 */
goog.declareModuleId('os.mixin.map');

const {getUid} = goog.require('ol');
const PluggableMap = goog.require('ol.PluggableMap');

const Feature = goog.requireType('ol.Feature');


/**
 * Modified to only render if the feature wasn't skipped already.
 *
 * @param {Feature} feature Feature.
 * @suppress {accessControls|duplicate|checkTypes}
 */
PluggableMap.prototype.skipFeature = function(feature) {
  // do not change this from using getUid, or the OL3 renderer will not recognize it!!
  var featureUid = getUid(feature).toString();
  if (!this.skippedFeatureUids_[featureUid]) {
    this.skippedFeatureUids_[featureUid] = true;
    this.render();
  }
};


/**
 * Modified to only render if the feature was previously skipped.
 *
 * @param {Feature} feature Feature.
 * @suppress {accessControls|duplicate|checkTypes}
 */
PluggableMap.prototype.unskipFeature = function(feature) {
  // do not change this from using getUid, or the OL3 renderer will not recognize it!!
  var featureUid = getUid(feature).toString();
  if (this.skippedFeatureUids_[featureUid]) {
    delete this.skippedFeatureUids_[featureUid];
    this.render();
  }
};
