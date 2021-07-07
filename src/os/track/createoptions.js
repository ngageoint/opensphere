goog.module('os.track.CreateOptions');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');
const TrackLike = goog.requireType('os.track.TrackLike');


/**
 * @typedef {{
 *   coordinates: (Array<!ol.Coordinate>|undefined),
 *   features: (Array<!Feature>|undefined),
 *   geometry: (TrackLike|undefined),
 *   id: (string|undefined),
 *   color: (string|undefined),
 *   name: (string|undefined),
 *   sortField: (string|undefined),
 *   label: (string|null|undefined),
 *   includeMetadata: (boolean|undefined),
 *   useLayerStyle: (boolean|undefined)
 * }}
 */
let CreateOptions;

exports = CreateOptions;
