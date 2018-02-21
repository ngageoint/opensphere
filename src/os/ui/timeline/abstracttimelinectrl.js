goog.provide('os.ui.timeline.AbstractTimelineCtrl');

goog.require('goog.async.Delay');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.math.Range');
goog.require('os.config.Settings');
goog.require('os.hist.HistogramData');
goog.require('os.metrics');
goog.require('os.metrics.Metrics');
goog.require('os.time');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');
goog.require('os.time.timeline');
goog.require('os.ui.hist');
goog.require('os.ui.hist.IHistogramManager');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.sliderDirective');
goog.require('os.ui.timeline.Brush');
goog.require('os.ui.timeline.Brush.EventType');
goog.require('os.ui.timeline.ITimelineItem');
goog.require('os.ui.timeline.SelectBrush');
goog.require('os.ui.timeline.TileAxis');
goog.require('os.ui.timeline.TimelineCtrl');
goog.require('os.ui.timeline.TimelineScaleOptions');
goog.require('os.ui.timeline.timelineDirective');
goog.require('os.ui.window');



/**
 * Controller function for the timeline-panel directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.timeline.AbstractTimelineCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;
  this.scope['collapsed'] = os.ui.timeline.AbstractTimelineCtrl.collapsed;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.$timeout}
   * @protected
   */
  this.timeout = $timeout;

  /**
   * Child classes override this
   * @type {?os.ui.hist.IHistogramManager}
   * @protected
   */
  this.histManager = null;

  /**
   * @type {!Array.<string>}
   * @private
   */
  this.histClasses_ = goog.object.getKeys(os.ui.hist.CHART_TYPES);

  /**
   * @type {?os.time.TimelineController}
   * @protected
   */
  this.tlc = os.time.TimelineController.getInstance();

  /**
   * @type {?Object.<string, *>}
   * @private
   */
  this.tlcState_ = null;

  /**
   * @type {number}
   * @private
   */
  this.lastStart_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.lastEnd_ = 0;

  /**
   * @type {?os.ui.timeline.TimelineScaleOptions}
   * @protected
   */
  this.lastScaleOptions = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.moveWindowOnHistUpdate = false;

  /**
   * @type {Array.<Function>}
   * @private
   */
  this.destroyers_ = [];

  /**
   * True if this has assumed control.
   * @type {boolean}
   * @protected
   */
  this.hasControl = false;

  /**
   * @type {number}
   */
  this['fps'] = 0;

  /**
   * @type {number}
   */
  this['fpsx'] = 0;
  this.initFps_();

  /**
   * @type {?function(new: os.ui.hist.IHistogramChart, !Element)}
   */
  this['histClass'] = null;

  /**
   * @type {?Array.<!os.hist.HistogramData>}
   */
  this['histData'] = null;

  /**
   * @type {boolean}
   */
  this['playing'] = this.tlc.isPlaying();

  /**
   * @type {os.time.TimeRange}
   */
  this['timeRange'] = null;

  // initialize the chart type
  var histClass = /** @type {string} */
      (os.settings.get(['ui', 'timelineSettings', 'chartType'], 'line'));
  var histClassIdx = this.histClasses_.indexOf(histClass);
  if (histClassIdx > -1) {
    goog.array.rotate(this.histClasses_, histClassIdx);
    this['histClass'] = os.ui.hist.CHART_TYPES[this.histClasses_[0]];
  }

  /**
   * @type {os.ui.timeline.Brush}
   */
  this.windowBrush = new os.ui.timeline.Brush();
  this.windowBrush.setClamp(false);
  this.windowBrush.setToolTip('The currently-displayed time window');
  this.windowBrush.drawFlagCheck = os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck;

  /**
   * @type {os.ui.timeline.SelectBrush}
   */
  this.selectBrush = new os.ui.timeline.SelectBrush();
  this.selectBrush.setId('select');
  this.selectBrush.setMenuContainer('#map-container');
  this.selectBrush.listen(goog.events.EventType.EXIT, this.onSelectChange, false, this);
  this.selectBrush.listen(goog.events.EventType.DRAGSTART, this.onSelectChange, false, this);

  /**
   * @type {os.ui.timeline.TileAxis}
   */
  var tileAxis = new os.ui.timeline.TileAxis();

  /**
   * @type {?Array.<!os.ui.timeline.ITimelineItem>}
   */
  this['items'] = [tileAxis, this.windowBrush, this.selectBrush];


  /**
   * @type {?Array.<!os.ui.timeline.ITimelineItem>}
   */
  this['sliceBrushes'] = [];

  /**
   * @type {?Array.<!os.ui.timeline.ITimelineItem>}
   */
  this['loadBrushes'] = [];

  /**
   * @type {?Array.<!os.ui.timeline.ITimelineItem>}
   */
  this['animationBrushes'] = [];

  /**
   * @type {?Array.<!os.ui.timeline.ITimelineItem>}
   */
  this['holdBrushes'] = [];

  /**
   * @type {boolean}
   * @protected
   */
  this.inEvent = false;

  /**
   * @type {os.ui.menu.Menu|undefined}
   * @protected
   */
  this.loadMenu = undefined;

  /**
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(this.element[0]);
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.onKey, false, this);

  /**
   * @type {os.ui.menu.Menu|undefined}
   * @protected
   */
  this.zoomMenu = undefined;

  // force the animation/hold ragne state to be updated
  this.onAnimationRangeChanged_(null);
  this.onHoldRangeChanged_(null);

  this.initMenus();

  /**
   * @type {Object<string, os.ui.menu.Menu>}
   * @private
   */
  this.menus_ = {
    '.load-presets': this.loadMenu,
    '.zoom-group': this.zoomMenu
  };

  /**
   * Flag used to defer brush updates until after a rescale, to avoid incorrect sizing.
   * @type {boolean}
   */
  this.updateBrushesOnScale = false;

  this.assumeControl();
  this.updateTimeline(true);

  this.scope.$on('timeline.item.load', this.onLoad.bind(this));
  this.scope.$on('timeline.item.window', this.onWindow.bind(this));
  this.scope.$on('timeline.Scale', this.onScaleEvent.bind(this));

  this.destroyers_.push(this.scope.$watch('timelineCtrl.fpsx', this.onFpsChange_.bind(this)));
  this.scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * @type {Array<number>}
 * @const
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.FPS_VALUES_ = [0.5, 1, 2, 4, 6, 8, 18, 24, 30];


