goog.provide('plugin.track.menu');

goog.require('os.feature.DynamicFeature');
goog.require('os.instanceOf');
goog.require('os.source');
goog.require('os.ui.menu.layer');
goog.require('os.ui.menu.spatial');
goog.require('plugin.track');
goog.require('plugin.track.Event');
goog.require('plugin.track.EventType');
goog.require('plugin.track.TrackManager');
goog.require('plugin.track.confirmTrackDirective');


/**
 * Add track items to the layer menu.
 */
plugin.track.menu.layerSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.track.EventType.CREATE_TRACK)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Track',
      eventType: plugin.track.EventType.CREATE_TRACK,
      tooltip: 'Creates a new track by linking selected features (or all features if none are selected) in time order.',
      icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
      metricKey: plugin.track.Metrics.Keys.CREATE_LAYER,
      beforeRender: plugin.track.menu.visibleIfHasFeatures,
      handler: plugin.track.menu.handleAddCreateTrackEvent_,
      sort: 200
    });

    group.addChild({
      label: 'Add to Track...',
      eventType: plugin.track.EventType.ADD_TO,
      tooltip: 'Adds selected features (or all features if none are selected) to an existing track.',
      icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
      metricKey: plugin.track.Metrics.Keys.ADD_TO_LAYER,
      beforeRender: plugin.track.menu.visibleIfTracksExist,
      handler: plugin.track.menu.handleAddCreateTrackEvent_,
      sort: 210
    });

    group.addChild({
      label: 'Follow Track',
      eventType: plugin.track.EventType.FOLLOW,
      tooltip: 'Follow the track as it animates.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      metricKey: plugin.track.Metrics.Keys.FOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsNotFollowed,
      handler: plugin.track.menu.handleFollowTrackEvent,
      sort: 220
    });

    group.addChild({
      label: 'Unfollow Track',
      eventType: plugin.track.EventType.UNFOLLOW,
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      metricKey: plugin.track.Metrics.Keys.UNFOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsFollowed,
      handler: plugin.track.menu.handleUnfollowTrackEvent,
      sort: 220
    });

    group.addChild({
      label: 'Hide Track Line',
      eventType: plugin.track.EventType.HIDE_LINE,
      tooltip: 'Do not show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      metricKey: plugin.track.Metrics.Keys.HIDE_TRACK_LINE,
      beforeRender: plugin.track.menu.visibleIfLineIsShown,
      handler: goog.partial(plugin.track.menu.setShowTrackLine, false),
      sort: 230
    });

    group.addChild({
      label: 'Show Track Line',
      eventType: plugin.track.EventType.SHOW_LINE,
      tooltip: 'Show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      metricKey: plugin.track.Metrics.Keys.SHOW_TRACK_LINE,
      beforeRender: plugin.track.menu.visibleIfLineIsHidden,
      handler: goog.partial(plugin.track.menu.setShowTrackLine, true),
      sort: 230
    });

    group.addChild({
      label: 'Disable Track Interpolation',
      eventType: plugin.track.EventType.ENABLE_INTERPOLATE_MARKER,
      tooltip: 'Only move track marker when there is a supporting feature.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: plugin.track.Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
      beforeRender: plugin.track.menu.visibleIfMarkerInterpolationEnabled,
      handler: goog.partial(plugin.track.menu.setMarkerInterpolationEnabled, false),
      sort: 240
    });

    group.addChild({
      label: 'Enable Track Interpolation',
      eventType: plugin.track.EventType.DISABLE_INTERPOLATE_MARKER,
      tooltip: 'Show the interpolated position of the track marker.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: plugin.track.Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
      beforeRender: plugin.track.menu.visibleIfMarkerInterpolationDisabled,
      handler: goog.partial(plugin.track.menu.setMarkerInterpolationEnabled, true),
      sort: 250
    });
  }
};


/**
 * Test if a layer menu context has features.
 *
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @return {boolean} If the context has a single layer containing one or more features.
 */
