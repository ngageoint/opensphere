goog.module('os.track.TrackField');
goog.module.declareLegacyNamespace();

/**
 * Feature metadata fields used by tracks
 * @enum {string}
 */
exports = {
  ELAPSED_AVERAGE_SPEED: 'ELAPSED_AVERAGE_SPEED',
  ELAPSED_DISTANCE: 'ELAPSED_DISTANCE',
  ELAPSED_DURATION: 'ELAPSED_DURATION',
  TOTAL_DISTANCE: 'TOTAL_DISTANCE',
  TOTAL_DURATION: 'TOTAL_DURATION',
  CURRENT_POSITION: '_currentPosition',
  CURRENT_LINE: '_currentLine',
  QUERY_OPTIONS: '_trackQueryOptions',
  ORIG_SOURCE_ID: '_trackOrigSourceId',
  SORT_FIELD: '_sortField',
  INTERPOLATE_MARKER: '_interpolateMarker',
  METADATA_MAP: '_trackMetadataMap'
};