/**
 * @type {boolean}
 */
os.ui.timeline.AbstractTimelineCtrl.collapsed = false;


/**
 * @return {boolean} Whether or not to draw "flags" on brushes
 */
os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck = function() {
  return !os.ui.timeline.AbstractTimelineCtrl.collapsed;
};


/**
 * Clear references to Angular/DOM elements.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.destroy = function() {
  this.releaseControl();
  this.keyHandler_.dispose();

  for (var i = 0, n = this.destroyers_.length; i < n; i++) {
    this.destroyers_[i]();
  }

  var selectBrush = /** @type {os.ui.timeline.SelectBrush} */ (this.getItem('select'));
  selectBrush.unlisten(goog.events.EventType.EXIT, this.onSelectChange, false, this);
  selectBrush.unlisten(goog.events.EventType.DRAGSTART, this.onSelectChange, false, this);

  var items = /** @type {!Array<os.ui.timeline.ITimelineItem>} */ (this['items']);
  for (i = 0, n = items.length; i < n; i++) {
    items[i].dispose();
  }

  goog.dispose(this.loadMenu);
  goog.dispose(this.zoomMenu);
  this.loadMenu = undefined;
  this.zoomMenu = undefined;

  this.tlc = null;
  this.lastScaleOptions = null;

  this.scope = null;
  this.element = null;
  this.timeout = null;
};


/**
 * Handle timeline window change
 * @param {angular.Scope.Event | null} event
 * @param {Array.<number>} range
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onWindow = function(event, range) {
  if (!this.inEvent && range && range.length === 2) {
    this.inEvent = true;
    var diff = range[1] - range[0];

    // only change skip if the size actually changed
    if (diff != this.tlc.getOffset()) {
      this.tlc.setOffset(diff);
      this.tlc.setSkip(diff / 2);
    }

    this.tlc.setCurrent(range[1]);
    this.inEvent = false;
  }
};


/**
 * Handle timeline load range change
 * @param {angular.Scope.Event | null} event
 * @param {Array.<number>} range
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onLoad = function(event, range) {
  if (!this.inEvent && range && range.length === 2) {
    this.inEvent = true;
    this.tlc.setRange(this.tlc.buildRange(range[0], range[1]));
    this.inEvent = false;
  }
};


/**
 * Handle timeline load range change
 * @param {angular.Scope.Event | null} event
 * @param {Array.<number>} range
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onLoop = function(event, range) {
  if (!this.inEvent && range && range.length === 2) {
    this.inEvent = true;

    // TODO: Handle this.
    // this.tlc.setLoopStart(range[0]);
    // this.tlc.setLoopEnd(range[1]);

    this.inEvent = false;
  }
};


/**
 * @type {Array<{diff: number, format: string}>}
 * @const
 */
os.ui.timeline.AbstractTimelineCtrl.LABEL_FORMATS = [{
  diff: 0,
  format: '.SSS'
}, {
  diff: 60 * 1000,
  format: ':ss'
}, {
  diff: 60 * 60 * 1000,
  format: ' HH:mm'
}, {
  diff: 4 * 24 * 60 * 60 * 1000,
  format: 'YYYY MMM D'
}];


