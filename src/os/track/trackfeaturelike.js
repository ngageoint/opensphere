goog.module('os.track.TrackFeatureLike');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');
const DynamicFeature = goog.requireType('os.feature.DynamicFeature');

/**
 * A type representing a track feature. Tracks will use `os.feature.DynamicFeature` if they have a time component and
 * can be animated, `ol.Feature` otherwise.
 * @typedef {DynamicFeature|Feature}
 */
let TrackFeatureLike;

exports = TrackFeatureLike;
