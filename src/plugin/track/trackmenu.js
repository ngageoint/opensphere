goog.module('plugin.track.menu');
goog.module.declareLegacyNamespace();

const DynamicFeature = goog.require('os.feature.DynamicFeature');
const instanceOf = goog.require('os.instanceOf');
const osSource = goog.require('os.source');
const osTrack = goog.require('os.track');
const osUiMenuLayer = goog.require('os.ui.menu.layer');
const spatial = goog.require('os.ui.menu.spatial');
const PlacesManager = goog.require('plugin.places.PlacesManager');
const pluginTrack = goog.require('plugin.track');
const Event = goog.require('plugin.track.Event');
const EventType = goog.require('plugin.track.EventType');
const TrackManager = goog.require('plugin.track.TrackManager');


goog.require('plugin.track.confirmTrackDirective');

/**
 * Menu group for track actions.
 * @type {string}
 */
const TRACK_GROUP = 'Tracks';

/**
 * Add track items to the layer menu.
 */
const layerSetup = function() {
  var menu = osUiMenuLayer.MENU;
  if (menu && !menu.getRoot().find(TRACK_GROUP)) {
    var group = menu.getRoot().find(osUiMenuLayer.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: TRACK_GROUP,
      icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
      type: os.ui.menu.MenuItemType.SUBMENU,
      children: [
        {
          label: 'Create Track',
          eventType: EventType.CREATE_TRACK,
          tooltip: 'Creates a new track by linking all features in time order.',
          icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
          metricKey: pluginTrack.Metrics.Keys.CREATE_LAYER,
          beforeRender: visibleIfHasFeatures,
          handler: handleAddCreateTrackEvent_,
          sort: 200
        },
        {
          label: 'Create Track From Selected',
          eventType: EventType.CREATE_FROM_SELECTED,
          tooltip: 'Creates a new track by linking selected features in time order.',
          icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
          metricKey: pluginTrack.Metrics.Keys.CREATE_LAYER,
          beforeRender: visibleIfHasFeatures,
          handler: handleAddCreateTrackEvent_,
          sort: 201
        },
        {
          label: 'Add to Track...',
          eventType: EventType.ADD_TO,
          tooltip: 'Adds all features to an existing track.',
          icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
          metricKey: pluginTrack.Metrics.Keys.ADD_TO_LAYER,
          beforeRender: visibleIfTracksExist,
          handler: handleAddCreateTrackEvent_,
          sort: 210
        },
        {
          label: 'Add Selected to Track...',
          eventType: EventType.ADD_FROM_SELECTED,
          tooltip: 'Adds selected features to an existing track.',
          icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
          metricKey: pluginTrack.Metrics.Keys.ADD_TO_LAYER,
          beforeRender: visibleIfTracksExist,
          handler: handleAddCreateTrackEvent_,
          sort: 211
        },
        {
          label: 'Follow Track',
          eventType: EventType.FOLLOW,
          tooltip: 'Follow the track as it animates.',
          icons: ['<i class="fa fa-fw fa-globe"></i>'],
          metricKey: pluginTrack.Metrics.Keys.FOLLOW_TRACK,
          beforeRender: visibleIfIsNotFollowed,
          handler: handleFollowTrackEvent,
          sort: 220
        },
        {
          label: 'Unfollow Track',
          eventType: EventType.UNFOLLOW,
          tooltip: 'Cancel following the track during animation.',
          icons: ['<i class="fa fa-fw fa-globe"></i>'],
          metricKey: pluginTrack.Metrics.Keys.UNFOLLOW_TRACK,
          beforeRender: visibleIfIsFollowed,
          handler: handleUnfollowTrackEvent,
          sort: 220
        },
        {
          label: 'Hide Track Line',
          eventType: EventType.HIDE_LINE,
          tooltip: 'Do not show the track line.',
          icons: ['<i class="fa fa-fw fa-level-up"></i>'],
          metricKey: pluginTrack.Metrics.Keys.HIDE_TRACK_LINE,
          beforeRender: visibleIfLineIsShown,
          handler: goog.partial(setShowTrackLine, false),
          sort: 230
        },
        {
          label: 'Show Track Line',
          eventType: EventType.SHOW_LINE,
          tooltip: 'Show the track line.',
          icons: ['<i class="fa fa-fw fa-level-up"></i>'],
          metricKey: pluginTrack.Metrics.Keys.SHOW_TRACK_LINE,
          beforeRender: visibleIfLineIsHidden,
          handler: goog.partial(setShowTrackLine, true),
          sort: 230
        },
        {
          label: 'Disable Track Interpolation',
          eventType: EventType.ENABLE_INTERPOLATE_MARKER,
          tooltip: 'Only move track marker when there is a supporting feature.',
          icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
          metricKey: pluginTrack.Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
          beforeRender: visibleIfMarkerInterpolationEnabled,
          handler: goog.partial(setMarkerInterpolationEnabled, false),
          sort: 240
        },
        {
          label: 'Enable Track Interpolation',
          eventType: EventType.DISABLE_INTERPOLATE_MARKER,
          tooltip: 'Show the interpolated position of the track marker.',
          icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
          metricKey: pluginTrack.Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
          beforeRender: visibleIfMarkerInterpolationDisabled,
          handler: goog.partial(setMarkerInterpolationEnabled, true),
          sort: 250
        }
      ]
    });
  }
};

