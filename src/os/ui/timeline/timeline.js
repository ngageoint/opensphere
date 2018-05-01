goog.provide('os.ui.timeline');
goog.provide('os.ui.timeline.TimelineCtrl');
goog.provide('os.ui.timeline.TimelineScaleOptions');
goog.provide('os.ui.timeline.timelineDirective');

goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.async.Throttle');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math');
goog.require('os.config.Settings');
goog.require('os.events');
goog.require('os.hist');
goog.require('os.hist.HistogramData');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');
goog.require('os.time.timeline');
goog.require('os.ui.Module');
goog.require('os.ui.hist.IHistogramChart');
goog.require('os.ui.timeline.Brush');
goog.require('os.ui.timeline.DragPanEvent');
goog.require('os.ui.timeline.IDragPanItem');
goog.require('os.ui.timeline.ITimelineItem');
goog.require('os.ui.timeline.OffArrows');
goog.require('os.ui.timeline.TimelineScaleEvent');


/**
 * @typedef {{
 *   start: number,
 *   end: number,
 *   interval: number
 * }}
 */
os.ui.timeline.TimelineScaleOptions;


/**
 * The timeline directive. The start-end parameter should be passed in as
 * os.time.TimeRange types for the desired initial behavior of the timeline.
 * @return {angular.Directive}
 */
os.ui.timeline.timelineDirective = function() {
  return {
    template: '<div class="c-timeline js-timeline"></div>',
    restrict: 'AE',
    replace: true,
    scope: {
      'histClass': '=',
      'histData': '=',
      'histTip': '=',
      'startEnd': '=',
      'items': '=',
      'animationBrushes': '=',
      'holdBrushes': '=',
      'loadBrushes': '=',
      'sliceBrushes': '=',
      'snap': '@'
    },
    controllerAs: 'timeline',
    controller: os.ui.timeline.TimelineCtrl
  };
};


/**
 * Register the  directive.
 */
os.ui.Module.directive('timeline', [os.ui.timeline.timelineDirective]);


/**
 * The scales used for snapping to "nice" values
 * @type {Array<number>}
 * @const
 */
os.ui.timeline.SNAP_SCALE = [
  1,      // 1 ms
  5,      // 5 ms
  10,     // 10 ms
  25,     // 25 ms
  50,     // 50 ms
  1e2,    // 100 ms
  5e2,    // 500 ms
  1e3,    // 1-second
  5e3,    // 5-second
  15e3,   // 15-second
  3e4,    // 30-second
  6e4,    // 1-minute
  3e5,    // 5-minute
  9e5,    // 15-minute
  18e5,   // 30-minute
  36e5,   // 1-hour
  108e5,  // 3-hour
  216e5,  // 6-hour
  432e5,  // 12-hour
  864e5,  // 1-day
  1728e5, // 2-day
  6048e5, // 1-week
  12096e5, // 2-week
  2592e6, // 1-month
  7776e6, // 3-month
  15552e6, // 6-month
  31536e6 // 1-year
];


/**
 * Normalizes extents that could contain either `Array<number>` or `Array<Date>`
 * to `Array<number>`.
 * @param {Array<number|Date>} extent
 * @return {Array<number>} The normalized extent
 */
os.ui.timeline.normalizeExtent = function(extent) {
  // D3 sometimes returns Array<Date> for the extent. This could be from
  // setting the extent with two dates. In any case, we will normalize that here.
  if (extent) {
    for (var i = 0, n = extent.length; i < n; i++) {
      extent[i] = goog.isNumber(extent[i]) ? extent[i] : /** @type {Date} */ (extent[i]).getTime();
    }
  }

  return extent;
};


/**
 * @type {?Function}
 * @private
 */
os.ui.timeline.multiFormat_ = null;


/**
 * @param {Date} d
 * @return {!string}
 * @private
 */
os.ui.timeline.format_ = function(d) {
  var o = os.time.timeOffset ? new Date(d.getTime() + os.time.timeOffset) : d;
  return os.ui.timeline.multiFormat_(o);
};


/**
 * @typedef {function(Date):(number|boolean)}
 */
os.ui.timeline.FormatFn;


/**
 * The format function
 * @param {Date} d The date
 * @return {number} The value
 */
os.ui.timeline.formatMillis = function(d) {
  return d.getUTCMilliseconds();
};


/**
 * The format function
 * @param {Date} d The date
 * @return {number} The value
 */
os.ui.timeline.formatSeconds = function(d) {
  return d.getUTCSeconds();
};


/**
 * The format function
 * @param {Date} d The date
 * @return {number} The value
 */
os.ui.timeline.formatMinutes = function(d) {
  return d.getUTCMinutes();
};


/**
 * The format function
 * @param {Date} d The date
 * @return {number} The value
 */
os.ui.timeline.formatHours = function(d) {
  return d.getUTCHours();
};


/**
 * The format function
 * @param {Date} d The date
 * @return {boolean} The value
 */
os.ui.timeline.formatDate = function(d) {
  return d.getUTCDate() != 1;
};


/**
 * The format function
 * @param {Date} d The date
 * @return {number} The value
 */
os.ui.timeline.formatMonth = function(d) {
  return d.getUTCMonth();
};


/**
 * The format function
 * @return {boolean} The value
 */
os.ui.timeline.trueFunction = function() {
  return true;
};


/**
 * @type {Array}
 * @private
 */