plugin.track.menu.hasFeatures = function(context) {
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof os.data.LayerNode) {
      var layer = node.getLayer();
      if (layer instanceof os.layer.Vector && layer.getId() !== plugin.track.ID) {
        var source = layer.getSource();
        if (source instanceof os.source.Vector) {
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
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfHasFeatures = function(context) {
  this.visible = plugin.track.menu.hasFeatures(context);
};


/**
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTracksExist = function(context) {
  var trackNode = plugin.track.getTrackNode();
  this.visible = trackNode != null && trackNode.hasFeatures() && plugin.track.menu.hasFeatures(context);
};


/**
 * Show a menu item if one or more tracks exist and the layer has features.
 *
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTrackNode = function(context) {
  this.visible = false;

  if (context) {
    var trackNodes = plugin.track.menu.getTrackNodes(context);
    this.visible = trackNodes.length === context.length;
  }
};


/**
 * Set up track items in the spatial menu.
 */
plugin.track.menu.spatialSetup = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(os.ui.menu.spatial.Group.FEATURES);
    goog.asserts.assert(group, 'Group "' + os.ui.menu.spatial.Group.FEATURES + '" should exist! Check spelling?');

    group.addChild({
      eventType: plugin.track.EventType.FOLLOW,
      label: 'Follow Track',
      tooltip: 'Follow the track as it animates.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 80,
      metricKey: plugin.track.Metrics.Keys.FOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsNotFollowed,
      handler: plugin.track.menu.handleFollowTrackEvent
    });

    group.addChild({
      eventType: plugin.track.EventType.UNFOLLOW,
      label: 'Unfollow Track',
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 90,
      metricKey: plugin.track.Metrics.Keys.UNFOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsFollowed,
      handler: plugin.track.menu.handleUnfollowTrackEvent
    });

    group.addChild({
      eventType: plugin.track.EventType.HIDE_LINE,
      label: 'Hide Track Line',
      tooltip: 'Do not show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 100,
      metricKey: plugin.track.Metrics.Keys.HIDE_TRACK_LINE,
      beforeRender: plugin.track.menu.visibleIfLineIsShown,
      handler: goog.partial(plugin.track.menu.setShowTrackLine, false)
    });

    group.addChild({
      eventType: plugin.track.EventType.SHOW_LINE,
      label: 'Show Track Line',
      tooltip: 'Show the track line.',
      icons: ['<i class="fa fa-fw fa-level-up"></i>'],
      sort: 110,
      metricKey: plugin.track.Metrics.Keys.SHOW_TRACK_LINE,
      beforeRender: plugin.track.menu.visibleIfLineIsHidden,
      handler: goog.partial(plugin.track.menu.setShowTrackLine, true)
    });

    group.addChild({
      eventType: plugin.track.EventType.ENABLE_INTERPOLATE_MARKER,
      label: 'Disable Marker Interpolation',
      tooltip: 'Only move track marker when there is a supporting feature.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: plugin.track.Metrics.Keys.ENABLE_INTERPOLATE_MARKER,
      sort: 120,
      beforeRender: plugin.track.menu.visibleIfMarkerInterpolationEnabled,
      handler: goog.partial(plugin.track.menu.setMarkerInterpolationEnabled, false)
    });

    group.addChild({
      eventType: plugin.track.EventType.DISABLE_INTERPOLATE_MARKER,
      label: 'Enable Marker Interpolation',
      tooltip: 'Show the interpolated position of the track marker.',
      icons: ['<i class="fa fa-fw fa-star-half-o fa-rotate-270"></i>'],
      metricKey: plugin.track.Metrics.Keys.DISABLE_INTERPOLATE_MARKER,
      sort: 130,
      beforeRender: plugin.track.menu.visibleIfMarkerInterpolationDisabled,
      handler: goog.partial(plugin.track.menu.setMarkerInterpolationEnabled, true)
    });
  }
};


/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfMarkerInterpolationEnabled = function(context) {
  this.visible = !!context && plugin.track.menu.isMarkerInterpolationOn(context);
};


/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfMarkerInterpolationDisabled = function(context) {
  this.visible = !!context && plugin.track.menu.getTracks(context).length > 0
      && !plugin.track.menu.isMarkerInterpolationOn(context);
};


/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
plugin.track.menu.isMarkerInterpolationOn = function(opt_context) {
  if (opt_context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (opt_context));
    if (tracks.length > 0) {
      return plugin.track.getInterpolateMarker(/** @type {!ol.Feature} */ (tracks[0]));
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
plugin.track.menu.isMarkerInterpolationOff = function(opt_context) {
  if (opt_context) {
    return plugin.track.menu.getTracks(/** @type {Object} */ (opt_context)).length > 0 &&
      !plugin.track.menu.isMarkerInterpolationOn(opt_context);
  }

  return false;
};


/**
 * Shows a menu item if the menu context contains tracks where their line is shown.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfLineIsShown = function(context) {
  this.visible = !!context && plugin.track.menu.isLineShown(context);
};


/**
 * Shows a menu item if the menu context contains tracks where their line is hidden.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfLineIsHidden = function(context) {
  this.visible = !!context && plugin.track.menu.getTracks(context).length > 0
      && !plugin.track.menu.isLineShown(context);
};


/**
 * Check if a track's line is currently visible.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
plugin.track.menu.isLineShown = function(opt_context) {
  if (opt_context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (opt_context));
    if (tracks.length > 0) {
      return plugin.track.getShowLine(/** @type {!ol.Feature} */ (tracks[0]));
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
plugin.track.menu.isLineHidden = function(opt_context) {
  if (opt_context) {
    return plugin.track.menu.getTracks(/** @type {Object} */ (opt_context)).length > 0 &&
      !plugin.track.menu.isLineShown(opt_context);
  }

  return false;
};


/**
 * Shows a menu item if the menu context contains a single track feature.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTrackFeature = function(context) {
  this.visible = !!context && !!context.feature && plugin.track.isTrackFeature(context.feature);
};


/**
 * Shows a menu item if the menu context contains tracks that are not followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfIsNotFollowed = function(context) {
  this.visible = !!context && plugin.track.menu.isNotFollowed(context);
};


/**
 * Shows a menu item if the menu context contains tracks that are are followed.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfIsFollowed = function(context) {
  this.visible = !!context && plugin.track.menu.getTracks(context).length > 0 &&
      plugin.track.menu.isFollowed(context);
};


/**
 * Check if a track is currently being followed.
 *
 * @param {*=} opt_context The menu event context.
 * @return {boolean} If the track is followed.
 */
plugin.track.menu.isFollowed = function(opt_context) {
  if (opt_context) {
    var tm = plugin.track.TrackManager.getInstance();
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (opt_context));
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
plugin.track.menu.isNotFollowed = function(opt_context) {
  if (opt_context) {
    return plugin.track.menu.getTracks(/** @type {Object} */ (opt_context)).length > 0 &&
      !plugin.track.menu.isFollowed(opt_context);
  }

  return false;
};


/**
 * Get track nodes from menu event context.
 *
 * @param {*=} opt_context The menu event context.
 * @return {Array<!plugin.file.kml.ui.KMLNode>}
 */
plugin.track.menu.getTrackNodes = function(opt_context) {
  if (opt_context && opt_context.length > 0) {
    return /** @type {!Array<!plugin.file.kml.ui.KMLNode>} */ (opt_context.filter(function(arg) {
      return arg instanceof plugin.file.kml.ui.KMLNode && arg.getFeature() != null &&
          os.instanceOf(arg.getFeature(), os.feature.DynamicFeature.NAME);
    }));
  }

  return null;
};


/**
 * Handle the follow track menu event.
 *
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
plugin.track.menu.handleFollowTrackEvent = function(event) {
  var context = event.getContext();
  if (context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (context));
    if (tracks.length > 0) {
      plugin.track.TrackManager.getInstance().followTracks(tracks);
    }
  }
};


/**
 * Handle the unfollow track menu event.
 *
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
plugin.track.menu.handleUnfollowTrackEvent = function(event) {
  var context = event.getContext();
  if (context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (context));
    if (tracks.length > 0) {
      plugin.track.TrackManager.getInstance().unfollowTracks(tracks);
    }
  }
};


/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
plugin.track.menu.setShowTrackLine = function(show, event) {
  var context = event.getContext();
  if (context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (context));
    for (var i = 0; i < tracks.length; i++) {
      plugin.track.setShowLine(/** @type {!ol.Feature} */ (tracks[i]), show);
    }
  }
};


