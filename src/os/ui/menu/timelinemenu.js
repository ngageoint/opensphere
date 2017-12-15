goog.provide('os.ui.menu.timeline');

goog.require('os.action.EventType');
goog.require('os.metrics.keys');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineActionEventType');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');

/**
 * @type {os.ui.menu.Menu<Array<number>>}
 */
os.ui.menu.TIMELINE = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
  type: os.ui.menu.MenuItemType.ROOT,
  children: [{
    label: 'Load',
    eventType: os.time.TimelineActionEventType.LOAD,
    tooltip: 'Queries this time range, replaces other load ranges',
    icons: ['<i class="fa fa-fw fa-cloud-download yellow-icon"></i>'],
    sort: 10
  }, {
    label: 'Add',
    eventType: os.time.TimelineActionEventType.ADD,
    tooltip: 'Adds this time range to the loaded ranges',
    icons: ['<i class="fa fa-fw fa-plus yellow-icon"></i>'],
    sort: 20
  }, {
    label: 'Create Slice',
    eventType: os.time.TimelineActionEventType.SLICE,
    tooltip: 'Adds time slice which creates a time range less than 24 hours to show data from each loaded day',
    icons: ['<i class="fa fa-fw fa-hand-scissors-o orange-icon"></i>'],
    sort: 30
  }, {
    label: 'View',
    eventType: os.time.TimelineActionEventType.ACTIVE_WINDOW,
    tooltip: 'Sets the active view window to this range',
    icons: ['<i class="fa fa-fw view-icon"></i>'],
    sort: 40
  }, {
    label: 'Animate',
    eventType: os.time.TimelineActionEventType.ANIMATE,
    tooltip: 'Animates this time range',
    icons: ['<i class="fa fa-fw play-icon"></i>'],
    sort: 50
  }, {
    label: 'Skip Animate',
    eventType: os.time.TimelineActionEventType.ANIMATE_SKIP,
    tooltip: 'Skip animating this time range',
    icons: ['<i class="fa fa-fw fa-ban red-icon"></i>'],
    sort: 60
  }, {
    label: 'Hold Range',
    eventType: os.time.TimelineActionEventType.ANIMATE_HOLD,
    tooltip: 'Always show this time range',
    icons: ['<i class="fa fa-fw fa-hand-rock-o"></i>'],
    sort: 70
  }, {
    label: 'Zoom',
    eventType: os.time.TimelineActionEventType.ZOOM,
    tooltip: 'Zooms to this time range',
    icons: ['<i class="fa fa-fw fa-crop"></i>'],
    sort: 80
  }, {
    label: 'Select',
    eventType: os.time.TimelineActionEventType.SELECT,
    tooltip: 'Selects features in this time range',
    icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
    sort: 90
  }, {
    label: 'Select Exclusive',
    eventType: os.time.TimelineActionEventType.SELECT_EXCLUSIVE,
    tooltip: 'Selects only features in this time range, deselecting all other features',
    icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
    sort: 100
  }, {
    label: 'Deselect',
    eventType: os.time.TimelineActionEventType.DESELECT,
    tooltip: 'Deselects the features in this time range',
    icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
    sort: 110
  }, {
    label: 'Remove',
    eventType: os.time.TimelineActionEventType.REMOVE,
    tooltip: 'Removes the features in this time range',
    icons: ['<i class="fa fa-fw fa-times"></i>'],
    sort: 120
  }]
}));


/**
 * Timeline menu setup
 */
os.ui.menu.timeline.setup = function() {
  var menu = os.ui.menu.TIMELINE;

  menu.listen(os.time.TimelineActionEventType.SELECT, os.ui.menu.timeline.onTimeSelect);
  menu.listen(os.time.TimelineActionEventType.SELECT_EXCLUSIVE, os.ui.menu.timeline.onTimeSelect);
  menu.listen(os.time.TimelineActionEventType.DESELECT, os.ui.menu.timeline.onTimeSelect);
  menu.listen(os.time.TimelineActionEventType.LOAD, os.ui.menu.timeline.onTimeLoad);
  menu.listen(os.time.TimelineActionEventType.ADD, os.ui.menu.timeline.onTimeAdd);
  menu.listen(os.time.TimelineActionEventType.SLICE, os.ui.menu.timeline.onTimeSlice);
  menu.listen(os.time.TimelineActionEventType.ZOOM, os.ui.menu.timeline.onTimeZoom);
  menu.listen(os.time.TimelineActionEventType.ANIMATE, os.ui.menu.timeline.onAddAnimate);
  menu.listen(os.time.TimelineActionEventType.ANIMATE_SKIP, os.ui.menu.timeline.onAddSkipAnimate);
  menu.listen(os.time.TimelineActionEventType.ANIMATE_HOLD, os.ui.menu.timeline.onAddHold);
  menu.listen(os.time.TimelineActionEventType.REMOVE, os.ui.menu.timeline.onTimeSelect);
  menu.listen(os.time.TimelineActionEventType.ACTIVE_WINDOW, os.ui.menu.timeline.onActiveWindow);
};