/**
 * Handle timeline scale change event.
 * @param {angular.Scope.Event} event
 * @param {os.ui.timeline.TimelineScaleOptions} scaleOptions Options for the timeline scale.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onScaleEvent = function(event, scaleOptions) {
  this.lastScaleOptions = scaleOptions;

  var formats = os.ui.timeline.AbstractTimelineCtrl.LABEL_FORMATS;
  var i = formats.length;
  var format = '';
  var diff = scaleOptions['end'] - scaleOptions['start'];

  while (i--) {
    format += formats[i].format;

    if (diff > formats[i].diff) {
      break;
    }
  }

  var s = new Date(scaleOptions['start'] + os.time.timeOffset);
  var e = new Date(scaleOptions['end'] + os.time.timeOffset);

  format += ' ';

  this.scope['start'] = os.time.momentFormat(s, format, true) + os.time.timeOffsetLabel;
  this.scope['end'] = os.time.momentFormat(e, format, true) + os.time.timeOffsetLabel;

  this.updateHistograms_();

  if (this.updateBrushesOnScale) {
    this.updateBrushes();
    this.updateBrushesOnScale = false;
  }
};


/**
 * Handle fps changes.
 * @param {number=} opt_new
 * @param {number=} opt_old
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onFpsChange_ = function(opt_new, opt_old) {
  if (opt_new != null && opt_new !== opt_old) {
    var value = os.ui.timeline.AbstractTimelineCtrl.FPS_VALUES_[opt_new];
    this['fps'] = value;
    this.setTimelineFps(value);

    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.FPS, 1);
  }
};


/**
 * Initialize the framerate from the timeline controller.
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.initFps_ = function() {
  if (this.tlc) {
    var fps = this.tlc.getFps();
    if (this['fps'] != fps) {
      // find the first slider value that doesn't exceed the controller value. stop iteration at the last value and use
      // it if the value is larger than allowed.
      var values = os.ui.timeline.AbstractTimelineCtrl.FPS_VALUES_;
      var x = 0;
      for (; x < values.length - 1; x++) {
        if (values[x] >= fps) {
          break;
        }
      }

      this['fps'] = values[x];
      this['fpsx'] = x;

      if (this['fps'] != fps) {
        // controller value isn't one of our options, so update the controller.
        this.setTimelineFps(this['fps']);
      }
    }
  }
};


/**
 * Sets the framerate on the timeline controller.
 * @param {number} value The desired framerate
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.setTimelineFps = function(value) {
  // stop listening so we don't loop ourselves
  this.tlc.unlisten(os.time.TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
  this.tlc.setFps(value);
  this.tlc.listen(os.time.TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
};


/**
 * Handle histogram change event.
 * @param {goog.events.Event} event
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onHistogramChange = function(event) {
  this.updateHistograms_();
};


/**
 * Update timeline histograms.
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.updateHistograms_ = function() {
  if (this.lastScaleOptions) { // draw scale even when histograms not presented
    var histograms = os.ui.timeline.AbstractTimelineCtrl.collapsed ?
        [] : this.histManager.getHistograms(this.lastScaleOptions);
    this['histData'] = histograms;
    if (this.moveWindowOnHistUpdate) {
      this.moveWindowToData();
    }
    os.ui.apply(this.scope);
  }
};


/**
 * Get the tooltip for histogram bins.
 * @param {os.hist.HistogramData} histogram
 * @param {Object.<string, *>} item
 * @return {string}
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getHistogramTooltip = function(histogram, item) {
  var tooltip = '';
  if (histogram && histogram.getTitle()) {
    tooltip += histogram.getTitle() + '<br>';
  }
  tooltip += 'Features: <span style="color:red">' + item['value'] + '</span>';
  return tooltip;
};
goog.exportProperty(os.ui.timeline.AbstractTimelineCtrl.prototype, 'getHistogramTooltip',
    os.ui.timeline.AbstractTimelineCtrl.prototype.getHistogramTooltip);


/**
 * Ensures that brushes match the current timeline state.
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.ensureBrushState_ = function() {
  // Make sure we have the brush has  the current range, as its possiable
  // for the range to be changed after the control is created.
  this.onSliceRangeChanged_(null);
  this.onLoadRangeChanged_(null);
  this.onAnimationRangeChanged_(null);
  this.onHoldRangeChanged_(null);
};


/**
 * Take control of the timeline controller.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.assumeControl = function() {
  if (!this.hasControl) {
    this.hasControl = true;
    // register timeline controller listeners
    this.tlc.listen(os.time.TimelineEventType.SHOW, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.RESET, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.PLAY, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.STOP, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.SLICE_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.HOLD_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.listen(os.time.TimelineEventType.REFRESH_LOAD, this.refreshLoadBrushes_, false, this);
    // configure the timeline controller and save the current state for resets
    os.time.timeline.autoConfigureFromTimeRange(this.tlc);

    this.ensureBrushState_();

    this.moveWindowToData();
    this.savestate();
  }
};


/**
 * Release control of the timeline controller and return it back to the date control.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.releaseControl = function() {
  // unregister timeline controller listeners
  if (this.hasControl) {
    this.hasControl = false;
    this.tlc.unlisten(os.time.TimelineEventType.SHOW, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.RESET, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.PLAY, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.STOP, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.SLICE_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.HOLD_RANGE_CHANGED, this.onTimelineEvent, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.REFRESH_LOAD, this.refreshLoadBrushes_, false, this);
  }
};


/**
 * Saves the current state of the timeline controller.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.savestate = function() {
  this.tlcState_ = this.tlc.persist();
};


/**
 * Handle events from the timeline controller.
 * @param {os.time.TimelineControllerEvent} event The event
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onTimelineEvent = function(event) {
  this.updateTimeline();

  if (event.type === os.time.TimelineEventType.ANIMATE_RANGE_CHANGED) {
    this.onAnimationRangeChanged_(null);
  }

  if (event.type === os.time.TimelineEventType.HOLD_RANGE_CHANGED) {
    this.onHoldRangeChanged_(null);
  }

  if (event.type === os.time.TimelineEventType.SLICE_RANGE_CHANGED) {
    this.onSliceRangeChanged_(null);
  }

  if (event.type === os.time.TimelineEventType.RANGE_CHANGED) {
    this.onLoadRangeChanged_(null);
  }

  if (event.type === os.time.TimelineEventType.HOLD_RANGE_CHANGED ||
      event.type === os.time.TimelineEventType.SLICE_RANGE_CHANGED ||
      event.type === os.time.TimelineEventType.RANGE_CHANGED) {
    this.updateHistograms_();
  }

  os.ui.apply(this.scope);

  if (event.type == os.time.TimelineEventType.PLAY) {
    this.durationStart_ = goog.now();
  } else if (event.type == os.time.TimelineEventType.STOP) {
    if (this.durationStart_ > 0) {
      var metrics = os.metrics.Metrics.getInstance();
      if (metrics.isEnabled()) { // track play duration here because play/pause can be controlled via a number of means
        var duration = goog.now() - this.durationStart_;
        metrics.updateMetric(os.metrics.keys.Timeline.MAX_PLAY, duration);
        metrics.updateMetric(os.metrics.keys.Timeline.MIN_PLAY, duration);
      }
    }
    this.durationStart_ = 0;
  }
};


/**
 * Updates the timeline UI state.
 * @param {boolean=} opt_force Force a full update
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.updateTimeline = function(opt_force) {
  if (!this.inEvent) {
    this.inEvent = true;

    // update fps/play control state
    this.initFps_();
    this['playing'] = this.tlc.isPlaying();

    if (opt_force) {
      this.lastStart_ = 0;
      this.lastEnd_ = 0;
    }

    if (opt_force || !this.tlc.isPlaying()) {
      // only change the displayed range if the timeline start/end changed
      if (this.lastStart_ === 0 || this.lastEnd_ === 0) {
        this.lastStart_ = this.tlc.getStart();
        this.lastEnd_ = this.tlc.getEnd();
        var buffer = (this.lastEnd_ - this.lastStart_) * 0.05;
        this['timeRange'] = new os.time.TimeRange(this.lastStart_ - buffer, this.lastEnd_ + buffer);

        // wait until rescale to update brushes or they won't be sized correctly
        this.updateBrushesOnScale = true;
      }
    }

    if (!this.updateBrushesOnScale) {
      this.updateBrushes();
    }

    this.inEvent = false;
  }
};


/**
 * Updates brushes from the timeline controller.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.updateBrushes = function() {
  // set window
  var brush = /** @type {os.ui.timeline.Brush} */ (this.getItem('window'));
  if (brush) {
    brush.setExtent([this.tlc.getCurrent() - this.tlc.getOffset(), this.tlc.getCurrent()], true);
  }

  // set loop
  brush = /** @type {os.ui.timeline.Brush} */ (this.getItem('loop'));
  if (brush && !this.tlc.hasAnimationRanges()) {
    brush.setExtent([this.tlc.getLoopStart(), this.tlc.getLoopEnd()], true);
  }
};