/**
 * Handle the show track line menu event.
 *
 * @param {boolean} show
 * @param {!(os.ui.action.ActionEvent|os.ui.menu.MenuEvent)} event The menu event.
 */
plugin.track.menu.setMarkerInterpolationEnabled = function(show, event) {
  var context = event.getContext();
  if (context) {
    var tracks = plugin.track.menu.getTracks(/** @type {Object} */ (context));
    for (var i = 0; i < tracks.length; i++) {
      plugin.track.setInterpolateMarker(/** @type {!ol.Feature} */ (tracks[i]), show);
    }
  }
};


/**
 * Determine the track based on the received event
 *
 * @param {Array<Object>|Object|undefined} context The menu context.
 * @return {Array<ol.Feature>}
 */
plugin.track.menu.getTracks = function(context) {
  var tracks = [];
  if (context) {
    if (context.feature && plugin.track.isTrackFeature(context.feature)) {
      tracks.push(/** @type {!ol.Feature} */ (context.feature));
    } else if (goog.isArray(context)) {
      var trackNodes = plugin.track.menu.getTrackNodes(context);
      if (trackNodes && trackNodes.length === context.length) {
        for (var i = 0; i < trackNodes.length; i++) {
          tracks.push(trackNodes[i].getFeature());
        }
      }
    } else if (os.instanceOf(context, os.source.Vector.NAME)) {
      var source = /** @type {!os.source.Vector} */ (context);
      var temp = source.getSelectedItems();
      for (var i = 0; i < temp.length; i++) {
        if (plugin.track.isTrackFeature(temp[i])) {
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
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.track.menu.handleAddCreateTrackEvent_ = function(event) {
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
          features = source.getSelectedItems();

          if (features.length == 0) {
            features = source.getFeatures();
          }
        }
      }
    } else if (node instanceof plugin.file.kml.ui.KMLNode) {
      features = node.getFeatures();
      title = node.getLabel() + ' Track';
    }

    if (features && features.length) {
      if (event.type === plugin.track.EventType.CREATE_TRACK) {
        plugin.track.promptForTitle(title).then(function(title) {
          plugin.track.getSortField(features[0]).then(function(sortField) {
            var options = /** @type {!plugin.track.CreateOptions} */ ({
              features: features,
              name: title,
              sortField: sortField
            });

            plugin.track.createAndAdd(options);
          });
        });
      } else if (event.type === plugin.track.EventType.ADD_TO) {
        plugin.track.promptForTrack().then(function(track) {
          if (track) {
            plugin.track.addToTrack({
              track: track,
              features: features
            });
          }
        });
      }
    }
  }
};
