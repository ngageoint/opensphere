goog.declareModuleId('os.track.TrackLike');

/**
 * A type representing a track geometry. Tracks will use a `ol.geom.MultiLineString` if they cross the date line (to
 * render correctly in Openlayers), or if they represent a multi-track.
 * @typedef {LineString|MultiLineString}
 */
let TrackLike;

export default TrackLike;