/**
 * Gets a timeline item by ID
 * @param {string} id The ID
 * @return {?os.ui.timeline.ITimelineItem} The item or null if it could not be found
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getItem = function(id) {
  var list = /** @type {!Array.<os.ui.timeline.ITimelineItem>} */ (this['items']);

  for (var i = 0, n = list.length; i < n; i++) {
    if (list[i].getId() == id) {
      return list[i];
    }
  }

  return null;
};


/**
 * Skip to the first frame.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.firstFrame = function() {
  this.tlc.first();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.FIRST_FRAME, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'firstFrame',
    os.ui.timeline.AbstractTimelineCtrl.prototype.firstFrame);


/**
 * Skip to the last frame.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.lastFrame = function() {
  this.tlc.last();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.LAST_FRAME, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'lastFrame',
    os.ui.timeline.AbstractTimelineCtrl.prototype.lastFrame);


/**
 * Step ahead one frame.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.nextFrame = function() {
  this.tlc.next();
  this.tlc.clamp();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.NEXT_FRAME, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'nextFrame',
    os.ui.timeline.AbstractTimelineCtrl.prototype.nextFrame);


/**
 * Step back one frame.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.previousFrame = function() {
  this.tlc.prev();
  this.tlc.clamp();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.PREV_FRAME, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'previousFrame',
    os.ui.timeline.AbstractTimelineCtrl.prototype.previousFrame);


/**
 * Resets the timeline controller back to the last saved state.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.reset = function() {
  if (this.tlcState_) {
    this.tlc.restore(this.tlcState_);
    this.updateTimeline(true);
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.RESET, 1);
    var refreshTimer = new goog.async.Delay(this.refreshLoadBrushes_, 10, this);
    refreshTimer.start();
  }
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'reset',
    os.ui.timeline.AbstractTimelineCtrl.prototype.reset);


/**
 * Start/stop timeline animation.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.togglePlay = function() {
  this['playing'] = !this['playing'];

  if (this['playing']) {
    this.tlc.play();
  } else {
    this.tlc.stop();
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.TOGGLE_PLAY, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'togglePlay',
    os.ui.timeline.AbstractTimelineCtrl.prototype.togglePlay);


/**
 * Zoom in
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.zoomIn = function() {
  this.getTimelineCtrl().zoomIn();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.ZOOM_IN, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'zoomIn',
    os.ui.timeline.AbstractTimelineCtrl.prototype.zoomIn);


/**
 * Zoom out
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.zoomOut = function() {
  this.getTimelineCtrl().zoomOut();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.ZOOM_OUT, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'zoomOut',
    os.ui.timeline.AbstractTimelineCtrl.prototype.zoomOut);


/**
 * @return {os.ui.timeline.TimelineCtrl} The timeline controller
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getTimelineCtrl = goog.abstractMethod;


/**
 * Start/stop timeline animation.
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.toggleChartType = function() {
  goog.array.rotate(this.histClasses_, 1);

  var chartType = this.histClasses_[0];
  this['histClass'] = os.ui.hist.CHART_TYPES[chartType];
  os.settings.set(['ui', 'timelineSettings', 'chartType'], chartType);

  var metricKey = os.metrics.keys.Timeline.CHART_TYPE + os.metrics.SUB_DELIMITER + chartType;
  os.metrics.Metrics.getInstance().updateMetric(metricKey, 1);
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'toggleChartType',
    os.ui.timeline.AbstractTimelineCtrl.prototype.toggleChartType);


/**
 * @param {string} selector
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.openMenu = function(selector) {
  var menu = this.menus_[selector];
  if (menu) {
    // clear the previous data actions
    var dataGroup = menu.getRoot().find('Data');
    goog.asserts.assert(!!dataGroup, 'Group "Data" should exist!');
    dataGroup.children.length = menu === this.zoomMenu ? 1 : 0;

    // add data actions
    var histData = /** @type {?Array<!os.hist.HistogramData>} */ (this['histData']);
    if (histData) {
      var prefix = menu === this.loadMenu ? 'load:' : 'zoom:';
      var tip = menu === this.loadMenu ? 'Zooms to and loads ' : 'Zooms to ';
      var sort = 100;

      for (var i = 0; i < histData.length; i++) {
        var hd = histData[i];
        var range = hd.getRange();
        var label = hd.getTitle();

        if (hd.getVisible() && os.ui.timeline.AbstractTimelineCtrl.isSafeRange(range)) {
          dataGroup.addChild({
            eventType: prefix + hd.getId(),
            label: label,
            tooltip: tip + label,
            icons: ['<i class="fa fa-fw fa-bars"></i>'],
            sort: sort++,
            handler: this.onMenuEvent.bind(this)
          });
        }
      }
    }

    this.scope['menu'] = selector;

    os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);

    menu.open(undefined, {
      my: 'left bottom',
      at: 'left top',
      of: selector
    });
  }
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'openMenu',
    os.ui.timeline.AbstractTimelineCtrl.prototype.openMenu);