os.ui.timeline.formats_ = [
  ['.%L', os.ui.timeline.formatMillis],
  [':%S', os.ui.timeline.formatSeconds],
  ['%H:%M', os.ui.timeline.formatMinutes],
  ['%H:00', os.ui.timeline.formatHours],
  ['%b %d', os.ui.timeline.formatDate],
  ['%B', os.ui.timeline.formatMonth],
  ['%Y', os.ui.timeline.trueFunction]
];


/**
 * @enum {string}
 */
os.ui.timeline.DragPan = {
  LEFT: 'dragpanleft',
  RIGHT: 'dragpanright',
  STOP: 'dragpanstop'
};



/**
 * Controller function for the timeline directive.
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @ngInject
 */
os.ui.timeline.TimelineCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * The base DOM element.
   * @type {?d3.Selection}
   * @private
   */
  this.baseElement_ = null;

  /**
   * The main background of the timeline
   * @type {?d3.Selection}
   * @private
   */
  this.backgroundElement_ = null;

  /**
   * @type {?d3.Scale}
   * @private
   */
  this.xScale_ = null;

  /**
   * @type {?d3.Scale}
   * @private
   */
  this.yScale_ = null;

  /**
   * @type {?d3.Axis}
   * @private
   */
  this.xAxis_ = null;

  /**
   * @type {?d3.Axis}
   * @private
   */
  this.yAxis_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.initialized_ = false;

  /**
   * Group for rendering histogram data.
   * @type {?d3.Selection}
   * @private
   */
  this.histGroup_ = null;

  /**
   * Chart for the chosen histogram type.
   * @type {?os.ui.hist.IHistogramChart}
   * @private
   */
  this.histChart_ = null;

  /**
   * @type {?function(new: os.ui.hist.IHistogramChart, !Element)}
   * @private
   */
  this.histClass_ = $scope['histClass'] || null;

  /**
   * @type {?Array<!os.hist.HistogramData>}
   * @private
   */
  this.histData_ = $scope['histData'] || null;

  $scope['items'] = $scope['items'] || [new os.ui.timeline.Brush()];

  /**
   * @type {!Array<os.ui.timeline.ITimelineItem>}
   * @private
   */
  this.items_ = $scope['items'];

  /**
   * The start date of the timeline. Defaults to the start of today in UTC.
   * @type {number}
   * @private
   */
  this.start_ = os.time.floor(new Date(), 'day').getTime();

  /**
   * The end date of the timeline. Defaults to the start of tomorrow in UTC.
   * @type {number}
   * @private
   */
  this.end_ = this.start_ + 24 * 60 * 60 * 1000;

  /**
   * @type {number}
   * @private
   */
  this.snapInterval_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.lastZoom_ = -1;

  /**
   * @type {?function(number):number}
   * @private
   */
  this.snapFn_ = null;

  if ($scope['snap'] && $scope['snap'].toLowerCase() == 'true') {
    this.snapFn_ = this.roundExtent_.bind(this);
  }

  /**
   * @type {?d3.Tip}
   * @private
   */
  this.tooltip_ = null;

  /**
   * @type {?goog.events.MouseWheelHandler}
   * @private
   */
  this.wheelHandler_ = null;

  /**
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();
  this.vsm_.listen(goog.events.EventType.RESIZE, this.onViewportResize_, false, this);

  /**
   * @type {os.ui.timeline.OffArrows}
   * @private
   */
  this.offArrows_ = new os.ui.timeline.OffArrows();
  this.offArrows_.listen(goog.events.EventType.PROPERTYCHANGE, this.onArrowsChange_, false, this);

  /**
   * @type {goog.Timer}
   * @private
   */
  this.dragPanTimer_ = new goog.Timer(50);
  this.dragPanTimer_.listen(goog.Timer.TICK, this.onDragPanTick_, false, this);

  /**
   * @type {boolean}
   * @private
   */
  this.dragPanLeft_ = true;

  /**
   * @type {?os.ui.timeline.IDragPanItem}
   * @private
   */
  this.dragPanItem_ = null;

  /**
   * D3 skip/hold group element
   * @type {?d3.Selection}
   * @private
   */
  this.skipHoldElement_ = null;

  /**
   * @type {goog.async.Throttle}
   * @private
   */
  this.throttle_ = new goog.async.Throttle(this.fireScaleEvent_, 40, this);

  if (!os.ui.timeline.multiFormat_) {
    os.ui.timeline.multiFormat_ = d3.time.format.utc.multi(os.ui.timeline.formats_);
  }

  $scope.$on('$destroy', this.destroy_.bind(this));

  os.settings.listen(os.time.OFFSET_KEY, this.onOffsetChange_, false, this);
  this.initTime_();

  // watch for start/end changes before initializing
  this.scope_.$watch('startEnd', goog.bind(this.onStartEndChange_, this));
  this.timeout_(this.init_.bind(this));

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.OPEN, 1);
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 */
os.ui.timeline.TimelineCtrl.LOGGER_ = goog.log.getLogger('os.ui.timeline.TimelineCtrl');


/**
 * @type {number}
 */
os.ui.timeline.TimelineCtrl.AXIS_HEIGHT = 30;


/**
 * @type {number}
 */
os.ui.timeline.TimelineCtrl.AXIS_WIDTH = 30;


/**
 * @type {number}
 */
os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT = 10;


