goog.declareModuleId('plugin.track');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import CommandProcessor from '../../os/command/commandprocessor.js';
import * as osFeature from '../../os/feature/feature.js';
import {createTrack} from '../../os/track/track.js';
import TrackField from '../../os/track/trackfield.js';
import KMLNodeAdd from '../file/kml/cmd/kmlnodeaddcmd.js';
import {updatePlacemark} from '../file/kml/ui/kmlui.js';
import PlacesManager from '../places/placesmanager.js';

const log = goog.require('goog.log');


/**
 * Base logger for the track plugin.
 * @type {log.Logger}
 */
const LOGGER_ = log.getLogger('plugin.track');

/**
 * Identifier for track plugin components.
 * @type {string}
 */
export const ID = 'track';

/**
 * Settings key to enable/disable the "Predicted" Tracks feature
 * @type {string}
 */
export const PREDICT = 'plugin.track.predict';

/**
 * Creates a track and adds it to the Saved Places layer.
 *
 * @param {!CreateOptions} options The options object for the track.
 * @return {TrackFeatureLike|undefined} The track feature.
 */
let createAndAdd_ = function(options) {
  var track = createTrack(options);

  if (!track) {
    var msg = 'Track creation failed. There were no valid features/coordinates to create a track.';
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
    return;
  }

  var trackNode = updatePlacemark({
    'feature': track
  });

  var rootNode = PlacesManager.getInstance().getPlacesRoot();
  if (rootNode && trackNode) {
    var cmd = new KMLNodeAdd(trackNode, rootNode);
    cmd.title = 'Create Track';
    CommandProcessor.getInstance().addCommand(cmd);

    updateTrackSource(track);

    return track;
  } else {
    log.error(LOGGER_, 'Unable to create track: track layer missing');
  }

  return;
};

/**
 * Creates a track and adds it to the Saved Places layer.
 *
 * @param {!CreateOptions} options The options object for the track.
 * @return {TrackFeatureLike|undefined} The track feature.
 */
export const createAndAdd = function(options) {
  return createAndAdd_(options);
};

/**
 * Replace default createAndAdd implementation
 *
 * @param {!function(!CreateOptions):(TrackFeatureLike|undefined)} f The new implementation
 */
export const setCreateAndAdd = function(f) {
  createAndAdd_ = f;
};

/**
 * Update the track source
 * @param {TrackFeatureLike|undefined} track
 */
export const updateTrackSource = function(track) {
  if (track) {
    var source = osFeature.getSource(track);
    if (source) {
      // Add track-specific columns to the source for display in feature UI's.
      source.addColumn(TrackField.ELAPSED_AVERAGE_SPEED);
      source.addColumn(TrackField.ELAPSED_DISTANCE);
      source.addColumn(TrackField.ELAPSED_DURATION);
      source.addColumn(TrackField.TOTAL_DISTANCE);
      source.addColumn(TrackField.TOTAL_DURATION);

      // Add metadata fields captured from the original data to the source, for display in feature UI's.
      // This assumes all added features have the same fields to avoid unnecessary iteration over the entire map.
      var metadataMap = track.get(TrackField.METADATA_MAP);
      if (metadataMap) {
        for (var key in metadataMap) {
          var first = metadataMap[key];
          for (var field in first) {
            source.addColumn(field);
          }

          break;
        }
      }
    }
  }
};
