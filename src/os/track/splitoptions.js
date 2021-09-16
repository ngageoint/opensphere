goog.module('os.track.SplitOptions');

const Feature = goog.requireType('ol.Feature');


/**
 * @typedef {{
 *   features: Array<Feature>,
 *   field: (string|undefined),
 *   bucketFn: ((function(Feature):?)|undefined),
 *   getTrackFn: ((function((string|number)):Feature)|undefined),
 *   result: (Array<Feature>|undefined)
 * }}
 */
let SplitOptions;

exports = SplitOptions;