/**
 * @param {goog.events.Event} evt
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onMenuClose = function(evt) {
  this.scope['menu'] = null;
};


/**
 * Begins selection on the timeline
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.select = function() {
  this.scope['selecting'] = !this.scope['selecting'];
  angular.element('.brush-select .background').css('display', this.scope['selecting'] ? 'block' : 'none');
};
goog.exportProperty(
    os.ui.timeline.AbstractTimelineCtrl.prototype,
    'select',
    os.ui.timeline.AbstractTimelineCtrl.prototype.select);


/**
 * Handles select brush active/inactive
 * @param {goog.events.Event} e
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onSelectChange = function(e) {
  this.scope['selecting'] = e.type == goog.events.EventType.DRAGSTART;
  os.ui.apply(this.scope);
};


/**
 * Handles removing a disposed animation brush
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.animateBrushDeleted_ = function(e) {
  var brush = /** @type {os.ui.timeline.Brush} */ (e.currentTarget);
  this.tlc.removeAnimateRange(brush.getRange());
};


/**
 * Handler for brush property changes.
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.animateBrushPropertyChanged_ = function(e) {
  if (e.getProperty() === 'extent') {
    var newExt = e.getNewValue();
    var oldExt = e.getOldValue();
    this.tlc.updateAnimateRange(new goog.math.Range(newExt[0], newExt[1]), new goog.math.Range(oldExt[0], oldExt[1]));
  }
};


/**
 * Handles removing a disposed slice brush
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.sliceBrushDeleted_ = function(e) {
  var brush = /** @type {os.ui.timeline.Brush} */ (e.currentTarget);
  this.tlc.removeSliceRange(brush.getRange());
};


/**
 * Handler for brush property changes.
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.sliceBrushPropertyChanged_ = function(e) {
  if (e.getProperty() === 'extent') {
    var newEx = e.getNewValue();
    var oldEx = e.getOldValue();
    if (!this.tlc.updateSliceRange(new goog.math.Range(newEx[0], newEx[1]), new goog.math.Range(oldEx[0], oldEx[1]))) {
      e.target.setExtent(oldEx);
    }
  }
};


/**
 * Handles removing a disposed load brush
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.loadBrushDeleted_ = function(e) {
  var brush = /** @type {os.ui.timeline.Brush} */ (e.currentTarget);
  this.tlc.removeLoadRange(brush.getRange());
};