/**
 * Clean up menu
 */
os.ui.menu.timeline.dispose = function() {
  if (os.ui.menu.TIMELINE) {
    os.ui.menu.TIMELINE.dispose();
  }
};


/**
 * Time select listener
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onTimeSelect = function(event) {
  var extent = event.getContext();
  goog.asserts.assert(extent);

  var mdm = os.dataManager;
  var sources = mdm.getSources();

  var range = new os.time.TimeRange(extent[0], extent[1]);
  if (sources) {
    for (var i = 0, n = sources.length; i < n; i++) {
      if (sources[i] instanceof os.source.Vector && sources[i].getTimeEnabled()) {
        /** @type {os.source.Vector} */
        var source = /** @type {os.source.Vector} */ (sources[i]);

        // do not include timeless data. it doesn't appear on the timeline, but include holds
        var features = source.getTimeModel().intersection(range, false, true);

        switch (event.type) {
          case os.time.TimelineActionEventType.SELECT:
            source.addToSelected(features);
            os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_SELECT, 1);
            break;
          case os.time.TimelineActionEventType.SELECT_EXCLUSIVE:
            source.setSelectedItems(features);
            os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_SELECTEX, 1);
            break;
          case os.time.TimelineActionEventType.DESELECT:
            source.removeFromSelected(features);
            os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_DESELECT, 1);
            break;
          case os.time.TimelineActionEventType.REMOVE:
            if (features) {
              source.removeFeatures(/** @type {!Array.<!ol.Feature>} */ (features));
            }
            break;
          default:
            break;
        }
      }
    }
  }
};


/**
 * Time load listener
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onTimeLoad = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  tlc.setRange(goog.math.Range.fromPair(extent));
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_LOAD, 1);
};


/**
 * Time add listener
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onTimeAdd = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  tlc.addLoadRange(goog.math.Range.fromPair(extent));
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_ADD, 1);
};


/**
 * Time add listener
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onTimeSlice = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  tlc.addSliceRange(goog.math.Range.fromPair(extent));
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_SLICE, 1);
};


/**
 * Time zoom listener
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onTimeZoom = function(event) {
  var ctl = /** @type {os.ui.timeline.TimelineCtrl} */ (angular.element('.os-timeline').children().scope()['timeline']);
  ctl.zoomToItem('select');
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_ZOOM, 1);
};


/**
 * Adds a hold timeline range.
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onAddHold = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  tlc.addHoldRange(goog.math.Range.fromPair(extent));
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_HOLD, 1);
};


/**
 * Adds a animation timeline range.
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onAddAnimate = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  tlc.addAnimateRange(goog.math.Range.fromPair(extent));
  tlc.play();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_ANIMATE, 1);
};


/**
 * Removes a timeline animation range.
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onAddSkipAnimate = function(event) {
  var tlc = os.time.TimelineController.getInstance();
  var extent = event.getContext();
  goog.asserts.assert(extent);
  var range = goog.math.Range.fromPair(extent);
  if (!tlc.hasAnimationRanges()) {
    tlc.setAnimateRanges(tlc.getEffectiveLoadRangeSet()); // start with load ranges
  }
  tlc.removeAnimateRange(range);
  tlc.removeHoldRange(range);
  tlc.play();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RANGE_SKIP, 1);
};


/**
 * Active window set listener.
 * @param {os.ui.menu.MenuEvent<Array<number>>} event The menu event
 */
os.ui.menu.timeline.onActiveWindow = function(event) {
  var ctl = /** @type {os.ui.timeline.TimelineCtrl} */ (angular.element('.os-timeline').children().scope()['timeline']);
  var window = ctl.getItem('window');
  var extent = event.getContext();
  goog.asserts.assert(extent);
  window.setExtent(extent);
};

