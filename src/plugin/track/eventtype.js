goog.module('plugin.track.EventType');


/**
 * Events for the track plugin.
 *
 * Track events operating on selected data only should be suffixed with ':selected'. See
 * @enum {string}
 */
exports = {
  CREATE_TRACK: 'track:create',
  CREATE_FROM_SELECTED: 'track:create:selected',
  ADD_TO: 'track:addTo',
  ADD_FROM_SELECTED: 'track:addTo:selected',
  FOLLOW: 'track:followTrack',
  UNFOLLOW: 'track:unfollowTrack',
  HIDE_LINE: 'track:hideLine',
  SHOW_LINE: 'track:showLine',
  ENABLE_INTERPOLATE_MARKER: 'track:enableInterpolateMarker',
  DISABLE_INTERPOLATE_MARKER: 'track:disableInterpolateMarker',
  PREDICT_TRACK_GEODESIC: 'track:predictGeodesic',
  PREDICT_TRACK_RHUMB: 'track:predictRhumb'
};