/**
 * Handler for brush property changes.
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.loadBrushPropertyChanged_ = function(e) {
  if (e.getProperty() === 'extent') {
    var newExt = e.getNewValue();
    var oldExt = e.getOldValue();
    this.tlc.updateLoadRange(new goog.math.Range(newExt[0], newExt[1]), new goog.math.Range(oldExt[0], oldExt[1]));
  }
};


/**
 * Creates a timeline slice brush.
 * @param {goog.math.Range} range
 * @return {os.ui.timeline.Brush}
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getSliceBrush = function(range) {
  var brush = new os.ui.timeline.Brush();
  brush.setId('slice-' + goog.string.createUniqueString());
  brush.setSilentDrag(true);
  brush.setEventType(os.ui.timeline.Brush.EventType.BRUSH_END);
  brush.setClass('slice');
  brush.setToolTip('The slice range');
  brush.canDelete = true;
  brush.drawFlagCheck = os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck;
  brush.setExtent([range.start, range.end]);
  brush.listen('deleted', this.sliceBrushDeleted_.bind(this));
  brush.listen(goog.events.EventType.PROPERTYCHANGE, this.sliceBrushPropertyChanged_.bind(this));
  return brush;
};


/**
 * Creates a timeline load brush.
 * @param {goog.math.Range} range
 * @return {os.ui.timeline.Brush}
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getLoadBrush = function(range) {
  var brush = new os.ui.timeline.Brush();
  if (this.tlc.hasSliceRanges()) {
    brush.setId('considered-' + goog.string.createUniqueString());
    brush.setClass('considered');
  } else {
    brush.setId('load-' + goog.string.createUniqueString());
    brush.setClass('load');
  }
  brush.setToolTip('The load range');
  brush.setSilentDrag(true);
  brush.setEventType(os.ui.timeline.Brush.EventType.BRUSH_END);
  brush.canDelete = this.tlc.getLoadRanges().length > 1;
  brush.drawFlagCheck = os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck;
  brush.setExtent([range.start, range.end]);
  brush.listen('deleted', this.loadBrushDeleted_.bind(this));
  brush.listen(goog.events.EventType.PROPERTYCHANGE, this.loadBrushPropertyChanged_.bind(this));
  return brush;
};


/**
 * Creates a timeline animate brush.
 * @param {goog.math.Range} range
 * @return {os.ui.timeline.Brush}
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getAnimateBrush = function(range) {
  var brush = new os.ui.timeline.Brush();
  brush.setId('loop-' + goog.string.createUniqueString());
  brush.setSilentDrag(true);
  brush.setEventType(os.ui.timeline.Brush.EventType.BRUSH_END);
  brush.setToolTip('The playback loop');
  brush.canDelete = true;
  brush.drawFlagCheck = os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck;
  brush.setExtent([range.start, range.end]);
  brush.listen('deleted', this.animateBrushDeleted_.bind(this));
  brush.listen(goog.events.EventType.PROPERTYCHANGE, this.animateBrushPropertyChanged_.bind(this));
  return brush;
};


/**
 * Creates a timeline hold brush.
 * @param {goog.math.Range} range
 * @return {os.ui.timeline.Brush}
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.getHoldBrush = function(range) {
  var brush = new os.ui.timeline.Brush();
  brush.setId('loop-' + goog.string.createUniqueString());
  brush.setSilentDrag(true);
  brush.setEventType(os.ui.timeline.Brush.EventType.BRUSH_END);
  brush.setClass('hold');
  brush.setToolTip('The hold range');
  brush.canDelete = true;
  brush.drawFlagCheck = os.ui.timeline.AbstractTimelineCtrl.drawFlagCheck;
  brush.setExtent([range.start, range.end]);
  brush.listen('deleted', this.holdBrushDeleted_.bind(this));
  brush.listen(goog.events.EventType.PROPERTYCHANGE, this.holdBrushPropertyChanged_.bind(this));
  return brush;
};


/**
 * Adds a slice brush from range
 * @param {goog.math.Range} range
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.addSliceBrush = function(range) {
  // Add a new slice ?
  var current = this['sliceBrushes'];
  var brush = this.getSliceBrush(range);
  current.push(brush);
  this['sliceBrushes'] = current.splice(0);
  this.tlc.addSliceRange(range);
};


/**
 * Adds a load brush from range
 * @param {goog.math.Range} range
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.addLoadBrush = function(range) {
  // Add a new load ?
  var current = this['loadBrushes'];
  var brush = this.getLoadBrush(range);
  current.push(brush);
  this['loadBrushes'] = current.splice(0);
  this.tlc.addLoadRange(range);
};


/**
 * Adds a animation brush from range
 * @param {goog.math.Range} range
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.addAnimateBrush = function(range) {
  // Add a new animate ?
  var current = this['animationBrushes'];
  var brush = this.getAnimateBrush(range);
  current.push(brush);
  this['animationBrushes'] = current.splice(0);
  this.tlc.addAnimateRange(range);
};


/**
 * Adds a hold brush from range
 * @param {goog.math.Range} range
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.addHoldBrush = function(range) {
  // Add a new hold ?
  var current = this['holdBrushes'];
  var brush = this.getHoldBrush(range);
  current.push(brush);
  this['holdBrushes'] = current.splice(0);
  this.tlc.addHoldRange(range);
};


/**
 * Consoldated method for handling timeline brush changes.
 * @param {Array.<!os.ui.timeline.ITimelineItem>} brushCollection
 * @param {Array.<!goog.math.Range>} ranges
 * @param {function(goog.math.Range): os.ui.timeline.Brush} getBrushFunction
 * @return {Array.<!os.ui.timeline.ITimelineItem>} new collection of brushes
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.processTimelineRangeChanged_ = function(brushCollection,
    ranges, getBrushFunction) {
  var brush;
  var range;
  var supressBrushEvents = true;
  var newBrushCollection = [];
  var currentBrushes = brushCollection.splice(0);
  var totalItems = Math.max(ranges.length, currentBrushes.length);

  for (var i = 0; i < totalItems; i++) {
    range = ranges[i];
    brush = currentBrushes[i];
    if (range && brush && !brush.deleted) {
      brush.setRange(range, supressBrushEvents);
      newBrushCollection.push(brush);
    } else if (range) {
      newBrushCollection.push(getBrushFunction(range));
    } else if (!range && brush && !brush.deleted) {
      brush.deleteBrush(supressBrushEvents);
    }
  }

  return newBrushCollection;
};


/**
 * Quietly deletes all of the brushes and reloads them
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.refreshLoadBrushes_ = function() {
  this.refreshBrushSet_(this['loadBrushes'], this.onLoadRangeChanged_.bind(this));
};


/**
 * Quietly deletes all of the brushes and reloads them
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.refreshAllBrushes = function() {
  this.refreshLoadBrushes_();
  this.refreshBrushSet_(this['sliceBrushes'], this.onSliceRangeChanged_.bind(this));
  this.refreshBrushSet_(this['holdBrushes'], this.onHoldRangeChanged_.bind(this));
  this.refreshBrushSet_(this['animationBrushes'], this.onAnimationRangeChanged_.bind(this));
};


/**
 * Quietly deletes all of the brushes and reloads them
 * @param {?Array.<!os.ui.timeline.ITimelineItem>} brushes
 * @param {function(goog.events.Event)} brushChangedCallback
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.refreshBrushSet_ = function(brushes, brushChangedCallback) {
  for (var i = 0; i < brushes.length; i++) {
    brushes[i].deleteBrush(true);
  }
  brushChangedCallback(null);
};


/**
 * Handler for changes to the timeline controllers load range change events
 * which are fired when animation ranges change.
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onSliceRangeChanged_ = function(e) {
  this['sliceBrushes'] = this.processTimelineRangeChanged_(this['sliceBrushes'],
      this.tlc.getEffectiveSliceRanges(), this.getSliceBrush.bind(this));
};


/**
 * Handler for changes to the timeline controllers load range change events
 * which are fired when animation ranges change.
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onLoadRangeChanged_ = function(e) {
  this['loadBrushes'] = this.processTimelineRangeChanged_(this['loadBrushes'],
      this.tlc.getLoadRanges(), this.getLoadBrush.bind(this));
};


/**
 * Handler for changes to the timeline controllers animation range change events
 * which are fired when animation ranges change.
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onAnimationRangeChanged_ = function(e) {
  this['animationBrushes'] = this.processTimelineRangeChanged_(this['animationBrushes'],
      this.tlc.getAnimationRanges(), this.getAnimateBrush.bind(this));
};


/**
 * Handler for changes to the timeline controllers hold range change events
 * which are fired when animation ranges change.
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onHoldRangeChanged_ = function(e) {
  this['holdBrushes'] = this.processTimelineRangeChanged_(this['holdBrushes'],
      this.tlc.getHoldRanges(), this.getHoldBrush.bind(this));
};


/**
 * Handles removing a disposed hold brush
 * @param {goog.events.Event} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.holdBrushDeleted_ = function(e) {
  var brush = /** @type {os.ui.timeline.Brush} */ (e.currentTarget);
  this.tlc.removeHoldRange(brush.getRange());
};


