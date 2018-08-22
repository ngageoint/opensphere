goog.provide('os.metrics.TimelineMetrics');
goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');


/**
 * @type {!Array<!os.ui.metrics.MetricNodeOptions>}
 */
os.metrics.TIMELINE_CONTROLS = [
  {
    label: 'Play',
    description: 'The play or pause button animates loaded data over time.',
    key: os.metrics.keys.Timeline.TOGGLE_PLAY
  },
  {
    label: 'Next Frame',
    description: 'This button moves the blue time frame window to the next frame.',
    key: os.metrics.keys.Timeline.NEXT_FRAME
  },
  {
    label: 'Previous Frame',
    description: 'This button moves the blue time frame window to the previous frame.',
    key: os.metrics.keys.Timeline.PREV_FRAME
  },
  {
    label: 'First Frame',
    key: os.metrics.keys.Timeline.FIRST_FRAME
  },
  {
    label: 'Last Frame',
    key: os.metrics.keys.Timeline.LAST_FRAME
  },
  {
    label: 'Zoom In',
    key: os.metrics.keys.Timeline.ZOOM_IN
  },
  {
    label: 'Zoom Out',
    key: os.metrics.keys.Timeline.ZOOM_OUT
  },
  {
    label: 'Mouse Wheel Zoom',
    description: 'Zooms the timeline in or out',
    key: os.metrics.keys.Timeline.MOUSE_ZOOM
  },
  {
    label: 'Record',
    key: os.metrics.keys.Timeline.RECORD
  },
  {
    label: 'Reset',
    key: os.metrics.keys.Timeline.RESET
  },
  {
    label: 'Chart Type',
    key: os.metrics.keys.Timeline.CHART_TYPE
  }
];


/**
 * @type {string}
 * @const
 */
os.metrics.TIMELINE_RANGE_INFO = 'To start drawing a range on the timeline, hold Shift then click and drag on the ' +
    'timeline over the desired range. You can also click the time range button in the timeline controls, then click ' +
    'and drag.';


/**
 * @type {!Array<!os.ui.metrics.MetricNodeOptions>}
 */
os.metrics.TIME_RANGE = [
  {
    label: 'Load',
    description: 'Queries a time range drawn on the timeline. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_LOAD
  },
  {
    label: 'Add',
    description: 'Adds a time range drawn on the timeline. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_ADD
  },
  {
    label: 'Slice',
    description: 'Adds a slice range drawn on the timeline. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_SLICE
  },
  {
    label: 'Select',
    description: 'Selects features in the drawn time range. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_SELECT
  },
  {
    label: 'Select Exclusive',
    description: 'Selects only features in the drawn time range, deselecting all other features. ' +
        os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_SELECTEX
  },
  {
    label: 'Deselect',
    description: 'Deselects all features in the drawn time range. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_DESELECT
  },
  {
    label: 'Zoom',
    description: 'Zooms to the drawn time range. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_ZOOM
  },
  {
    label: 'Animates this time range',
    description: 'Animates data over the drawn time range. ' + os.metrics.TIMELINE_RANGE_INFO,
    key: os.metrics.keys.Timeline.RANGE_ANIMATE
  }
];


/**
 * @type {!Array<!os.ui.metrics.MetricNodeOptions>}
 */
os.metrics.TIME_SETTINGS = [
  {
    label: 'Fade',
    description: '',
    key: os.metrics.keys.Timeline.FADE
  },
  {
    label: 'Time Range',
    key: os.metrics.keys.Timeline.TIME_RANGE
  }
];



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.TimelineMetrics = function() {
  os.metrics.TimelineMetrics.base(this, 'constructor');

  this.setLabel('Timeline');
  this.setDescription('Animate data loaded in the application over a time range.');
  this.setTags(['Animation']);
  this.setIcon('fa fa-clock-o');
  this.setCollapsed(true);

  // manually build the tree
  var leaf = this.getLeafNode();

  this.addChild(leaf, {
    label: 'Open Timeline',
    description: 'The <i class="fa fa-clock-o"></i> icon located at the top' +
        ' center of the screen opens the time-line control.',
    key: os.metrics.keys.Timeline.OPEN
  });

  var controls = this.addChild(leaf, {
    label: 'Control Panel',
    description: 'Controls displayed at the bottom of the timeline.'
  });
  this.addChildren(controls, os.metrics.TIMELINE_CONTROLS);

  var timeRange = this.addChild(leaf, {
    label: 'Time Range Menu',
    descriptions: 'Actions that can be taken using a drawn time range. ' + os.metrics.TIMELINE_RANGE_INFO
  });
  this.addChildren(timeRange, os.metrics.TIME_RANGE);

  var settings = this.addChild(leaf, {
    label: 'Settings',
    description: 'Timeline settings available from the settings button in the control panel.'
  });
  this.addChildren(settings, os.metrics.TIME_SETTINGS);
};
goog.inherits(os.metrics.TimelineMetrics, os.ui.metrics.MetricsPlugin);
