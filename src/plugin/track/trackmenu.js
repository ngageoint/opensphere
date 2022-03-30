goog.declareModuleId('plugin.track.menu');

import OLVectorLayer from 'ol/src/layer/Vector.js';
import Settings from '../../os/config/settings.js';
import LayerNode from '../../os/data/layernode.js';
import DynamicFeature from '../../os/feature/dynamicfeature.js';
import instanceOf from '../../os/instanceof.js';
import OsMeasure from '../../os/interaction/measureinteraction.js';
import OsInterpolateMethod from '../../os/interpolatemethod.js';
import VectorLayer from '../../os/layer/vector.js';
import VectorSource from '../../os/source/vectorsource.js';
import * as osTrack from '../../os/track/track.js';
import TrackField from '../../os/track/trackfield.js';
import * as osUiMenuLayer from '../../os/ui/menu/layermenu.js';
import MenuItemType from '../../os/ui/menu/menuitemtype.js';
import * as spatial from '../../os/ui/menu/spatial.js';
import KMLNode from '../file/kml/ui/kmlnode.js';
import PlacesManager from '../places/placesmanager.js';
import EventType from './eventtype.js';
import * as pluginTrack from './track.js';
import Event from './trackevent.js';
import TrackManager from './trackmanager.js';
import Metrics from './trackmetrics.js';

const asserts = goog.require('goog.asserts');


const settings = Settings.getInstance();

/**
 * Menu group for track actions.
 * @type {string}
 */
export const TRACK_GROUP = 'Tracks';

/**
 * Add track items to the layer menu.
 * @param {boolean=} opt_enablePredict true to include "Predict" track capabilities
 */