/**
 * Initiates watches and calls the render loop
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.init_ = function() {
  this.scope_.$watch('histClass', goog.bind(this.onHistClassChange_, this));
  this.scope_.$watch('histData', goog.bind(this.onHistDataChange_, this));
  this.scope_.$watch('sliceBrushes', goog.bind(this.sliceBrushCollectionChanged_, this));
  this.scope_.$watch('loadBrushes', goog.bind(this.loadBrushCollectionChanged_, this));
  this.scope_.$watch('animationBrushes', goog.bind(this.animationBrushCollectionChanged_, this));
  this.scope_.$watch('holdBrushes', goog.bind(this.holdBrushCollectionChanged_, this));
  this.initSvg();
};


/**
 * Destroys a brush collection
 * @param {Object} brushCollection
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.destroyBrushCollection_ = function(brushCollection) {
  if (brushCollection) {
    for (var i = 0; i < brushCollection.length; i = i + 1) {
      try {
        brushCollection[i].deleteBrush(true);
      } catch (err) {
        goog.log.error(os.ui.timeline.TimelineCtrl.LOGGER_, 'destroyBrushCollection_', err);
      }
    }
  }
};


/**
 * Destroy the directive.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.destroy_ = function() {
  if (this.vsm_) {
    this.vsm_.dispose();
    this.vsm_ = null;
  }

  this.destroyBrushCollection_(this.scope_['sliceBrushes']);
  this.destroyBrushCollection_(this.scope_['loadBrushes']);
  this.destroyBrushCollection_(this.scope_['animationBrushes']);
  this.destroyBrushCollection_(this.scope_['holdBrushes']);
  this.scope_['sliceBrushes'] = [];
  this.scope_['loadBrushes'] = [];
  this.scope_['animationBrushes'] = [];
  this.scope_['holdBrushes'] = [];
  for (var i = 0, n = this.items_.length; i < n; i++) {
    this.items_[i].unlisten(goog.events.EventType.PROPERTYCHANGE, this.onItemChange_, false, this);
    this.items_[i].unlisten(os.ui.timeline.DragPanEventType.START, this.onDragPanStart_, false, this);
    this.items_[i].unlisten(os.ui.timeline.DragPanEventType.STOP, this.onDragPanStop_, false, this);
  }

  if (this.offArrows_) {
    this.offArrows_.dispose();
  }

  if (this.wheelHandler_) {
    this.wheelHandler_.dispose();
  }

  if (this.dragPanTimer_) {
    this.dragPanTimer_.dispose();
  }

  this.scope_ = null;
  this.element_ = null;

  if (this.throttle_) {
    this.throttle_.dispose();
  }

  if (this.histChart_) {
    this.histChart_.dispose();
    this.histChart_ = null;
  }

  if (this.histGroup_) {
    this.histGroup_.remove();
    this.histGroup_ = null;
  }

  if (this.tooltip_) {
    d3.selectAll('.c-histogram-tooltip').remove();
    this.tooltip_ = null;
  }

  this.xScale_ = null;
  this.yScale_ = null;
  this.xAxis_ = null;
  this.yAxis_ = null;
  this.backgroundElement_ = null;

  this.baseElement_.remove();
  this.baseElement_ = null;

  os.settings.unlisten(os.time.OFFSET_KEY, this.onOffsetChange_, false, this);
};


/**
 * Extract input parameters from scope to initialize the timeline
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.initTime_ = function() {
  var startEnd = /** @type {os.time.TimeRange} */ (this.scope_['startEnd']);

  if (startEnd) {
    this.start_ = startEnd.getStart();
    this.end_ = startEnd.getEnd();
  }

  if (!this.start_ || !this.end_) {
    this.setTime_();
  }
};


/**
 * Handle changes to scope.histData.
 * @param {?function(new: os.ui.hist.IHistogramChart, !Element)=} opt_new
 * @param {?function(new: os.ui.hist.IHistogramChart, !Element)=} opt_old
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onHistClassChange_ = function(opt_new, opt_old) {
  if (opt_new != opt_old) {
    if (this.histChart_) {
      this.histChart_.dispose();
      this.histChart_ = null;
    }

    this.histClass_ = opt_new || null;
    this.drawHistogram_();
  }
};


/**
 * Handle changes to scope.histData.
 * @param {?Array<!os.hist.HistogramData>=} opt_new
 * @param {?Array<!os.hist.HistogramData>=} opt_old
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onHistDataChange_ = function(opt_new, opt_old) {
  if (opt_new != opt_old) {
    this.histData_ = opt_new || null;
    this.drawHistogram_();
  }
};


/**
 * Handle changes to scope.startEnd. This will update the displayed start/end date on the timeline.
 * @param {os.time.TimeRange=} opt_new
 * @param {os.time.TimeRange=} opt_old
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onStartEndChange_ = function(opt_new, opt_old) {
  if (opt_new && opt_new != opt_old && (this.start_ != opt_new.getStart() || this.end_ != opt_new.getEnd())) {
    this.start_ = opt_new.getStart();
    this.end_ = opt_new.getEnd();

    if (this.initialized_) {
      this.setDomain_([this.start_, this.end_]);
      this.rescale_();
    }
  } else {
    // nothing actually changed, so notify listeners that the scale is set
    this.throttle_.fire();
  }
};


/**
 * Handles changes to the time offset
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onOffsetChange_ = function(e) {
  this.rescale_();
};


/**
 * Handles viewport resizes
 * @param {goog.events.Event} event
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onViewportResize_ = function(event) {
  try {
    var width = this.element_.innerWidth();
    var height = this.getHeight_();
    var handleHeight = os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;

    this.xScale_.range([0, width]);

    var mainGroup = this.baseElement_.select('.c-svg-timeline__main');

    mainGroup.select('.c-svg-timeline__axis-background').
        attr('points', this.getAxisBgPoints_(height - handleHeight, width));

    this.drawHistogram_();
    this.updateItems_();
  } catch (err) {
    goog.log.error(os.ui.timeline.TimelineCtrl.LOGGER_, 'onViewportResize_', err);
  }
};


/**
 * Sets the starting times to default values when they can't be extracted from settings.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.setTime_ = function() {
  var duration = os.time.Duration.DAY;
  var d = os.time.toUTCDate(new Date());
  this.start = os.time.floor(d, duration).getTime();
  this.end_ = os.time.offset(d, duration, 1).getTime();

  var tlc = os.time.TimelineController.getInstance();
  tlc.setDuration(duration);
  tlc.setRange(tlc.buildRange(this.start_, this.end_));
};


/**
 * Gets the closest snap interval to the given target
 * @param {number} target
 * @return {number} snap
 */
