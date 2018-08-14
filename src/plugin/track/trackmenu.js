goog.provide('plugin.track.menu');

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
      metricKey: plugin.track.Metrics.CREATE_LAYER,
      beforeRender: plugin.track.menu.visibleIfLayerHasFeatures,
      handler: plugin.track.menu.handleLayerEvent_
    });

    group.addChild({
      label: 'Add to Track...',
      eventType: plugin.track.EventType.ADD_TO,
      tooltip: 'Adds selected features (or all features if none are selected) to an existing track.',
      icons: ['<i class="fa fa-fw fa-share-alt"></i>'],
      metricKey: plugin.track.Metrics.ADD_TO_LAYER,
      beforeRender: plugin.track.menu.visibleIfTracksExist,
      handler: plugin.track.menu.handleLayerEvent_
    });

    group.addChild({
      label: 'Follow Track',
      eventType: plugin.track.EventType.FOLLOW,
      tooltip: 'Follow the track as it animates.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      metricKey: plugin.track.Metrics.FOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsNotFollowed,
      handler: plugin.track.menu.handleFollowTrackEvent
    });

    group.addChild({
      label: 'Unfollow Track',
      eventType: plugin.track.EventType.UNFOLLOW,
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      metricKey: plugin.track.Metrics.UNFOLLOW_TRACK,
      beforeRender: plugin.track.menu.visibleIfIsFollowed,
      handler: plugin.track.menu.handleUnfollowTrackEvent
    });
  }
};


/**
 * Test if a layer menu context has features.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @return {boolean} If the context has a single layer containing one or more features.
 */
plugin.track.menu.layerHasFeatures = function(context) {
  if (context && context.length == 1 && context[0] instanceof os.data.LayerNode) {
    var layerNode = /** @type {os.data.LayerNode} */ (context[0]);
    var layer = layerNode.getLayer();
    if (layer instanceof os.layer.Vector && layer.getId() !== plugin.track.ID) {
      var source = layer.getSource();
      if (source instanceof os.source.Vector) {
        return source.getFeatureCount() > 0;
      }
    }
  }

  return false;
};


/**
 * Show a menu item if one or more tracks exist and the layer has features.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfLayerHasFeatures = function(context) {
  this.visible = plugin.track.menu.layerHasFeatures(context);
};


/**
 * Show a menu item if one or more tracks exist and the layer has features.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTracksExist = function(context) {
  var trackNode = plugin.track.getTrackNode();
  this.visible = trackNode != null && trackNode.hasFeatures() && plugin.track.menu.layerHasFeatures(context);
};


/**
 * Show a menu item if one or more tracks exist and the layer has features.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTrackNode = function(context) {
  this.visible = false;

  if (context && context.length === 1) {
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
      beforeRender: plugin.track.menu.visibleIfIsNotFollowed,
      handler: plugin.track.menu.handleFollowTrackEvent
    });

    group.addChild({
      eventType: plugin.track.EventType.UNFOLLOW,
      label: 'Unfollow Track',
      tooltip: 'Cancel following the track during animation.',
      icons: ['<i class="fa fa-fw fa-globe"></i>'],
      sort: 90,
      beforeRender: plugin.track.menu.visibleIfIsFollowed,
      handler: plugin.track.menu.handleUnfollowTrackEvent
    });
  }
};


/**
 * Shows a menu item if the menu context contains a single track feature.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfTrackFeature = function(context) {
  this.visible = !!context && !!context.feature && plugin.track.isTrackFeature(context.feature);
};


/**
 * Shows a menu item if the menu context contains tracks that are not followed.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfIsNotFollowed = function(context) {
  this.visible = !!context && plugin.track.menu.isNotFollowed(context);
};


/**
 * Shows a menu item if the menu context contains tracks that are are followed.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.track.menu.visibleIfIsFollowed = function(context) {
  this.visible = !!context && plugin.track.menu.getTracks(context).length > 0 &&
      plugin.track.menu.isFollowed(context);
};


/**
 * Check if a track is currently being followed.
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
 * @param {*=} opt_context The menu event context.
 * @return {Array<!plugin.file.kml.ui.KMLNode>}
 */
plugin.track.menu.getTrackNodes = function(opt_context) {
  if (opt_context && opt_context.length > 0) {
    return /** @type {!Array<!plugin.file.kml.ui.KMLNode>} */ (opt_context.filter(function(arg) {
      return arg instanceof plugin.file.kml.ui.KMLNode && arg.getFeature() != null &&
          arg.getRoot() === plugin.track.getTrackNode();
    }));
  }

  return null;
};


/**
 * Handle the follow track menu event.
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
 * Determine the track based on the received event
 * @param {Object|undefined} context The menu context.
 * @return {Array<ol.Feature>}
 */
plugin.track.menu.getTracks = function(context) {
  var tracks = [];
  if (context) {
    if (context.feature && plugin.track.isTrackFeature(context.feature)) {
      tracks.push(/** @type {!ol.Feature} */ (context.feature));
    } else if (goog.isArray(context) && context.length === 1) {
      var trackNodes = plugin.track.menu.getTrackNodes(context);
      if (trackNodes.length === context.length) {
        tracks.push(trackNodes[0].getFeature());
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
 * Handle track menu events from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.track.menu.handleLayerEvent_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  var layer = layers.length === 1 ? layers[0] : undefined;
  if (layer instanceof ol.layer.Vector) {
    var source = layer.getSource();
    if (source) {
      // slice the array, because sorting the original will break binary insert/remove
      var features = source.getSelectedItems();
      if (features.length == 0) {
        features = source.getFeatures();
      }

      if (features.length > 0) {
        switch (event.type) {
          case plugin.track.EventType.CREATE_TRACK:
            var trackTitle = layer.getTitle() + ' Track';
            plugin.track.promptForTitle(trackTitle).then(function(title) {
              plugin.track.getSortField(features[0]).then(function(sortField) {
                var options = /** @type {!plugin.track.CreateOptions} */ ({
                  features: features,
                  name: title,
                  sortField: sortField
                });

                plugin.track.createAndAdd(options);
              });
            });
            break;
          case plugin.track.EventType.ADD_TO:
            plugin.track.promptForTrack().then(function(track) {
              if (track) {
                plugin.track.addFeaturesToTrack(track, features);
              }
            });
            break;
          default:
            break;
        }
      }
    }
  }
};