export const layerSetup = function(opt_enablePredict = false) {
  const menu = osUiMenuLayer.getMenu();
  if (menu && !menu.getRoot().find(TRACK_GROUP)) {
    const group = menu.getRoot().find(osUiMenuLayer.GroupLabel.TOOLS);
    asserts.assert(group, 'Group should exist! Check spelling?');

    const children = [
      {
        label: 'Create Track',
        eventType: EventType.CREATE_TRACK,
        tooltip: 'Creates a new track by linking all features in time order.',
        icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
        metricKey: Metrics.Keys.CREATE_LAYER,
        beforeRender: visibleIfHasFeatures,
        handler: handleAddCreateTrackEvent_,
        sort: 200
      },
      {
        label: 'Create Track From Selected',
        eventType: EventType.CREATE_FROM_SELECTED,
        tooltip: 'Creates a new track by linking selected features in time order.',
        icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
        metricKey: Metrics.Keys.CREATE_LAYER,
        beforeRender: visibleIfHasFeatures,
        handler: handleAddCreateTrackEvent_,
        sort: 201
      },
      {
        label: 'Add to Track...',
        eventType: EventType.ADD_TO,
        tooltip: 'Adds all features to an existing track.',
        icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
        metricKey: Metrics.Keys.ADD_TO_LAYER,
        beforeRender: visibleIfTracksExist,
        handler: handleAddCreateTrackEvent_,
        sort: 210
      },
      {
        label: 'Add Selected to Track...',
        eventType: EventType.ADD_FROM_SELECTED,
        tooltip: 'Adds selected features to an existing track.',
        icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
        metricKey: Metrics.Keys.ADD_TO_LAYER,
        beforeRender: visibleIfTracksExist,
        handler: handleAddCreateTrackEvent_,
        sort: 211
      },
      {
        label: 'Follow Track',
        eventType: EventType.FOLLOW,
        tooltip: 'Follow the track as it animates.',
        icons: ['<i class="fa fa-fw fa-globe"></i>'],
        metricKey: Metrics.Keys.FOLLOW_TRACK,
        beforeRender: visibleIfIsNotFollowed,
        handler: handleFollowTrackEvent,
        sort: 220
      },
      {
        label: 'Unfollow Track',
        eventType: EventType.UNFOLLOW,
        tooltip: 'Cancel following the track during animation.',
        icons: ['<i class="fa fa-fw fa-globe"></i>'],
        metricKey: Metrics.Keys.UNFOLLOW_TRACK,
        beforeRender: visibleIfIsFollowed,
        handler: handleUnfollowTrackEvent,
        sort: 220
      },
      {
        label: 'Hide Track Line',
        eventType: EventType.HIDE_LINE,
        tooltip: 'Do not show the track line.',
        icons: ['<i class="fa fa-fw fa-level-up"></i>'],
        metricKey: Metrics.Keys.HIDE_TRACK_LINE,
        beforeRender: visibleIfLineIsShown,
        handler: goog.partial(setShowTrackLine, false),
        sort: 230
      },
      {
        label: 'Show Track Line',
        eventType: EventType.SHOW_LINE,
        tooltip: 'Show the track line.',
        icons: ['<i class="fa fa-fw fa-level-up"></i>'],
        metricKey: Metrics.Keys.SHOW_TRACK_LINE,
        beforeRender: visibleIfLineIsHidden,
        handler: goog.partial(setShowTrackLine, true),
        sort: 230
      },
      {
        label: 'Disable Track Interpolation',
        eventType: EventType.ENABLE_INTERPOLATE_MARKER,
        tooltip: 'Only move track marker when there is a supporting feature.',
        icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
        metricKey: Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
        beforeRender: visibleIfMarkerInterpolationEnabled,
        handler: goog.partial(setMarkerInterpolationEnabled, false),
        sort: 240
      },
      {
        label: 'Enable Track Interpolation',
        eventType: EventType.DISABLE_INTERPOLATE_MARKER,
        tooltip: 'Show the interpolated position of the track marker.',
        icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
        metricKey: Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
        beforeRender: visibleIfMarkerInterpolationDisabled,
        handler: goog.partial(setMarkerInterpolationEnabled, true),
        sort: 250
      }
    ];

    if (opt_enablePredict) {
      children.push({
        label: 'Predict',
        type: MenuItemType.SUBMENU,
        tooltip: 'Extend the Track past the latest data.',
        icons: ['<i class="fa fa-fw fa-long-arrow-right"></i>'],
        children: [
          {
            label: 'Track to... (rhumb)',
            eventType: EventType.PREDICT_TRACK_RHUMB,
            tooltip: 'Extend the Track using constant-heading rhumb line.',
            icons: ['<i class="fa fa-fw fa-share"></i>'],
            metricKey: Metrics.Keys.PREDICT_TRACK_RHUMB,
            handler: handlePredictRhumb,
            sort: 10
          },
          {
            label: 'Track to... (geodesic)',
            eventType: EventType.PREDICT_TRACK_GEODESIC,
            tooltip: 'Extend the Track using shortest path geodesic line.',
            icons: ['<i class="fa fa-fw fa-long-arrow-right"></i>'],
            metricKey: Metrics.Keys.PREDICT_TRACK_GEODESIC,
            handler: handlePredictGeodesic,
            sort: 20
          }
        ],
        sort: 260
      });
    }

    group.addChild({
      label: TRACK_GROUP,
      icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
      type: MenuItemType.SUBMENU,
      children: children
    });
  }
};

/**
 * Test if a layer menu context has features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @return {boolean} If the context has a single layer containing one or more features.
 */
export const hasFeatures = function(context) {
  if (context && context.length == 1) {
    const node = context[0];
    if (node instanceof LayerNode) {
      const layer = node.getLayer();
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source instanceof VectorSource) {
          return source.getFeatureCount() > 0;
        }
      }
    } else if (node instanceof KMLNode) {
      const features = node.getFeatures();
      return features != null && features.length > 0;
    }
  }

  return false;
};

/**
 * Test if a layer menu context has selected features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @return {boolean} If the context has a single layer containing one or more selected features.
 */
export const hasSelectedFeatures = function(context) {
  if (context && context.length == 1) {
    const node = context[0];
    if (node instanceof LayerNode) {
      const layer = node.getLayer();
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source instanceof VectorSource) {
          return source.getSelectedItems().length > 0;
        }
      }
    }
  }

  return false;
};