os.ui.timeline.TimelineCtrl.getSnap = function(target) {
  // Get the closest item on the snap scale to the target
  var arr = os.ui.timeline.SNAP_SCALE;
  var i = goog.array.binarySearch(arr, target);

  if (i < 0) {
    i = Math.min(Math.abs(i + 1), arr.length - 1);
  }

  return arr[i];
};


/**
 * Gets the ticks
 * @return {Array<Date>}
 */
os.ui.timeline.TimelineCtrl.prototype.getTicks = function() {
  var dates = os.ui.timeline.normalizeExtent(this.xScale_.domain());

  // compute how many labels we want from the width
  var numLabels = Math.floor(this.element_.innerWidth() / 80);

  // We want 10ish labels for the most part
  var tickSize = os.ui.timeline.TimelineCtrl.getSnap((dates[1] - dates[0]) / numLabels);
  var offset = os.time.timeOffset;
  var begin = dates[0] + offset;
  var first = begin + tickSize - (begin % tickSize);
  var ticks = [];
  var last = null;

  // weeks should start on Sundays
  if (tickSize % 6048e5 === 0) {
    var d = new Date(first);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    first = d.getTime();
  }

  // if tick size is less than 30 days
  if (tickSize < 2592e6) {
    for (var i = 0; last === null || last <= dates[1]; i++) {
      last = first + tickSize * i - offset;
      ticks.push(new Date(last));
    }
  } else {
    // we're dealing with month or year intervals

    // monthChunk, because it's fun to say
    var monthChunk = tickSize / 2592e6;
    monthChunk = monthChunk > 6 ? 0 : monthChunk;

    d = new Date(dates[0]);

    if (monthChunk) {
      d.setUTCMonth(d.getUTCMonth() - (d.getUTCMonth() % monthChunk));
      d = os.time.floor(d, 'month');
    } else {
      d.setUTCFullYear(d.getUTCFullYear());
      d = os.time.floor(d, 'year');
    }

    for (i = 0; last === null || last <= dates[1]; i++) {
      var t = new Date(d.getTime());

      if (monthChunk) {
        t.setUTCMonth(d.getUTCMonth() + i * monthChunk);
      } else {
        t.setUTCFullYear(d.getUTCFullYear() + i);
      }

      t.setTime(t.getTime() - offset);
      last = t.getTime();
      ticks.push(t);
    }
  }

  return ticks;
};


/**
 * Calculates the correct element height - sometimes it is larger due to a race condition with rendering the dom
 * @return {number}
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.getHeight_ = function() {
  var height = this.element_.innerHeight();
  return height > 150 ? 150 : height;
};


/**
 * Initializes the SVG elements for the timeline, including the axis, the zoom behavior, the brush and its handles.
 */
