goog.module('os.track.AddOptions');
goog.module.declareLegacyNamespace();

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

exports = AddOptions;