/**
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfHasFeatures = function(context) {
  if (Event.isSelectedEvent(this.eventType)) {
    this.visible = hasSelectedFeatures(context);
  } else {
    this.visible = hasFeatures(context);
  }
};

/**
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfTracksExist = function(context) {
  const trackNode = PlacesManager.getInstance().getPlacesRoot();
  if (Event.isSelectedEvent(this.eventType)) {
    this.visible = trackNode != null && trackNode.hasFeatures() && hasSelectedFeatures(context);
  } else {
    this.visible = trackNode != null && trackNode.hasFeatures() && hasFeatures(context);
  }
};

/**
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfTrackNode = function(context) {
  this.visible = false;

  if (context) {
    const trackNodes = getTrackNodes(context);
    this.visible = trackNodes && trackNodes.length === context.length;
  }
};

/**
 * Set up track items in the spatial menu.
 * @param {boolean=} opt_enablePredict true to include "Predict" track capabilities
 */
export const spatialSetup = function(opt_enablePredict = false) {
  const menu = spatial.getMenu();
  if (menu) {
    const root = menu.getRoot();
    const group = root.find(spatial.Group.FEATURES);
    asserts.assert(group, 'Group "' + spatial.Group.FEATURES + '" should exist! Check spelling?');

    group.addChild({
      eventType: EventType.FOLLOW,
      label: 'Follow Track',
      tooltip: 'Follow the track as it animates.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 80,
      metricKey: Metrics.Keys.FOLLOW_TRACK,
      beforeRender: visibleIfIsNotFollowed,
      handler: handleFollowTrackEvent
    });

    group.addChild({
      eventType: EventType.UNFOLLOW,
      label: 'Unfollow Track',
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 90,
      metricKey: Metrics.Keys.UNFOLLOW_TRACK,
      beforeRender: visibleIfIsFollowed,
      handler: handleUnfollowTrackEvent
    });

    group.addChild({
      eventType: EventType.HIDE_LINE,
      label: 'Hide Track Line',
      tooltip: 'Do not show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 100,
      metricKey: Metrics.Keys.HIDE_TRACK_LINE,
      beforeRender: visibleIfLineIsShown,
      handler: goog.partial(setShowTrackLine, false)
    });

    group.addChild({
      eventType: EventType.SHOW_LINE,
      label: 'Show Track Line',
      tooltip: 'Show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 110,
      metricKey: Metrics.Keys.SHOW_TRACK_LINE,
      beforeRender: visibleIfLineIsHidden,
      handler: goog.partial(setShowTrackLine, true)
    });

    group.addChild({
      eventType: EventType.ENABLE_INTERPOLATE_MARKER,
      label: 'Disable Marker Interpolation',
      tooltip: 'Only move track marker when there is a supporting feature.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
      sort: 120,
      beforeRender: visibleIfMarkerInterpolationEnabled,
      handler: goog.partial(setMarkerInterpolationEnabled, false)
    });

    group.addChild({
      eventType: EventType.DISABLE_INTERPOLATE_MARKER,
      label: 'Enable Marker Interpolation',
      tooltip: 'Show the interpolated position of the track marker.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
      sort: 130,
      beforeRender: visibleIfMarkerInterpolationDisabled,
      handler: goog.partial(setMarkerInterpolationEnabled, true)
    });

    if (opt_enablePredict) {
      group.addChild({
        label: 'Predict',
        type: MenuItemType.SUBMENU,
        tooltip: 'Extend the Track past the latest data.',
        icons: ['<i class="fa fa-fw fa-long-arrow-right"></i>'],
        children: [
          {
            label: 'Track to... (rhumb)',
            eventType: EventType.PREDICT_TRACK_RHUMB,
            tooltip: 'Extend the Track using constant-heading rhumb line.',
            icons: ['<i class="fa fa-fw fa-share"></i>'],
            metricKey: Metrics.Keys.PREDICT_TRACK_RHUMB,
            handler: handlePredictRhumb,
            sort: 10
          },
          {
            label: 'Track to... (geodesic)',
            eventType: EventType.PREDICT_TRACK_GEODESIC,
            tooltip: 'Extend the Track using shortest path geodesic line.',
            icons: ['<i class="fa fa-fw fa-long-arrow-right"></i>'],
            metricKey: Metrics.Keys.PREDICT_TRACK_GEODESIC,
            handler: handlePredictGeodesic,
            sort: 20
          }
        ],
        sort: 260
      });
    }
  }
};

/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfMarkerInterpolationEnabled = function(context) {
  this.visible = !!context && isMarkerInterpolationOn(context);
};