os.ui.timeline.TimelineCtrl.prototype.initSvg = function() {
  if (this.histChart_) {
    this.histChart_.dispose();
    this.histChart_ = null;
  }

  if (this.baseElement_) {
    this.baseElement_.remove();
    this.baseElement_ = null;
  }

  if (!this.baseElement_) {
    this.baseElement_ = /** @type {d3.Selection} */ (d3.select(this.element_[0]).append('svg')).
        attr('class', 'c-svg-timeline');
  }

  var width = this.element_.innerWidth();
  var height = this.getHeight_();
  var axisHeight = os.ui.timeline.TimelineCtrl.AXIS_HEIGHT;
  var axisWidth = os.ui.timeline.TimelineCtrl.AXIS_WIDTH;
  var handleHeight = os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;

  // initialize scale and axis properties
  if (!this.xScale_) {
    this.xScale_ = d3.time.scale.utc();
  }

  this.xScale_.range([0, width]).domain([0, 24 * 60 * 60 * 1000]);

  if (!this.xAxis_) {
    this.xAxis_ = d3.svg.axis().
        orient('bottom').
        scale(this.xScale_).
        tickSize(8, 0).
        tickFormat(os.ui.timeline.format_).
        tickPadding(5).
        tickValues(this.getTicks());
  }

  if (!this.yScale_) {
    this.yScale_ = d3.scale.linear();
  }

  this.yScale_.range([height - axisHeight - handleHeight - 1, 6]).domain([0, 0]);

  var yTickFormatter = function(d) {
    if (Math.abs(d) > 1000) {
      var prefix = d3.formatPrefix(d);
      if (Math.abs(d) > 10000) {
        return Math.round(prefix.scale(d)) + prefix.symbol;
      }
      return d3.round(prefix.scale(d), 1) + prefix.symbol;
    } else if (Number.isInteger(d)) {
      return d;
    } else {
      return '';
    }
  };

  if (!this.yAxis_) {
    this.yAxis_ = d3.svg.axis().
        orient('left').
        scale(this.yScale_).
        tickFormat(yTickFormatter).
        tickPadding(5).
        tickSize(0, 0).
        ticks([5]);
  }

  if (!this.zoom_) {
    // initialize pan/zoom
    this.zoom_ = d3.behavior.zoom().on('zoom', this.rescale_.bind(this));
  }

  var diff = 24 * 60 * 60 * 1000;
  var maxResolution = 10; // 1 second per 100 pixels
  var minResolution = 31536e6 / 40; // 1 year per 40 pixels
  var minDomainDiff = maxResolution * width;
  var maxDomainDiff = minResolution * width;

  this.zoom_.x(this.xScale_).
      scaleExtent([diff / maxDomainDiff, diff / minDomainDiff]); // this is min/max zoom

  // draw the background
  var bgGroup = /** @type {d3.Selection} */ (this.baseElement_.append('g')).
      attr('class', 'js-svg-timeline__background-group');

  this.baseElement_.call(this.zoom_).
      // on('contextmenu', this.onContextMenu_.bind(this)). // add context menu
      on('wheel.zoom', null). // turn off default zoom
      on('dblclick.zoom', null). // turn off double-click to zoom
      on('dblclick.jump', this.onJump_.bind(this)); // and make it jump the window to that spot instead

  // hook up custom zoom handler
  if (this.wheelHandler_) {
    this.wheelHandler_.dispose();
  }

  this.wheelHandler_ = new goog.events.MouseWheelHandler(this.baseElement_.node());
  this.wheelHandler_.listen(goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.onZoom_, false, this);

  this.backgroundElement_ = /** @type {d3.Selection} */ (bgGroup.append('rect')).
      attr('class', 'c-svg-timeline__background').
      attr('width', '100%').
      attr('height', '100%').
      on(goog.events.EventType.MOUSEDOWN, this.styleDragStart_.bind(this)).
      on(goog.events.EventType.MOUSEUP, this.styleDragEnd_.bind(this)).
      on(goog.events.EventType.MOUSEOUT, this.styleDragEnd_.bind(this));

  bgGroup.append('rect').
      attr('class', 'c-svg-timeline__axis-background').
      attr('width', '100%').
      attr('height', '' + handleHeight);

  var mainGroup = this.baseElement_.append('g').
      attr('class', 'c-svg-timeline__main').
      attr('transform', 'translate(0, ' + handleHeight + ')');

  mainGroup.append('line').
      attr('class', 'c-svg-timeline__line').
      attr('x2', '100%').
      attr('y2', 0);

  // create the histogram group
  this.histGroup_ = /** @type {d3.Selection} */ (mainGroup.append('g')).attr('class', 'c-histogram-group');

  // draw backdrop for the x/y axis
  mainGroup.append('polygon').
      attr('points', this.getAxisBgPoints_(height - handleHeight, width)).
      attr('class', 'c-svg-timeline__axis-background');

  // initialize the histogram tooltip if the tip function is available
  if (this.scope_['histTip']) {
    this.tooltip_ = d3.tip();
    this.tooltip_.attr('class', 'c-histogram-tooltip').offset([-10, 0]).html(this.scope_['histTip']);
    this.tooltip_(this.baseElement_);
  }

  // draw the axis
  /** @type {d3.Selection} */ (mainGroup.append('g')).
      attr('transform', 'translate(0,' + (height - axisHeight - handleHeight) + ')').
      attr('class', 'axis x-axis').
      call(this.xAxis_);

  /** @type {d3.Selection} */ (mainGroup.append('g')).
      attr('transform', 'translate(' + axisWidth + ', 0)').
      attr('class', 'axis y-axis').
      call(this.yAxis_);

  // init items
  for (var i = 0, n = this.items_.length; i < n; i++) {
    this.items_[i].setXScale(this.xScale_);
    this.items_[i].setSnap(this.snapFn_);
    try {
      this.items_[i].unlisten(goog.events.EventType.PROPERTYCHANGE, this.onItemChange_, false, this);
      this.items_[i].unlisten(os.ui.timeline.DragPanEventType.START, this.onDragPanStart_, false, this);
      this.items_[i].unlisten(os.ui.timeline.DragPanEventType.STOP, this.onDragPanStop_, false, this);
    } catch (e) {
    }
    this.items_[i].listen(goog.events.EventType.PROPERTYCHANGE, this.onItemChange_, false, this);
    this.items_[i].listen(os.ui.timeline.DragPanEventType.START, this.onDragPanStart_, false, this);
    this.items_[i].listen(os.ui.timeline.DragPanEventType.STOP, this.onDragPanStop_, false, this);
    this.items_[i].initSVG(mainGroup, height - axisHeight - handleHeight);
  }

  // add place holder for hold and skip brushes
  this.skipHoldElement_ = mainGroup.append('g').attr('class', 'skip-hold-brushes');

  this.offArrows_.setXScale(this.xScale_);
  this.offArrows_.setItems(this.items_.filter(
      /**
       * @param {os.ui.timeline.ITimelineItem} item
       * @param {number} i
       * @param {Array} arr
       * @return {boolean}
       */
      function(item, i, arr) {
        return item.isInteractive();
      }));

  this.offArrows_.initSVG(mainGroup, height - axisHeight - handleHeight);

  this.setDomain_([this.start_, this.end_], true);
  this.initialized_ = true;
  this.scope_.$emit('timeline.Init');
  this.rescale_();
};


