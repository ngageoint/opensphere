goog.module('os.metrics.TimelineMetrics');
goog.module.declareLegacyNamespace();

const {Timeline} = goog.require('os.metrics.keys');
const MetricsPlugin = goog.require('os.ui.metrics.MetricsPlugin');

const MetricNode = goog.requireType('os.ui.metrics.MetricNode');
const MetricNodeOptions = goog.requireType('os.ui.metrics.MetricNodeOptions');


/**
 * @type {!Array<!MetricNodeOptions>}
 */
const timelineControls = [
  {
    label: 'Play',
    description: 'The play or pause button animates loaded data over time.',
    key: Timeline.TOGGLE_PLAY
  }, {
    label: 'Next Frame',
    description: 'This button moves the blue time frame window to the next frame.',
    key: Timeline.NEXT_FRAME
  }, {
    label: 'Previous Frame',
    description: 'This button moves the blue time frame window to the previous frame.',
    key: Timeline.PREV_FRAME
  }, {
    label: 'First Frame',
    key: Timeline.FIRST_FRAME
  }, {
    label: 'Last Frame',
    key: Timeline.LAST_FRAME
  }, {
    label: 'Zoom In',
    key: Timeline.ZOOM_IN
  }, {
    label: 'Zoom Out',
    key: Timeline.ZOOM_OUT
  }, {
    label: 'Mouse Wheel Zoom',
    description: 'Zooms the timeline in or out',
    key: Timeline.MOUSE_ZOOM
  }, {
    label: 'Record',
    key: Timeline.RECORD
  }, {
    label: 'Reset',
    key: Timeline.RESET
  }, {
    label: 'Chart Type',
    key: Timeline.CHART_TYPE
  }
];

/**
 * @type {string}
 * @const
 */
const timelineRangeInfo = 'To start drawing a range on the timeline, hold Shift then click and drag on the ' +
    'timeline over the desired range. You can also click the time range button in the timeline controls, then click ' +
    'and drag.';

/**
 * @type {!Array<!MetricNodeOptions>}
 */
const timeRangeMetrics = [
  {
    label: 'Load',
    description: 'Queries a time range drawn on the timeline. ' + timelineRangeInfo,
    key: Timeline.RANGE_LOAD
  }, {
    label: 'Add',
    description: 'Adds a time range drawn on the timeline. ' + timelineRangeInfo,
    key: Timeline.RANGE_ADD
  }, {
    label: 'Slice',
    description: 'Adds a slice range drawn on the timeline. ' + timelineRangeInfo,
    key: Timeline.RANGE_SLICE
  }, {
    label: 'Select',
    description: 'Selects features in the drawn time range. ' + timelineRangeInfo,
    key: Timeline.RANGE_SELECT
  }, {
    label: 'Select Exclusive',
    description: 'Selects only features in the drawn time range, deselecting all other features. ' +
        timelineRangeInfo,
    key: Timeline.RANGE_SELECTEX
  }, {
    label: 'Deselect',
    description: 'Deselects all features in the drawn time range. ' + timelineRangeInfo,
    key: Timeline.RANGE_DESELECT
  }, {
    label: 'Zoom',
    description: 'Zooms to the drawn time range. ' + timelineRangeInfo,
    key: Timeline.RANGE_ZOOM
  }, {
    label: 'Animate',
    description: 'Animates data over the drawn time range. ' + timelineRangeInfo,
    key: Timeline.RANGE_ANIMATE
  }, {
    label: 'Remove',
    description: 'Removes the features in this time range. ' + timelineRangeInfo,
    key: Timeline.REMOVE
  }, {
    label: 'Feature Info',
    description: 'Shows detailed metadata for the features in this time range. ' + timelineRangeInfo,
    key: Timeline.FEATURE_INFO
  }, {
    label: 'Go To',
    description: 'Repositions the map to show the features in this time range. ' + timelineRangeInfo,
    key: Timeline.GO_TO
  }
];

/**
 * @type {!Array<!MetricNodeOptions>}
 */
const timeSettingsMetrics = [
  {
    label: 'Fade',
    description: 'Fade in/out features based on the size of your timeline window and scroll direction',
    key: Timeline.FADE
  }, {
    label: 'Lock',
    description: 'Locks start of view window during animation',
    key: Timeline.LOCK
  }, {
    label: 'Time Range',
    description: 'Changes the load range from the timeline settings',
    key: Timeline.TIME_RANGE
  }
];

/**
 */
class TimelineMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
      key: Timeline.OPEN
    });

    var controls = this.addChild(leaf, {
      label: 'Control Panel',
      description: 'Controls displayed at the bottom of the timeline.'
    });
    this.addChildren(controls, timelineControls);

    var timeRange = this.addChild(leaf, {
      label: 'Time Range Menu',
      descriptions: 'Actions that can be taken using a drawn time range. ' + timelineRangeInfo
    });
    this.addChildren(timeRange, timeRangeMetrics);

    var settings = this.addChild(leaf, {
      label: 'Settings',
      description: 'Timeline settings available from the settings button in the control panel.'
    });
    this.addChildren(settings, timeSettingsMetrics);
  }
}

exports = TimelineMetrics;
