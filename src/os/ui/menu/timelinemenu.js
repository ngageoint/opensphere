goog.module('os.ui.menu.timeline');

const {assert} = goog.require('goog.asserts');
const Range = goog.require('goog.math.Range');
const DataManager = goog.require('os.data.DataManager');
const {flyTo} = goog.require('os.feature');
const Metrics = goog.require('os.metrics.Metrics');
const {Timeline: TimelineKeys} = goog.require('os.metrics.keys');
const VectorSource = goog.require('os.source.Vector');
const TimeRange = goog.require('os.time.TimeRange');
const TimelineActionEventType = goog.require('os.time.TimelineActionEventType');
const TimelineController = goog.require('os.time.TimelineController');
const launchMultiFeatureInfo = goog.require('os.ui.feature.launchMultiFeatureInfo');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const layerMenu = goog.require('os.ui.menu.layer');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const TimelineUI = goog.requireType('os.ui.timeline.TimelineUI');


/**
 * @type {Menu<Array<number>>}
 */
const MENU = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: [{
    label: layerMenu.GroupLabel.TOOLS,
    type: MenuItemType.GROUP,
    sort: 10,
    children: [{
      label: 'Load',
      eventType: TimelineActionEventType.LOAD,
      tooltip: 'Queries this time range, replaces other load ranges',
      icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
      sort: 10
    }, {
      label: 'Add',
      eventType: TimelineActionEventType.ADD,
      tooltip: 'Adds this time range to the loaded ranges',
      icons: ['<i class="fa fa-fw fa-plus"></i>'],
      sort: 20
    }, {
      label: 'Create Slice',
      eventType: TimelineActionEventType.SLICE,
      tooltip: 'Adds time slice which creates a time range less than 24 hours to show data from each loaded day',
      icons: ['<i class="fa fa-fw fa-hand-scissors-o"></i>'],
      sort: 30
    }, {
      label: 'View',
      eventType: TimelineActionEventType.ACTIVE_WINDOW,
      tooltip: 'Sets the active view window to this range',
      icons: ['<i class="fa fa-fw fa-eye"></i>'],
      sort: 40
    }, {
      label: 'Animate',
      eventType: TimelineActionEventType.ANIMATE,
      tooltip: 'Animates this time range',
      icons: ['<i class="fa fa-fw fa-play"></i>'],
      sort: 50
    }, {
      label: 'Skip Animate',
      eventType: TimelineActionEventType.ANIMATE_SKIP,
      tooltip: 'Skip animating this time range',
      icons: ['<i class="fa fa-fw fa-ban"></i>'],
      sort: 60
    }, {
      label: 'Hold Range',
      eventType: TimelineActionEventType.ANIMATE_HOLD,
      tooltip: 'Always show this time range',
      icons: ['<i class="fa fa-fw fa-hand-rock-o"></i>'],
      sort: 70
    }, {
      label: 'Zoom',
      eventType: TimelineActionEventType.ZOOM,
      tooltip: 'Zooms to this time range',
      icons: ['<i class="fa fa-fw fa-crop"></i>'],
      sort: 80
    }]
  }, {
    label: 'Features',
    type: MenuItemType.GROUP,
    sort: 20,
    children: [{
      label: 'Select',
      eventType: TimelineActionEventType.SELECT,
      tooltip: 'Selects features in this time range',
      icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
      sort: 10
    }, {
      label: 'Select Exclusive',
      eventType: TimelineActionEventType.SELECT_EXCLUSIVE,
      tooltip: 'Selects only features in this time range, deselecting all other features',
      icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
      sort: 20
    }, {
      label: 'Deselect',
      eventType: TimelineActionEventType.DESELECT,
      tooltip: 'Deselects the features in this time range',
      icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
      sort: 30
    }, {
      label: 'Remove',
      eventType: TimelineActionEventType.REMOVE,
      tooltip: 'Removes the features in this time range',
      icons: ['<i class="fa fa-fw fa-times"></i>'],
      sort: 40
    }, {
      label: 'Feature Info',
      eventType: TimelineActionEventType.FEATURE_INFO,
      tooltip: 'Shows detailed metadata for the features in this time range',
      icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
      sort: 50
    }, {
      label: 'Go To',
      eventType: TimelineActionEventType.GO_TO,
      tooltip: 'Repositions the map to show the features in this time range',
      icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
      sort: 60
    }]
  }]
}));

/**
 * Timeline menu setup
 */
const setup = function() {
  var menu = MENU;

  menu.listen(TimelineActionEventType.SELECT, onTimeSelect);
  menu.listen(TimelineActionEventType.SELECT_EXCLUSIVE, onTimeSelect);
  menu.listen(TimelineActionEventType.DESELECT, onTimeSelect);
  menu.listen(TimelineActionEventType.LOAD, onTimeLoad);
  menu.listen(TimelineActionEventType.ADD, onTimeAdd);
  menu.listen(TimelineActionEventType.SLICE, onTimeSlice);
  menu.listen(TimelineActionEventType.ZOOM, onTimeZoom);
  menu.listen(TimelineActionEventType.ANIMATE, onAddAnimate);
  menu.listen(TimelineActionEventType.ANIMATE_SKIP, onAddSkipAnimate);
  menu.listen(TimelineActionEventType.ANIMATE_HOLD, onAddHold);
  menu.listen(TimelineActionEventType.REMOVE, onTimeSelect);
  menu.listen(TimelineActionEventType.ACTIVE_WINDOW, onActiveWindow);
  menu.listen(TimelineActionEventType.FEATURE_INFO, onFeatureCollection);
  menu.listen(TimelineActionEventType.GO_TO, onFeatureCollection);
};