/**
 * Handles drag-to-pan start for items on edges
 * @param {os.ui.timeline.DragPanEvent} event
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onDragPanStart_ = function(event) {
  this.dragPanLeft_ = event.left;
  this.dragPanItem_ = /** @type {os.ui.timeline.IDragPanItem} */ (event.target);
  this.dragPanTimer_.start();
};


/**
 * Handles drag-to-pan stop for items on edges
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onDragPanStop_ = function() {
  this.dragPanTimer_.stop();
  this.dragPanItem_ = null;
};


/**
 * Handles the drag-to-pan timer tick
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onDragPanTick_ = function() {
  var domain = os.ui.timeline.normalizeExtent(this.xScale_.domain());

  try {
    if (this.dragPanItem_.dragPanTo) {
      if (this.dragPanLeft_) {
        this.panLeft();
        this.dragPanItem_.dragPanTo(domain[0]);
      } else {
        this.panRight();
        this.dragPanItem_.dragPanTo(domain[1]);
      }
    }
  } catch (e) {
  }
};


/**
 * Gets the points for a polygon backing the x and y axis.
 * @param {number} height
 * @param {number} width
 * @return {string}
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.getAxisBgPoints_ = function(height, width) {
  var axisHeight = height - os.ui.timeline.TimelineCtrl.AXIS_HEIGHT;
  var axisWidth = os.ui.timeline.TimelineCtrl.AXIS_WIDTH;

  var points = '0,1 ' + // start
      axisWidth + ',1 ' + // right to y-axis edge
      axisWidth + ',' + axisHeight + ' ' + // down to x-axis edge
      width + ',' + axisHeight + ' ' + // right to timeline edge
      width + ',' + height + ' ' + // down to bottom/right corner
      '0,' + height + ' ' + // left to bottom/left corner
      '0,1'; // fin

  return points;
};


/**
 * Fires a timeline.Scale event with the necessary options.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.fireScaleEvent_ = function() {
  var options = /** @type {os.ui.timeline.TimelineScaleOptions} */ ({
    start: this.start_,
    end: this.end_,
    interval: this.snapInterval_
  });
  this.scope_.$emit('timeline.Scale', options);
  os.dispatcher.dispatchEvent(new os.ui.timeline.TimelineScaleEvent(options));
};


/**
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.drawHistogram_ = function() {
  if (this.histGroup_) {
    var groupElement = this.histGroup_.node();
    if (!this.histChart_ && this.histClass_ && groupElement) {
      this.histChart_ = new this.histClass_(groupElement);
    }

    if (this.histChart_ && this.histData_ && this.xScale_ && this.yScale_) {
      this.histChart_.draw(this.histData_, this.xScale_, this.yScale_);

      // add hover events if the tooltip is available
      if (this.tooltip_) {
        this.histChart_.tooltip(this.tooltip_);
      }
    }
  }

  this.updateAxes_();
};


/**
 * Zooms a bit about the center
 * @param {number} dir The direction (1 or -1)
 * @param {number=} opt_focus The x value to focus (keep still) while zooming
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.zoomBy_ = function(dir, opt_focus) {
  var center = [goog.isDef(opt_focus) ? opt_focus : this.element_.innerWidth() / 2, 0];
  var limit = this.zoom_.scaleExtent();
  var translate = this.zoom_.translate();
  var translate0 = [];
  var view = {
    x: translate[0],
    y: translate[1],
    k: this.zoom_.scale()
  };

  var targetScale = view.k * (1 + 0.1 * dir);
  if (targetScale < limit[0] || targetScale > limit[1]) {
    return;
  }

  translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
  view.k = targetScale;
  var l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

  view.x += center[0] - l[0];
  view.y += center[1] - l[1];

  this.zoom_.translate([view.x, view.y]).scale(view.k);
  this.rescale_();
};


/**
 * Zooms in a bit
 */
os.ui.timeline.TimelineCtrl.prototype.zoomIn = function() {
  this.zoomBy_(1);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.ZOOM_IN, 1);
};


/**
 * Zooms out a bit
 */
os.ui.timeline.TimelineCtrl.prototype.zoomOut = function() {
  this.zoomBy_(-1);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.ZOOM_OUT, 1);
};


/**
 * Pan a bit
 * @param {number} pixels The number of pixels to pan
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.pan_ = function(pixels) {
  this.zoom_.translate([this.zoom_.translate()[0] - pixels, 0]);
  this.rescale_();
};


/**
 * Pan left a bit
 */
os.ui.timeline.TimelineCtrl.prototype.panLeft = function() {
  this.pan_(-20);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.PAN_LEFT, 1);
};


/**
 * Pan right a bit
 */
os.ui.timeline.TimelineCtrl.prototype.panRight = function() {
  this.pan_(20);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.PAN_RIGHT, 1);
};


/**
 * Handles mouse wheel zoom
 * @param {goog.events.MouseWheelEvent} event
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onZoom_ = function(event) {
  // Cant depend on event.offsetX due to FF & chrome being different.
  event.preventDefault();
  var offset = event.clientX - this.element_.find('.c-svg-timeline').offset().left;
  this.zoomBy_(event.deltaY > 0 ? -1 : 1, offset);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.MOUSE_ZOOM, 1);
};


/**
 * Jumps the window to the spot
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onJump_ = function() {
  var win = /** @type {os.ui.timeline.Brush} */ (this.getItem('window'));

  if (win) {
    var point = d3.mouse(d3.select('.x-axis').node());
    var t = this.xScale_.invert(point[0]).getTime();
    win.jumpTo(t);
    this.rescale_();
  }
};