/**
 * Handler for hold brush property changes.
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.holdBrushPropertyChanged_ = function(e) {
  if (e.getProperty() === 'extent') {
    var newExt = e.getNewValue();
    var oldExt = e.getOldValue();
    this.tlc.updateHoldRange(new goog.math.Range(newExt[0], newExt[1]), new goog.math.Range(oldExt[0], oldExt[1]));
  }
};


/**
 * @enum {string}
 */
os.ui.timeline.AbstractTimelineCtrl.Ranges = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THISWEEK: 'This Week',
  LASTWEEK: 'Last Week',
  THISMONTH: 'This Month',
  LAST30: 'Last 30 Days',
  LAST60: 'Last 60 Days',
  LAST90: 'Last 90 Days',
  THISYEAR: 'This Year'
};


/**
 * @param {os.time.TimeRange} range
 * @return {boolean} Whether the range is safe to use for pan/zoom
 */
os.ui.timeline.AbstractTimelineCtrl.isSafeRange = function(range) {
  return !!range && range.getStart() != os.time.TimeInstant.MIN_TIME &&
      range.getEnd() != os.time.TimeInstant.MAX_TIME &&
      !isNaN(range.getStart()) && !isNaN(range.getEnd()) &&
      !(range.getStart() == 0 && range.getEnd() == 0);
};


/**
 * Creates the timeline menus.
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.initMenus = function() {
  if (!this.loadMenu) {
    this.loadMenu = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Load',
        sort: 0
      }, {
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Ranges',
        sort: 10,
        children: [{
          eventType: 'load:item.window',
          label: 'Active Window',
          tooltip: 'Zooms to and loads the active window',
          icons: ['<i class="fa fa-fw fa-square-o"></i>'],
          handler: this.onMenuEvent.bind(this),
          sort: 0
        }]
      }, {
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Data',
        children: [],
        sort: 20
      }]
    }));

    this.initMenu(this.loadMenu, 'load:', 'Load', 'Zooms to and loads ');
  }

  if (!this.zoomMenu) {
    this.zoomMenu = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      children: [{
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Zoom To',
        sort: 0
      }, {
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Ranges',
        sort: 10,
        children: [{
          eventType: 'load:item.load',
          label: 'Loaded Range',
          tooltip: 'Zooms to the loaded range',
          icons: ['<i class="fa fa-fw fa-arrows-h"></i>'],
          handler: this.onMenuEvent.bind(this),
          sort: 0
        }, {
          eventType: 'zoom:item.window',
          label: 'Active Window',
          tooltip: 'Zooms to and loads the active window',
          icons: ['<i class="fa fa-fw fa-square-o"></i>'],
          handler: this.onMenuEvent.bind(this),
          sort: 10
        }]
      }, {
        type: os.ui.menu.MenuItemType.GROUP,
        label: 'Data',
        sort: 20,
        children: [{
          eventType: 'zoom:All Data',
          label: 'All Data',
          tooltip: 'Zooms to all data',
          icons: ['<i class="fa fa-fw fa-crop"></i>'],
          handler: this.onMenuEvent.bind(this),
          sort: 0
        }]
      }]
    }));

    this.initMenu(this.zoomMenu, 'zoom:', 'Zoom To', 'Zooms to ');
  }
};


/**
 * @param {!os.ui.menu.Menu} menu The menu.
 * @param {string} prefix The event type prefix.
 * @param {string} type
 * @param {string} tip
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.initMenu = function(menu, prefix, type, tip) {
  var root = menu.getRoot();
  var group = root.find(type);
  goog.asserts.assert(!!group, 'Timeline menu group "' + type + '" should exist!');

  var ranges = os.ui.timeline.AbstractTimelineCtrl.Ranges;
  var sort = 0;
  for (var key in ranges) {
    var value = ranges[key];
    var eventType = prefix + value;
    var icon = value.indexOf('Data') > -1 ? 'fa-crop' : 'fa-calendar';

    group.addChild({
      eventType: eventType,
      label: value,
      tooltip: tip + value.toLowerCase(),
      icons: ['<i class="fa fa-fw ' + icon + '"></i>'],
      sort: sort++,
      handler: this.onMenuEvent.bind(this)
    });
  }
};


/**
 * Handle menu events.
 * @param {os.ui.menu.MenuEvent} event The menu event.
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onMenuEvent = function(event) {
  var parts = event.type.split(':');
  var type = parts[0];
  var rangeText = parts[1];
  var begin;
  var end;
  var doOffset = true;

  // get a reference to the timeline
  var timeline = angular.element('.svg-timeline').scope()['timeline'];
  var histData = /** @type {?Array<!os.hist.HistogramData>} */ (this['histData']);

  switch (rangeText) {
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.TODAY:
      begin = os.time.floor(new Date(), 'day');
      end = os.time.ceil(new Date(), 'day');
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.YESTERDAY:
      begin = os.time.floor(new Date(), 'day');
      end = os.time.ceil(new Date(), 'day');
      begin.setUTCDate(begin.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.THISWEEK:
      begin = os.time.floor(new Date(), 'week');
      end = os.time.ceil(new Date(), 'week');
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.LASTWEEK:
      begin = os.time.floor(new Date(), 'week');
      end = os.time.ceil(new Date(), 'week');
      begin.setUTCDate(begin.getUTCDate() - 7);
      end.setUTCDate(end.getUTCDate() - 7);
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.THISMONTH:
      begin = os.time.floor(new Date(), 'month');
      end = os.time.ceil(new Date(), 'month');
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.LAST30:
      end = os.time.ceil(new Date(), 'day');
      begin = os.time.offset(end, 'day', -30);
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.LAST60:
      end = os.time.ceil(new Date(), 'day');
      begin = os.time.offset(end, 'day', -60);
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.LAST90:
      end = os.time.ceil(new Date(), 'day');
      begin = os.time.offset(end, 'day', -90);
      break;
    case os.ui.timeline.AbstractTimelineCtrl.Ranges.THISYEAR:
      begin = os.time.floor(new Date(), 'year');
      end = os.time.ceil(new Date(), 'year');
      break;
    case 'All Data':
      if (histData) {
        // all data
        var min = Number.POSITIVE_INFINITY;
        var max = Number.NEGATIVE_INFINITY;

        for (var i = 0, n = histData.length; i < n; i++) {
          var range = histData[i].getRange();

          if (os.ui.timeline.AbstractTimelineCtrl.isSafeRange(range)) {
            min = Math.min(min, range.getStart());
            max = Math.max(max, range.getEnd());
          }
        }

        if (max > min) {
          begin = new Date(min);
          end = new Date(max);
          doOffset = false;
        }
      }

      break;
    default:
      if (rangeText.indexOf('item.') === 0) {
        var range = rangeText === 'item.load' ? this.tlc.getRange() : this.tlc.getCurrentRange();
        if (range) {
          var extent = os.ui.timeline.normalizeExtent([range.start, range.end]);
          begin = new Date(extent[0]);
          end = new Date(extent[1]);
          doOffset = false;
        }
        break;
      }

      if (rangeText && histData) {
        for (var i = 0, n = histData.length; i < n; i++) {
          if (histData[i].getId() == rangeText) {
            range = histData[i].getRange();

            if (range) {
              begin = new Date(range.getStart());
              end = new Date(range.getEnd());
              doOffset = false;
            }

            break;
          }
        }
        break;
      }
      break;
  }

  if (goog.isDef(begin) && goog.isDef(end)) {
    if (doOffset) {
      begin.setTime(begin.getTime() - os.time.timeOffset);
      end.setTime(end.getTime() - os.time.timeOffset);
    }

    var item = timeline.getItem('window');
    if (item) {
      var s = begin.getTime();
      var e = end.getTime();

      timeline.zoomToExtent([s, e]);

      if (type == 'load') {
        this.tlc.setRange(this.tlc.buildRange(s, e));
        os.time.timeline.autoConfigureFromTimeRange(this.tlc);
        this.moveWindowToData();
      }
      /*
      else if (type == 'loop') {
        //TOOD: Fix this !
        // this.tlc.setLoopStart(s);
        // this.tlc.setLoopEnd(e);
      } */
    }
  }
};


