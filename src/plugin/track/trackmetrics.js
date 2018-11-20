goog.provide('plugin.track.Metrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
plugin.track.Metrics = function() {
  plugin.track.Metrics.base(this, 'constructor');

  this.setLabel('Tracks');
  this.setIcon('fa fa-share-alt');
  this.setCollapsed(true);
  this.setDescription('Plugin for tracks. Provides the ability to create tracks that can be animated over time.');

  var leaf = this.getLeafNode();
  this.addChild(leaf, {
    label: 'Create Track',
    description: 'Creates a new track by linking selected features (or all features if none are selected) in time ' +
      'order.',
    key: plugin.track.Metrics.Keys.CREATE_LAYER
  });

  this.addChild(leaf, {
    label: 'Add to Track',
    description: 'Adds selected features (or all features if none are selected) to an existing track.',
    key: plugin.track.Metrics.Keys.ADD_TO_LAYER
  });

  this.addChild(leaf, {
    label: 'Follow Track',
    description: 'Follow the track as it animates.',
    key: plugin.track.Metrics.Keys.FOLLOW_TRACK
  });

  this.addChild(leaf, {
    label: 'Unfollow Track',
    description: 'Cancel following the track during animation.',
    key: plugin.track.Metrics.Keys.UNFOLLOW_TRACK
  });

  this.addChild(leaf, {
    label: 'Hide Track Line',
    description: 'Do not show the track line.',
    key: plugin.track.Metrics.Keys.HIDE_TRACK_LINE
  });

  this.addChild(leaf, {
    label: 'Show Track Line',
    description: 'Show the track line.',
    key: plugin.track.Metrics.Keys.SHOW_TRACK_LINE
  });

  this.addChild(leaf, {
    label: 'Disable Marker Interpolation',
    description: 'Only move track marker when there is a supporting feature.',
    key: plugin.track.Metrics.Keys.ENABLE_INTERPOLATE_MARKER
  });

  this.addChild(leaf, {
    label: 'Enable Marker Interpolation',
    description: 'Show the interpolated position of the track marker.',
    key: plugin.track.Metrics.Keys.DISABLE_INTERPOLATE_MARKER
  });
};
goog.inherits(plugin.track.Metrics, os.ui.metrics.MetricsPlugin);


/**
 * Metric keys for the track plugin.
 * @enum {string}
 */
plugin.track.Metrics.Keys = {
  CREATE_LAYER: 'track.create-layer',
  ADD_TO_LAYER: 'track.addTo-layer',
  FOLLOW_TRACK: 'track.followTrack',
  UNFOLLOW_TRACK: 'track.unfollowTrack',
  HIDE_TRACK_LINE: 'track.hideTrackLine',
  SHOW_TRACK_LINE: 'track.showTrackLine',
  ENABLE_INTERPOLATE_MARKER: 'track.enableInterplateMarker',
  DISABLE_INTERPOLATE_MARKER: 'track.disableInterpolateMarker'
};