/**
 * Rescales the start/end parameters for the timeline. Called when panning and zooming the timeline.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.rescale_ = function() {
  this.updateAxes_();
  this.calculateIntervals_();
  var timeDomain = os.ui.timeline.normalizeExtent(this.xScale_.domain());
  this.start_ = timeDomain[0];
  this.end_ = timeDomain[1];

  this.xAxis_.tickValues(this.getTicks());
  this.throttle_.fire();
};


/**
 * Handles item change
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onItemChange_ = function(e) {
  var item = /** @type {os.ui.timeline.ITimelineItem} */ (e.target);
  this.updateItems_();
  this.scope_.$emit('timeline.item.' + item.getId(), e.getNewValue());
};


/**
 * Updates the x and y axes and removes the first (bottom) element from the y axis. Because it's dumb.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.updateAxes_ = function() {
  d3.select('.x-axis').call(/** @type {d3.AxisFn} */ (this.xAxis_));
  d3.select('.y-axis').call(/** @type {d3.AxisFn} */ (this.yAxis_));
  if (d3.select('.y-axis text').data()[0] === 0) {
    d3.select('.y-axis text').remove();
  }
  this.updateItems_();
};


/**
 * Calculates the snap and histogram intervals
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.calculateIntervals_ = function() {
  if (this.zoom_.scale() != this.lastZoom_) {
    var xFn = /** @type {d3.ScaleFn} */ (this.xScale_);
    var pixelScale = 1 / (xFn(1) - xFn(0));

    var px10time = Number(pixelScale.toPrecision(2)) * 10;

    // for the snap interval, find the scale step that is closest to 10 pixels wide
    var steps = os.ui.timeline.SNAP_SCALE;
    var i = goog.array.binarySearch(steps, px10time);

    if (i < 0) {
      i = Math.min(Math.abs(i + 1), steps.length - 1);
    }

    if (i === 0) {
      this.snapInterval_ = steps[0];
    } else {
      this.snapInterval_ = Math.abs(steps[i] - px10time) < Math.abs(steps[i - 1] - px10time) ? steps[i] : steps[i - 1];
    }
  }

  this.lastZoom_ = this.zoom_.scale();
};


/**
 * Updates the timeline items
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.updateItems_ = function() {
  var height = this.getHeight_() - os.ui.timeline.TimelineCtrl.AXIS_HEIGHT - os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;

  for (var i = 0, n = this.items_.length; i < n; i++) {
    this.items_[i].render(height);
  }

  if (this.scope_['sliceBrushes']) {
    for (var i = 0, n = this.scope_['sliceBrushes'].length; i < n; i++) {
      this.scope_['sliceBrushes'][i].render(height);
    }
  }

  if (this.scope_['loadBrushes']) {
    for (var i = 0, n = this.scope_['loadBrushes'].length; i < n; i++) {
      this.scope_['loadBrushes'][i].render(height);
    }
  }

  if (this.scope_['animationBrushes']) {
    for (var i = 0, n = this.scope_['animationBrushes'].length; i < n; i++) {
      this.scope_['animationBrushes'][i].render(height);
    }
  }

  if (this.scope_['holdBrushes']) {
    for (var i = 0, n = this.scope_['holdBrushes'].length; i < n; i++) {
      this.scope_['holdBrushes'][i].render(height);
    }
  }

  this.offArrows_.setStart(this.start_);
  this.offArrows_.setEnd(this.end_);
  this.offArrows_.render(height);
};


/**
 * Rounds a time (in milliseconds) to the skip value.
 * @param {number} time
 * @return {number}
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.roundExtent_ = function(time) {
  var offset = os.time.timeOffset;
  return this.snapInterval_ > 0 ? Math.round((time + offset) / this.snapInterval_) * this.snapInterval_ - offset : time;
};


/**
 * Set the start time and refresh the timeline to reflect the new value.
 * @param {os.time.ITime|goog.date.DateLike|string|number} value
 */
os.ui.timeline.TimelineCtrl.prototype.setStart = function(value) {
  this.start_ = os.time.TimeInstant.parseTime(value);
  this.rescale_();
};


/**
 * Set the end time and refresh the timeline to reflect the new value.
 * @param {os.time.ITime|goog.date.DateLike|string|number} value
 */
os.ui.timeline.TimelineCtrl.prototype.setEnd = function(value) {
  this.end_ = os.time.TimeInstant.parseTime(value);
  this.rescale_();
};


/**
 * Zooms the timeline to the extent of the given item
 * @param {os.ui.timeline.ITimelineItem|string} item The item or item ID to jump to
 */
os.ui.timeline.TimelineCtrl.prototype.zoomToItem = function(item) {
  if (goog.isString(item)) {
    item = this.getItem(item);
  }

  if (item) {
    this.zoomToExtent(item.getExtent());
  }
};


/**
 * Zooms to an extent
 * @param {Array<number>} extent
 */
os.ui.timeline.TimelineCtrl.prototype.zoomToExtent = function(extent) {
  if (extent && extent.length == 2) {
    var begin = extent[0];
    var end = extent[1];
    var diff = end - begin;
    var buffer = diff * 0.05;

    // Calling this twice fixes a serious rounding error that occurs with certain zooms. If you can find a better
    // way to fix this problem, please implement it.
    this.setDomain_([begin - buffer, end + buffer], true);
    this.setDomain_([begin - buffer, end + buffer], true);
    this.rescale_();
  }
};