/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfMarkerInterpolationDisabled = function(context) {
  this.visible = !!context && getTracks(context).length > 0 &&
      !isMarkerInterpolationOn(context);
};

/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
export const isMarkerInterpolationOn = function(opt_context) {
  if (opt_context) {
    const tracks = getTracks(/** @type {Object|null|undefined} */ (opt_context));
    if (tracks.length > 0) {
      return osTrack.getInterpolateMarker(/** @type {!OlFeature} */ (tracks[0]));
    }
  }

  return false;
};

/**
 * Check if a track's line is hidden.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is not followed.
 */
export const isMarkerInterpolationOff = function(opt_context) {
  if (opt_context) {
    return getTracks(/** @type {Object|null|undefined} */ (opt_context)).length > 0 &&
      !isMarkerInterpolationOn(opt_context);
  }

  return false;
};

/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfLineIsShown = function(context) {
  this.visible = !!context && isLineShown(context);
};

/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfLineIsHidden = function(context) {
  this.visible = !!context && getTracks(context).length > 0 &&
      !isLineShown(context);
};

/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
export const isLineShown = function(opt_context) {
  if (opt_context) {
    const tracks = getTracks(/** @type {Object|null|undefined} */ (opt_context));
    if (tracks.length > 0) {
      return osTrack.getShowLine(/** @type {!OlFeature} */ (tracks[0]));
    }
  }

  return false;
};

/**
 * Check if a track's line is hidden.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is not followed.
 */
export const isLineHidden = function(opt_context) {
  if (opt_context) {
    return getTracks(/** @type {Object|null|undefined} */ (opt_context)).length > 0 &&
      !isLineShown(opt_context);
  }

  return false;
};

/**
 * Shows a menu item if the menu context contains a single track feature.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfTrackFeature = function(context) {
  this.visible = !!context && !!context.feature && osTrack.isTrackFeature(context.feature);
};

/**
 * Shows a menu item if the menu context contains tracks that are not followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfIsNotFollowed = function(context) {
  this.visible = !!context && isNotFollowed(context);
};

/**
 * Shows a menu item if the menu context contains tracks that are are followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {OsMenuItem}
 */
export const visibleIfIsFollowed = function(context) {
  this.visible = !!context && getTracks(context).length > 0 &&
      isFollowed(context);
};

/**
 * Check if a track is currently being followed.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
export const isFollowed = function(opt_context) {
  if (opt_context) {
    const tm = TrackManager.getInstance();
    const tracks = getTracks(/** @type {Object|null|undefined} */ (opt_context));
    if (tracks.length > 0) {
      return tm.isFollowed(tracks);
    }
  }

  return false;
};

/**
 * Check if a track is not being followed.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is not followed.
 */
export const isNotFollowed = function(opt_context) {
  if (opt_context) {
    return getTracks(/** @type {Object|null|undefined} */ (opt_context)).length > 0 &&
      !isFollowed(opt_context);
  }

  return false;
};

/**
 * Get track nodes from menu event context.
 *
 * @param {*=} opt_context The menu event context.
 * @return {Array<!KMLNode>}
 */
export const getTrackNodes = function(opt_context) {
  if (opt_context && opt_context.length > 0) {
    return /** @type {!Array<!KMLNode>} */ (
      opt_context.filter(function(arg) {
        return arg instanceof KMLNode && arg.getFeature() != null &&
            instanceOf(arg.getFeature(), DynamicFeature.NAME);
      })
    );
  }

  return null;
};

/**
 * Handle the follow track menu event.
 *
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const handleFollowTrackEvent = function(event) {
  const context = event.getContext();
  if (context) {
    const tracks = getTracks((context));
    if (tracks.length > 0) {
      TrackManager.getInstance().followTracks(tracks);
    }
  }
};

/**
 * Handle the unfollow track menu event.
 *
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const handleUnfollowTrackEvent = function(event) {
  const context = event.getContext();
  if (context) {
    const tracks = getTracks((context));
    if (tracks.length > 0) {
      TrackManager.getInstance().unfollowTracks(tracks);
    }
  }
};

/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const setShowTrackLine = function(show, event) {
  const context = event.getContext();
  if (context) {
    const tracks = getTracks((context));
    for (let i = 0; i < tracks.length; i++) {
      osTrack.setShowLine(/** @type {!OlFeature} */ (tracks[i]), show);
    }
  }
};