/**
 * Test if a layer menu context has features.
 *
 * @param {osUiMenuLayer.Context} context The menu context.
 * @return {boolean} If the context has a single layer containing one or more features.
 */
const hasFeatures = function(context) {
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      if (layer instanceof os.layer.Vector) {
        var source = layer.getSource();
        if (source instanceof osSource.Vector) {
          return source.getFeatureCount() > 0;
        }
      }
    } else if (node instanceof plugin.file.kml.ui.KMLNode) {
      var features = node.getFeatures();
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
const hasSelectedFeatures = function(context) {
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      if (layer instanceof os.layer.Vector) {
        var source = layer.getSource();
        if (source instanceof osSource.Vector) {
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
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfHasFeatures = function(context) {
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
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfTracksExist = function(context) {
  var trackNode = PlacesManager.getInstance().getPlacesRoot();
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
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfTrackNode = function(context) {
  this.visible = false;

  if (context) {
    var trackNodes = getTrackNodes(context);
    this.visible = trackNodes && trackNodes.length === context.length;
  }
};

/**
 * Set up track items in the spatial menu.
 */
const spatialSetup = function() {
  var menu = spatial.MENU;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(spatial.Group.FEATURES);
    goog.asserts.assert(group, 'Group "' + spatial.Group.FEATURES + '" should exist! Check spelling?');

    group.addChild({
      eventType: EventType.FOLLOW,
      label: 'Follow Track',
      tooltip: 'Follow the track as it animates.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 80,
      metricKey: pluginTrack.Metrics.Keys.FOLLOW_TRACK,
      beforeRender: visibleIfIsNotFollowed,
      handler: handleFollowTrackEvent
    });

    group.addChild({
      eventType: EventType.UNFOLLOW,
      label: 'Unfollow Track',
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 90,
      metricKey: pluginTrack.Metrics.Keys.UNFOLLOW_TRACK,
      beforeRender: visibleIfIsFollowed,
      handler: handleUnfollowTrackEvent
    });

    group.addChild({
      eventType: EventType.HIDE_LINE,
      label: 'Hide Track Line',
      tooltip: 'Do not show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 100,
      metricKey: pluginTrack.Metrics.Keys.HIDE_TRACK_LINE,
      beforeRender: visibleIfLineIsShown,
      handler: goog.partial(setShowTrackLine, false)
    });

    group.addChild({
      eventType: EventType.SHOW_LINE,
      label: 'Show Track Line',
      tooltip: 'Show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 110,
      metricKey: pluginTrack.Metrics.Keys.SHOW_TRACK_LINE,
      beforeRender: visibleIfLineIsHidden,
      handler: goog.partial(setShowTrackLine, true)
    });

    group.addChild({
      eventType: EventType.ENABLE_INTERPOLATE_MARKER,
      label: 'Disable Marker Interpolation',
      tooltip: 'Only move track marker when there is a supporting feature.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: pluginTrack.Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
      sort: 120,
      beforeRender: visibleIfMarkerInterpolationEnabled,
      handler: goog.partial(setMarkerInterpolationEnabled, false)
    });

    group.addChild({
      eventType: EventType.DISABLE_INTERPOLATE_MARKER,
      label: 'Enable Marker Interpolation',
      tooltip: 'Show the interpolated position of the track marker.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: pluginTrack.Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
      sort: 130,
      beforeRender: visibleIfMarkerInterpolationDisabled,
      handler: goog.partial(setMarkerInterpolationEnabled, true)
    });
  }
};

/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfMarkerInterpolationEnabled = function(context) {
  this.visible = !!context && isMarkerInterpolationOn(context);
};

/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfMarkerInterpolationDisabled = function(context) {
  this.visible = !!context && getTracks(context).length > 0
      && !isMarkerInterpolationOn(context);
};

/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
const isMarkerInterpolationOn = function(opt_context) {
  if (opt_context) {
    var tracks = getTracks( (opt_context));
    if (tracks.length > 0) {
      return osTrack.getInterpolateMarker(/** @type {!ol.Feature} */ (tracks[0]));
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
const isMarkerInterpolationOff = function(opt_context) {
  if (opt_context) {
    return getTracks( (opt_context)).length > 0 &&
      !isMarkerInterpolationOn(opt_context);
  }

  return false;
};

/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfLineIsShown = function(context) {
  this.visible = !!context && isLineShown(context);
};

/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfLineIsHidden = function(context) {
  this.visible = !!context && getTracks(context).length > 0
      && !isLineShown(context);
};

/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
const isLineShown = function(opt_context) {
  if (opt_context) {
    var tracks = getTracks( (opt_context));
    if (tracks.length > 0) {
      return osTrack.getShowLine(/** @type {!ol.Feature} */ (tracks[0]));
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
const isLineHidden = function(opt_context) {
  if (opt_context) {
    return getTracks( (opt_context)).length > 0 &&
      !isLineShown(opt_context);
  }

  return false;
};

/**
 * Shows a menu item if the menu context contains a single track feature.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfTrackFeature = function(context) {
  this.visible = !!context && !!context.feature && osTrack.isTrackFeature(context.feature);
};

/**
 * Shows a menu item if the menu context contains tracks that are not followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfIsNotFollowed = function(context) {
  this.visible = !!context && isNotFollowed(context);
};

/**
 * Shows a menu item if the menu context contains tracks that are are followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfIsFollowed = function(context) {
  this.visible = !!context && getTracks(context).length > 0 &&
      isFollowed(context);
};

/**
 * Check if a track is currently being followed.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
const isFollowed = function(opt_context) {
  if (opt_context) {
    var tm = TrackManager.getInstance();
    var tracks = getTracks( (opt_context));
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
const isNotFollowed = function(opt_context) {
  if (opt_context) {
    return getTracks( (opt_context)).length > 0 &&
      !isFollowed(opt_context);
  }

  return false;
};

/**
 * Get track nodes from menu event context.
 *
 * @param {*=} opt_context The menu event context.
 * @return {Array<!plugin.file.kml.ui.KMLNode>}
 */
const getTrackNodes = function(opt_context) {
  if (opt_context && opt_context.length > 0) {
    return (
      /** @type {!Array<!plugin.file.kml.ui.KMLNode>} */ opt_context.filter(function(arg) {
        return arg instanceof plugin.file.kml.ui.KMLNode && arg.getFeature() != null &&
            instanceOf(arg.getFeature(), DynamicFeature.NAME);
      })
    );
  }

  return null;
};

/**
 * Handle the follow track menu event.
 *
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
const handleFollowTrackEvent = function(event) {
  var context = event.getContext();
  if (context) {
    var tracks = getTracks( (context));
    if (tracks.length > 0) {
      TrackManager.getInstance().followTracks(tracks);
    }
  }
};

/**
 * Handle the unfollow track menu event.
 *
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
const handleUnfollowTrackEvent = function(event) {
  var context = event.getContext();
  if (context) {
    var tracks = getTracks( (context));
    if (tracks.length > 0) {
      TrackManager.getInstance().unfollowTracks(tracks);
    }
  }
};

/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
const setShowTrackLine = function(show, event) {
  var context = event.getContext();
  if (context) {
    var tracks = getTracks( (context));
    for (var i = 0; i < tracks.length; i++) {
      osTrack.setShowLine(/** @type {!ol.Feature} */ (tracks[i]), show);
    }
  }
};

/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
const setMarkerInterpolationEnabled = function(show, event) {
  var context = event.getContext();
  if (context) {
    var tracks = getTracks( (context));
    for (var i = 0; i < tracks.length; i++) {
      osTrack.setInterpolateMarker(/** @type {!ol.Feature} */ (tracks[i]), show);
    }
  }
};

/**
 * Determine the track based on the received event
 *
 * @param {Array<Object>|Object|undefined} context The menu context.
 * @return {Array<ol.Feature>}
 */
const getTracks = function(context) {
  var tracks = [];
  if (context) {
    if (context.feature && osTrack.isTrackFeature(context.feature)) {
      tracks.push(/** @type {!ol.Feature} */ (context.feature));
    } else if (Array.isArray(context)) {
      var trackNodes = getTrackNodes(context);
      if (trackNodes && trackNodes.length === context.length) {
        for (var i = 0; i < trackNodes.length; i++) {
          tracks.push(trackNodes[i].getFeature());
        }
      }
    } else if (instanceOf(context, osSource.Vector.NAME)) {
      var source = /** @type {!osSource.Vector} */ (context);
      var temp = source.getSelectedItems();
      for (var i = 0; i < temp.length; i++) {
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
 * @param {!os.ui.menu.MenuEvent<osUiMenuLayer.Context>} event The menu event.
 */
const handleAddCreateTrackEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    var features;
    var title;

    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      if (layer instanceof ol.layer.Vector) {
        title = layer.getTitle() + ' Track';

        var source = layer.getSource();
        if (source) {
          if (Event.isSelectedEvent(event.type)) {
            features = source.getSelectedItems();
          } else {
            features = source.getFeatures();
          }
        }
      }
    } else if (node instanceof plugin.file.kml.ui.KMLNode) {
      features = node.getFeatures();
      title = node.getLabel() + ' Track';
    }

    if (features && features.length) {
      if (event.type.startsWith(EventType.CREATE_TRACK)) {
        osTrack.promptForTitleAndMetadata(title).then(function({includeMetadata, title}) {
          osTrack.getSortField(features[0]).then(function(sortField) {
            var options = /** @type {!osTrack.CreateOptions} */ ({
              features: features,
              includeMetadata,
              name: title,
              sortField: sortField
            });

            pluginTrack.createAndAdd(options);
          });
        });
      } else if (event.type.startsWith(EventType.ADD_TO)) {
        pluginTrack.promptForTrack().then(function(track) {
          if (track) {
            var metadataMap = track.get(osTrack.TrackField.METADATA_MAP);
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

exports = {
  TRACK_GROUP,
  layerSetup,
  hasFeatures,
  hasSelectedFeatures,
  visibleIfHasFeatures,
  visibleIfTracksExist,
  visibleIfTrackNode,
  spatialSetup,
  visibleIfMarkerInterpolationEnabled,
  visibleIfMarkerInterpolationDisabled,
  isMarkerInterpolationOn,
  isMarkerInterpolationOff,
  visibleIfLineIsShown,
  visibleIfLineIsHidden,
  isLineShown,
  isLineHidden,
  visibleIfTrackFeature,
  visibleIfIsNotFollowed,
  visibleIfIsFollowed,
  isFollowed,
  isNotFollowed,
  getTrackNodes,
  handleFollowTrackEvent,
  handleUnfollowTrackEvent,
  setShowTrackLine,
  setMarkerInterpolationEnabled,
  getTracks
};
