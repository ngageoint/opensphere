goog.declareModuleId('os.track.TrackFeatureLike');

const {default: DynamicFeature} = goog.requireType('os.feature.DynamicFeature');


/**
 * A type representing a track feature. Tracks will use `os.feature.DynamicFeature` if they have a time component and
 * can be animated, `ol.Feature` otherwise.
 * @typedef {DynamicFeature|Feature}
 */
let TrackFeatureLike;

export default TrackFeatureLike;
