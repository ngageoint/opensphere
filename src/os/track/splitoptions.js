goog.declareModuleId('os.track.SplitOptions');

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

export default SplitOptions;
