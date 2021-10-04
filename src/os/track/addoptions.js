goog.declareModuleId('os.track.AddOptions');

const Feature = goog.requireType('ol.Feature');


/**
 * @typedef {{
 *   coordinates: (Array<!ol.Coordinate>|undefined),
 *   features: (Array<!Feature>|undefined),
 *   track: !Feature,
 *   includeMetadata: (boolean|undefined)
 * }}
 */
let AddOptions;

export default AddOptions;