/**
 * Handle keyboard events
 * @param {goog.events.KeyEvent} event
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.onKey = function(event) {
  var ctrl = this.getTimelineCtrl();

  if (ctrl) {
    switch (event.keyCode) {
      case goog.events.KeyCodes.PAGE_UP:
      case goog.events.KeyCodes.UP:
        event.stopPropagation();
        ctrl.zoomIn();
        break;
      case goog.events.KeyCodes.PAGE_DOWN:
      case goog.events.KeyCodes.DOWN:
        event.stopPropagation();
        ctrl.zoomOut();
        break;
      case goog.events.KeyCodes.LEFT:
        if (event.shiftKey) {
          event.stopPropagation();
          ctrl.panLeft();
        } else if (event.ctrlKey) {
          event.stopPropagation();
          this.tlc.first();
        } else {
          event.stopPropagation();
          this.tlc.prev();
        }
        break;
      case goog.events.KeyCodes.RIGHT:
        if (event.shiftKey) {
          event.stopPropagation();
          ctrl.panRight();
        } else if (event.ctrlKey) {
          event.stopPropagation();
          this.tlc.last();
        } else {
          event.stopPropagation();
          this.tlc.next();
        }
        break;
      case goog.events.KeyCodes.SPACE:
        event.stopPropagation();
        this.togglePlay();
        break;
      default:
        break;
    }
  }
};


/**
 * @protected
 */
os.ui.timeline.AbstractTimelineCtrl.prototype.moveWindowToData = function() {
  var histData = /** @type {?Array<!os.hist.HistogramData>} */ (this['histData']);
  if (!histData || !histData.length) {
    this.moveWindowOnHistUpdate = true;
    return;
  }
  this.moveWindowOnHistUpdate = false;

  var mostRecent = Number.NEGATIVE_INFINITY;
  var start = this.tlc.getLoopStart();
  var end = this.tlc.getLoopEnd();

  for (var i = 0, n = histData.length; i < n; i++) {
    var counts = histData[i].getCounts();
    for (var time in counts) {
      if (counts[time] && start <= time && time <= end) {
        mostRecent = Math.max(mostRecent, time);
      }
    }
  }

  if (mostRecent > Number.NEGATIVE_INFINITY) {
    this.tlc.setCurrent(mostRecent + this.lastScaleOptions.interval);
  }
};