/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const setMarkerInterpolationEnabled = function(show, event) {
  const context = event.getContext();
  if (context) {
    const tracks = getTracks((context));
    for (let i = 0; i < tracks.length; i++) {
      osTrack.setInterpolateMarker(/** @type {!OlFeature} */ (tracks[i]), show);
    }
  }
};

/**
 * Determine the track based on the received event
 *
 * @param {Array<Object>|Object|undefined} context The menu context.
 * @return {Array<OlFeature>}
 */
export const getTracks = function(context) {
  const tracks = [];
  if (context) {
    if (context.feature && osTrack.isTrackFeature(context.feature)) {
      tracks.push(/** @type {!OlFeature} */ (context.feature));
    } else if (Array.isArray(context)) {
      const trackNodes = getTrackNodes(context);
      if (trackNodes && trackNodes.length === context.length) {
        for (let i = 0; i < trackNodes.length; i++) {
          tracks.push(trackNodes[i].getFeature());
        }
      }
    } else if (instanceOf(context, VectorSource.NAME)) {
      const source = /** @type {!VectorSource} */ (context);
      const temp = source.getSelectedItems();
      for (let i = 0; i < temp.length; i++) {
        if (osTrack.isTrackFeature(temp[i])) {
          tracks.push(temp[i]);
        }
      }
    }
  }

  return tracks;
};

/**
 * Handle add/create events from the layer menu.
 *
 * @param {!MenuEvent<osUiMenuLayer.Context>} event The menu event.
 */
const handleAddCreateTrackEvent_ = function(event) {
  const context = event.getContext();
  if (context && context.length == 1) {
    const node = context[0];
    let features;
    let title;

    if (node instanceof LayerNode) {
      const layer = node.getLayer();
      if (layer instanceof OLVectorLayer) {
        title = layer.getTitle() + ' Track';

        const source = layer.getSource();
        if (source) {
          if (Event.isSelectedEvent(event.type)) {
            features = source.getSelectedItems();
          } else {
            features = source.getFeatures();
          }
        }
      }
    } else if (node instanceof KMLNode) {
      features = node.getFeatures();
      title = node.getLabel() + ' Track';
    }

    if (features && features.length) {
      if (event.type.startsWith(EventType.CREATE_TRACK)) {
        osTrack.promptForTitleAndMetadata(title).then(function({includeMetadata, title}) {
          osTrack.getSortField(features[0]).then(function(sortField) {
            const options = /** @type {!CreateOptions} */ ({
              features: features,
              includeMetadata,
              name: title,
              sortField: sortField
            });

            pluginTrack.createAndAdd(options);
          });
        });
      } else if (event.type.startsWith(EventType.ADD_TO)) {
        const tm = TrackManager.getInstance();
        tm.promptForTrack().then(function(track) {
          if (track) {
            const metadataMap = track.get(TrackField.METADATA_MAP);
            osTrack.addToTrack({
              track: track,
              features: features,
              // Include metadata if previously included.
              includeMetadata: !!metadataMap
            });
          }
        });
      }
    }
  }
};

/**
 * Handle the predict rhumb menu event.
 *
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const handlePredictRhumb = function(event) {
  // set the interpolation method
  OsMeasure.method = OsInterpolateMethod.RHUMB;
  settings.set('measureMethod', OsInterpolateMethod.RHUMB);

  handlePredict_(event);
};

/**
 * Handle the predict geodesic menu event.
 *
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 */
export const handlePredictGeodesic = function(event) {
  // set the interpolation method
  OsMeasure.method = OsInterpolateMethod.GEODESIC;
  settings.set('measureMethod', OsInterpolateMethod.GEODESIC);

  handlePredict_(event);
};

/**
 * Handle the predict geodesic menu event.
 *
 * @param {!(ActionEvent|MenuEvent)} event The menu event.
 * @protected
 */
const handlePredict_ = function(event) {
  const context = event.getContext();
  if (context && context.mapBrowserEvent) {
    const tm = TrackManager.getInstance();
    let tracks = getTracks(context);

    if (tracks && tracks.length == 0) {
      tracks = [context.feature]; // single feature
    }

    tm.promptForTrackPrediction(tracks, context.mapBrowserEvent);
  }
};