/**
 * Pans the timeline center to the center of the item
 * @param {os.ui.timeline.ITimelineItem|string} item The item or item ID to pan to
 */
os.ui.timeline.TimelineCtrl.prototype.panToItem = function(item) {
  if (goog.isString(item)) {
    item = this.getItem(item);
  }

  if (item) {
    this.panToExtent(item.getExtent());
  }
};


/**
 * Pans to an extent
 * @param {Array<number>} extent
 */
os.ui.timeline.TimelineCtrl.prototype.panToExtent = function(extent) {
  if (extent && extent.length == 2) {
    var avg = (extent[1] + extent[0]) / 2;
    var domain = os.ui.timeline.normalizeExtent(this.xScale_.domain());
    var diff = (domain[1] - domain[0]) / 2;
    this.setDomain_([avg - diff, avg + diff]);
    this.rescale_();
  }
};


/**
 * You can't just use this.xScale_.domain() because it changes the domain that relates to zoom scale = 1. Use this
 * function instead.
 *
 * @param {Array<number>} targetDomain
 * @param {boolean=} opt_clamp Whether or not to clamp the scale. Defaults to just skipping the scale.
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.setDomain_ = function(targetDomain, opt_clamp) {
  var xFn = /** @type {d3.ScaleFn} */ (this.xScale_);
  var targetDiff = targetDomain[1] - targetDomain[0];

  var domain = os.ui.timeline.normalizeExtent(this.xScale_.domain());
  var diff = domain[1] - domain[0];

  var targetScale = this.zoom_.scale() * diff / targetDiff;

  // enforce min/max zoom
  var limits = this.zoom_.scaleExtent();

  if (opt_clamp) {
    targetScale = goog.math.clamp(targetScale, limits[0], limits[1]);
  } else if (targetScale < limits[0] || targetScale > limits[1]) {
    return;
  }

  this.zoom_.scale(targetScale);

  var tx = this.zoom_.translate()[0];
  var tx2 = xFn(targetDomain[0]);
  if (isNaN(tx) || isNaN(tx2)) {
    // when moving from very large scales (zoomed way in) to very small scales, the translation value
    // can be a problem because the current translation value in the new scale is outside the range of
    // valid dates
    this.zoom_.translate([0, 0]);
    tx = this.zoom_.translate()[0];
    tx2 = xFn(targetDomain[0]);
  }

  // now translate to the correct start date
  this.zoom_.translate([tx - tx2, 0]);
};


/**
 * Gets an item by ID from the list of items
 * @param {string} id The ID to search for
 * @return {?os.ui.timeline.ITimelineItem} The item or null if it cannot be found
 */
os.ui.timeline.TimelineCtrl.prototype.getItem = function(id) {
  for (var i = 0, n = this.items_.length; i < n; i++) {
    if (this.items_[i].getId() == id) {
      return this.items_[i];
    }
  }

  return null;
};


/**
 * Append dragging classes to the timeline background element
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.styleDragStart_ = function() {
  this.backgroundElement_.classed('dragging', true);
};


/**
 * Remove dragging classes from the timeline background element
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.styleDragEnd_ = function() {
  if (this.backgroundElement_) {
    this.backgroundElement_.classed('dragging', false);
  }
};


/**
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.onArrowsChange_ = function(e) {
  if (e.getProperty() == 'zoom') {
    this.zoomToItem(/** @type {string} */ (e.getNewValue()));
  } else if (e.getProperty() == 'pan') {
    this.panToItem(/** @type {string} */ (e.getNewValue()));
  }
};


/**
 * Handler for animation brush collection changes
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.sliceBrushCollectionChanged_ = function() {
  this.brushCollectionChanged_(this.scope_['sliceBrushes']);
};


/**
 * Handler for animation brush collection changes
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.loadBrushCollectionChanged_ = function() {
  this.brushCollectionChanged_(this.scope_['loadBrushes']);
};


/**
 * Handler for animation brush collection changes
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.animationBrushCollectionChanged_ = function() {
  this.brushCollectionChanged_(this.scope_['animationBrushes']);
};


/**
 * Handler for hold brush collection changes
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.holdBrushCollectionChanged_ = function() {
  this.brushCollectionChanged_(this.scope_['holdBrushes']);
};


/**
 * Handles changes to to timeline brushes.
 * @param {Array<os.ui.timeline.Brush>} brushes
 * @private
 */
os.ui.timeline.TimelineCtrl.prototype.brushCollectionChanged_ = function(brushes) {
  if (brushes) {
    var height = this.getHeight_();
    var axisHeight = os.ui.timeline.TimelineCtrl.AXIS_HEIGHT;
    var handleHeight = os.ui.timeline.TimelineCtrl.HANDLE_HEIGHT;
    var element = /** @type {d3.Selection} */ (this.skipHoldElement_);
    for (var i = 0; i < brushes.length; i = i + 1) {
      if (!brushes[i].init) {
        brushes[i].setXScale(this.xScale_);
        brushes[i].setSnap(this.snapFn_);
        brushes[i].initSVG(element, height - axisHeight - handleHeight);
      }
    }
  }
};


// the timeline should be exempt from right-click prevention
os.events.addExemption(
    /**
     * @param {(Document|Element)} el The element
     * @param {string} type The event type
     * @return {boolean}
     */
    function(el, type) {
      if (type !== goog.events.EventType.CONTEXTMENU) {
        return !!$(el).closest('.js-timeline').length;
      }

      return false;
    });