/**
 * Clean up menu
 */
const dispose = function() {
  if (MENU) {
    MENU.dispose();
  }
};

/**
 * Time select listener
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onTimeSelect = function(event) {
  var extent = event.getContext();
  assert(extent);

  var mdm = DataManager.getInstance();
  var sources = mdm.getSources();

  var range = new TimeRange(extent[0], extent[1]);
  if (sources) {
    for (var i = 0, n = sources.length; i < n; i++) {
      if (sources[i] instanceof VectorSource && sources[i].getTimeEnabled()) {
        var source = /** @type {VectorSource} */ (sources[i]);

        // do not include timeless data. it doesn't appear on the timeline, but include holds
        var features = source.getTimeModel().intersection(range, false, true);

        switch (event.type) {
          case TimelineActionEventType.SELECT:
            source.addToSelected(features);
            Metrics.getInstance().updateMetric(TimelineKeys.RANGE_SELECT, 1);
            break;
          case TimelineActionEventType.SELECT_EXCLUSIVE:
            source.setSelectedItems(features);
            Metrics.getInstance().updateMetric(TimelineKeys.RANGE_SELECTEX, 1);
            break;
          case TimelineActionEventType.DESELECT:
            source.removeFromSelected(features);
            Metrics.getInstance().updateMetric(TimelineKeys.RANGE_DESELECT, 1);
            break;
          case TimelineActionEventType.REMOVE:
            if (features && features.length) {
              source.removeFeatures(/** @type {!Array.<!ol.Feature>} */ (features));
            }
            Metrics.getInstance().updateMetric(TimelineKeys.REMOVE, 1);
            break;
          default:
            break;
        }
      }
    }
  }
};

/**
 * Listener for actions that happen on all features at once
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onFeatureCollection = function(event) {
  var extent = event.getContext();
  assert(extent);

  var mdm = DataManager.getInstance();
  var sources = mdm.getSources();
  var range = new TimeRange(extent[0], extent[1]);
  var features = [];
  if (sources) {
    for (var i = 0, n = sources.length; i < n; i++) {
      if (sources[i] instanceof VectorSource && sources[i].getTimeEnabled()) {
        var source = /** @type {VectorSource} */ (sources[i]);
        // do not include timeless data. it doesn't appear on the timeline, but include holds
        features = features.concat(source.getTimeModel().intersection(range, false, true));
      }
    }
  }
  if (features.length > 0) {
    switch (event.type) {
      case TimelineActionEventType.FEATURE_INFO:
        launchMultiFeatureInfo(features);
        Metrics.getInstance().updateMetric(TimelineKeys.FEATURE_INFO, 1);
        break;
      case TimelineActionEventType.GO_TO:
        flyTo(features);
        Metrics.getInstance().updateMetric(TimelineKeys.GO_TO, 1);
        break;
      default:
        break;
    }
  }
};

/**
 * Time load listener
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onTimeLoad = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  tlc.setRange(Range.fromPair(extent));
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_LOAD, 1);
};

/**
 * Time add listener
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onTimeAdd = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  tlc.addLoadRange(Range.fromPair(extent));
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_ADD, 1);
};

/**
 * Time add listener
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onTimeSlice = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  tlc.addSliceRange(Range.fromPair(extent));
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_SLICE, 1);
};

/**
 * Time zoom listener
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onTimeZoom = function(event) {
  var ctl = /** @type {TimelineUI.Controller} */ (
    angular.element('.js-timeline').children().scope()['timeline']);
  ctl.zoomToItem('select');
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_ZOOM, 1);
};

/**
 * Adds a hold timeline range.
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onAddHold = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  tlc.addHoldRange(Range.fromPair(extent));
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_HOLD, 1);
};

/**
 * Adds a animation timeline range.
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onAddAnimate = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  tlc.addAnimateRange(Range.fromPair(extent));
  tlc.play();
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_ANIMATE, 1);
};

/**
 * Removes a timeline animation range.
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onAddSkipAnimate = function(event) {
  var tlc = TimelineController.getInstance();
  var extent = event.getContext();
  assert(extent);
  var range = Range.fromPair(extent);
  if (!tlc.hasAnimationRanges()) {
    tlc.setAnimateRanges(tlc.getEffectiveLoadRangeSet()); // start with load ranges
  }
  tlc.removeAnimateRange(range);
  tlc.removeHoldRange(range);
  tlc.play();
  Metrics.getInstance().updateMetric(TimelineKeys.RANGE_SKIP, 1);
};

/**
 * Active window set listener.
 *
 * @param {MenuEvent<Array<number>>} event The menu event
 */
const onActiveWindow = function(event) {
  var ctl = /** @type {TimelineUI.Controller} */ (
    angular.element('.js-timeline').children().scope()['timeline']);
  var window = ctl.getItem('window');
  var extent = event.getContext();
  assert(extent);
  window.setExtent(extent);
};

exports = {
  MENU,
  setup,
  dispose,
  onTimeSelect,
  onFeatureCollection,
  onTimeLoad,
  onTimeAdd,
  onTimeSlice,
  onTimeZoom,
  onAddHold,
  onAddAnimate,
  onAddSkipAnimate,
  onActiveWindow
};
