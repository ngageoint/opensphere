goog.declareModuleId('os.ui.timeline.TimelineUI');

import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import * as events from '../../events/events.js';
import Metrics from '../../metrics/metrics.js';
import * as keys from '../../metrics/metricskeys.js';
import Duration from '../../time/duration.js';
import * as osTime from '../../time/time.js';
import TimeInstant from '../../time/timeinstant.js';
import TimelineController from '../../time/timelinecontroller.js';
import TimeRange from '../../time/timerange.js';
import Module from '../module.js';
import * as ui from '../ui.js';
import Brush from './brush.js';
import DragPanEventType from './dragpaneventtype.js';
import OffArrows from './offarrows.js';
import * as timelineUi from './timeline.js';
import TimelineScaleEvent from './timelinescaleevent.js';

const Timer = goog.require('goog.Timer');
const googArray = goog.require('goog.array');
const Throttle = goog.require('goog.async.Throttle');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const MouseWheelHandler = goog.require('goog.events.MouseWheelHandler');
const log = goog.require('goog.log');
const math = goog.require('goog.math');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: HistogramData} = goog.requireType('os.hist.HistogramData');
const {default: ITime} = goog.requireType('os.time.ITime');
const {default: IHistogramChart} = goog.requireType('os.ui.hist.IHistogramChart');
const {default: DragPanEvent} = goog.requireType('os.ui.timeline.DragPanEvent');
const {default: IDragPanItem} = goog.requireType('os.ui.timeline.IDragPanItem');
const {default: ITimelineItem} = goog.requireType('os.ui.timeline.ITimelineItem');
const {default: TimelineScaleOptions} = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * @type {Array}
 */
const formats = [
  ['.%L', timelineUi.formatMillis],
  [':%S', timelineUi.formatSeconds],
  ['%H:%M', timelineUi.formatMinutes],
  ['%H:00', timelineUi.formatHours],
  ['%b %d', timelineUi.formatDate],
  ['%B', timelineUi.formatMonth],
  ['%Y', timelineUi.trueFunction]
];

/**
 * The timeline directive. The start-end parameter should be passed in as
 * TimeRange types for the desired initial behavior of the timeline.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'timeline';


/**
 * Register the  directive.
 */
Module.directive('timeline', [directive]);

/**
 * Controller function for the timeline directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
     * @type {?IHistogramChart}
     * @private
     */
    this.histChart_ = null;

    /**
     * @type {?function(new: IHistogramChart, !Element)}
     * @private
     */
    this.histClass_ = $scope['histClass'] || null;

    /**
     * @type {?Array<!HistogramData>}
     * @private
     */
    this.histData_ = $scope['histData'] || null;

    $scope['items'] = $scope['items'] || [new Brush()];

    /**
     * @type {!Array<ITimelineItem>}
     * @private
     */
    this.items_ = $scope['items'] || [];

    /**
     * The start date of the timeline. Defaults to the start of today in UTC.
     * @type {number}
     * @private
     */
    this.start_ = osTime.floor(new Date(), 'day').getTime();

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
     * @type {?MouseWheelHandler}
     * @private
     */
    this.wheelHandler_ = null;

    /**
     * @type {OffArrows}
     * @private
     */
    this.offArrows_ = new OffArrows();
    this.offArrows_.listen(GoogEventType.PROPERTYCHANGE, this.onArrowsChange_, false, this);

    /**
     * @type {Timer}
     * @private
     */
    this.dragPanTimer_ = new Timer(50);
    this.dragPanTimer_.listen(Timer.TICK, this.onDragPanTick_, false, this);

    /**
     * @type {boolean}
     * @private
     */
    this.dragPanLeft_ = true;

    /**
     * @type {?IDragPanItem}
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
     * @type {Throttle}
     * @private
     */
    this.throttle_ = new Throttle(this.fireScaleEvent_, 40, this);

    if (!multiFormat_) {
      multiFormat_ = d3.time.format.utc.multi(formats);
    }

    /**
     * Resize handler.
     * @type {?function()}
     * @private
     */
    this.resizeFn_ = this.updateSize_.bind(this);
    ui.resize(this.element_, this.resizeFn_);

    $scope.$on('$destroy', this.destroy_.bind(this));

    Settings.getInstance().listen(osTime.OFFSET_KEY, this.onOffsetChange_, false, this);
    this.initTime_();

    // watch for start/end changes before initializing
    this.scope_.$watch('startEnd', this.onStartEndChange_.bind(this));
    this.timeout_(this.init_.bind(this));

    Metrics.getInstance().updateMetric(keys.Timeline.OPEN, 1);
  }

  /**
   * Initiates watches and calls the render loop
   *
   * @private
   */
  init_() {
    if (this.scope_) {
      this.scope_.$watch('histClass', this.onHistClassChange_.bind(this));
      this.scope_.$watch('histData', this.onHistDataChange_.bind(this));
      this.scope_.$watch('sliceBrushes', this.sliceBrushCollectionChanged_.bind(this));
      this.scope_.$watch('loadBrushes', this.loadBrushCollectionChanged_.bind(this));
      this.scope_.$watch('animationBrushes', this.animationBrushCollectionChanged_.bind(this));
      this.scope_.$watch('holdBrushes', this.holdBrushCollectionChanged_.bind(this));
      this.initSvg();
    }
  }

  /**
   * Destroys a brush collection
   *
   * @param {Object} brushCollection
   * @private
   */
  destroyBrushCollection_(brushCollection) {
    if (brushCollection) {
      for (var i = 0; i < brushCollection.length; i = i + 1) {
        try {
          brushCollection[i].deleteBrush(true);
        } catch (err) {
          log.error(logger, 'destroyBrushCollection_', err);
        }
      }
    }
  }

  /**
   * Destroy the directive.
   *
   * @private
   */
  destroy_() {
    if (this.element_ && this.resizeFn_) {
      ui.removeResize(this.element_, this.resizeFn_);
      this.resizeFn_ = null;
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
      this.items_[i].unlisten(GoogEventType.PROPERTYCHANGE, this.onItemChange_, false, this);
      this.items_[i].unlisten(DragPanEventType.START, this.onDragPanStart_, false, this);
      this.items_[i].unlisten(DragPanEventType.STOP, this.onDragPanStop_, false, this);
    }

    dispose(this.offArrows_);
    dispose(this.wheelHandler_);
    dispose(this.dragPanTimer_);
    dispose(this.throttle_);
    dispose(this.histChart_);

    this.scope_ = null;
    this.element_ = null;

    if (this.histGroup_) {
      this.histGroup_.remove();
      this.histGroup_ = null;
    }

    if (this.tooltip_) {
      d3.selectAll('.js-timeline-tooltip').remove();
      this.tooltip_ = null;
    }

    this.xScale_ = null;
    this.yScale_ = null;
    this.xAxis_ = null;
    this.yAxis_ = null;
    this.backgroundElement_ = null;

    if (this.baseElement_) {
      this.baseElement_.remove();
      this.baseElement_ = null;
    }

    Settings.getInstance().unlisten(osTime.OFFSET_KEY, this.onOffsetChange_, false, this);
  }

  /**
   * Extract input parameters from scope to initialize the timeline
   *
   * @private
   */
  initTime_() {
    var startEnd = /** @type {TimeRange} */ (this.scope_['startEnd']);

    if (startEnd) {
      this.start_ = startEnd.getStart();
      this.end_ = startEnd.getEnd();
    }

    if (!this.start_ || !this.end_) {
      this.setTime_();
    }
  }

  /**
   * Handle changes to scope.histData.
   *
   * @param {?function(new: IHistogramChart, !Element)=} opt_new
   * @param {?function(new: IHistogramChart, !Element)=} opt_old
   * @private
   */
  onHistClassChange_(opt_new, opt_old) {
    if (opt_new != opt_old) {
      if (this.histChart_) {
        this.histChart_.dispose();
        this.histChart_ = null;
      }

      this.histClass_ = opt_new || null;
      this.drawHistogram_();
    }
  }

  /**
   * Handle changes to scope.histData.
   *
   * @param {?Array<!HistogramData>=} opt_new
   * @param {?Array<!HistogramData>=} opt_old
   * @private
   */
  onHistDataChange_(opt_new, opt_old) {
    if (opt_new != opt_old) {
      this.histData_ = opt_new || null;
      this.drawHistogram_();
    }
  }

  /**
   * Handle changes to scope.startEnd. This will update the displayed start/end date on the timeline.
   *
   * @param {TimeRange=} opt_new
   * @param {TimeRange=} opt_old
   * @private
   */
  onStartEndChange_(opt_new, opt_old) {
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
  }

  /**
   * Handles changes to the time offset
   *
   * @param {PropertyChangeEvent} e
   * @private
   */
  onOffsetChange_(e) {
    this.rescale_();
  }

  /**
   * Update the timeline from the DOM element size.
   *
   * @private
   */
  updateSize_() {
    if (this.element_ && this.xScale_ && this.baseElement_) {
      var width = this.element_.innerWidth();
      var height = this.getHeight_();
      var handleHeight = timelineUi.getHandleHeight();

      this.xScale_.range([0, width]);
      this.zoom_.x(this.xScale_);

      var mainGroup = this.baseElement_.select('.c-svg-timeline__main');
      mainGroup.select('.c-svg-timeline__axis-background').
          attr('points', this.getAxisBgPoints_(height - handleHeight, width));

      this.drawHistogram_();
      this.updateItems_();
    }
  }

  /**
   * Sets the starting times to default values when they can't be extracted from settings.
   *
   * @private
   */
  setTime_() {
    var duration = Duration.DAY;
    var d = osTime.toUTCDate(new Date());
    this.start = osTime.floor(d, duration).getTime();
    this.end_ = osTime.offset(d, duration, 1).getTime();

    var tlc = TimelineController.getInstance();
    tlc.setDuration(duration);
    tlc.setRange(tlc.buildRange(this.start_, this.end_));
  }

  /**
   * Gets the ticks
   *
   * @return {Array<Date>}
   */
  getTicks() {
    var dates = timelineUi.normalizeExtent(this.xScale_.domain());

    // compute how many labels we want from the width
    var numLabels = Math.floor(this.element_.innerWidth() / 80);

    // We want 10ish labels for the most part
    var tickSize = Controller.getSnap((dates[1] - dates[0]) / numLabels);
    var offset = osTime.getTimeOffset();
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
        d = osTime.floor(d, 'month');
      } else {
        d.setUTCFullYear(d.getUTCFullYear());
        d = osTime.floor(d, 'year');
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
  }

  /**
   * Calculates the correct element height - sometimes it is larger due to a race condition with rendering the dom
   *
   * @return {number}
   * @private
   */
  getHeight_() {
    if (this.element_) {
      var height = this.element_.innerHeight();
      return height > 150 ? 150 : height;
    }

    return 0;
  }

  /**
   * Initializes the SVG elements for the timeline, including the axis, the zoom behavior, the brush and its handles.
   */
  initSvg() {
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
    var axisHeight = timelineUi.getAxisHeight();
    var axisWidth = timelineUi.getAxisWidth();
    var handleHeight = timelineUi.getHandleHeight();

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
          tickFormat(format_).
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

    this.wheelHandler_ = new MouseWheelHandler(this.baseElement_.node());
    this.wheelHandler_.listen(MouseWheelHandler.EventType.MOUSEWHEEL, this.onZoom_, false, this);

    this.backgroundElement_ = /** @type {d3.Selection} */ (bgGroup.append('rect')).
        attr('class', 'c-svg-timeline__background').
        attr('width', '100%').
        attr('height', '100%').
        on(GoogEventType.MOUSEDOWN, this.styleDragStart_.bind(this)).
        on(GoogEventType.MOUSEUP, this.styleDragEnd_.bind(this)).
        on(GoogEventType.MOUSEOUT, this.styleDragEnd_.bind(this));

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
      this.tooltip_.attr('class', 'js-timeline-tooltip c-histogram-tooltip')
          .offset([-10, 0]).html(this.scope_['histTip']);
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
        this.items_[i].unlisten(GoogEventType.PROPERTYCHANGE, this.onItemChange_, false, this);
        this.items_[i].unlisten(DragPanEventType.START, this.onDragPanStart_, false, this);
        this.items_[i].unlisten(DragPanEventType.STOP, this.onDragPanStop_, false, this);
      } catch (e) {
      }
      this.items_[i].listen(GoogEventType.PROPERTYCHANGE, this.onItemChange_, false, this);
      this.items_[i].listen(DragPanEventType.START, this.onDragPanStart_, false, this);
      this.items_[i].listen(DragPanEventType.STOP, this.onDragPanStop_, false, this);
      this.items_[i].initSVG(mainGroup, height - axisHeight - handleHeight);
    }

    // add place holder for hold and skip brushes
    this.skipHoldElement_ = mainGroup.append('g').attr('class', 'skip-hold-brushes');
    mainGroup.append('use').attr('href', '#js-svg-timeline__time-background').
        attr('id', 'js-svg-timeline__background-time-placeholder').
        on(GoogEventType.MOUSEUP, this.toggleVisible_.bind(this)).
        append('title').text('Click to hide/show current time');

    this.offArrows_.setXScale(this.xScale_);
    this.offArrows_.setItems(this.items_.filter(
        /**
         * @param {ITimelineItem} item
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
  }

  /**
   * Handles click logic for hiding and showing the current time text
   * In FF the front most element gets the click, in Chrome both elements get the click, so adjust accordingly
   *
   * @private
   */
  toggleVisible_() {
    var opacity = d3.select('#js-svg-timeline__time-background').style('opacity');
    if (opacity == '0') {
      d3.select('#js-svg-timeline__time-background').style('opacity', '1').style('cursor', 'pointer').
          on(GoogEventType.MOUSEUP, function() {});
      d3.select('#js-svg-timeline__background-time-placeholder').attr('href', '#js-svg-timeline__time-background').
          on(GoogEventType.MOUSEUP, this.toggleVisible_.bind(this));
    } else {
      d3.select('#js-svg-timeline__time-background').style('opacity', '0').style('cursor', 'cell').
          on(GoogEventType.MOUSEUP, this.toggleVisible_.bind(this));
      d3.select('#js-svg-timeline__background-time-placeholder').attr('href', '#js-svg-timeline__time-background-none').
          on(GoogEventType.MOUSEUP, function() {});
    }
  }

  /**
   * Handles drag-to-pan start for items on edges
   *
   * @param {DragPanEvent} event
   * @private
   */
  onDragPanStart_(event) {
    this.dragPanLeft_ = event.left;
    this.dragPanItem_ = /** @type {IDragPanItem} */ (event.target);
    this.dragPanTimer_.start();
  }

  /**
   * Handles drag-to-pan stop for items on edges
   *
   * @private
   */
  onDragPanStop_() {
    this.dragPanTimer_.stop();
    this.dragPanItem_ = null;
  }

  /**
   * Handles the drag-to-pan timer tick
   *
   * @private
   */
  onDragPanTick_() {
    var domain = timelineUi.normalizeExtent(this.xScale_.domain());

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
  }

  /**
   * Gets the points for a polygon backing the x and y axis.
   *
   * @param {number} height
   * @param {number} width
   * @return {string}
   * @private
   */
  getAxisBgPoints_(height, width) {
    var axisHeight = height - timelineUi.getAxisHeight();
    var axisWidth = timelineUi.getAxisWidth();

    var points = '0,1 ' + // start
        axisWidth + ',1 ' + // right to y-axis edge
        axisWidth + ',' + axisHeight + ' ' + // down to x-axis edge
        width + ',' + axisHeight + ' ' + // right to timeline edge
        width + ',' + height + ' ' + // down to bottom/right corner
        '0,' + height + ' ' + // left to bottom/left corner
        '0,1'; // fin

    return points;
  }

  /**
   * Fires a timeline.Scale event with the necessary options.
   *
   * @private
   */
  fireScaleEvent_() {
    var options = /** @type {TimelineScaleOptions} */ ({
      start: this.start_,
      end: this.end_,
      interval: this.snapInterval_
    });
    this.scope_.$emit('timeline.Scale', options);
    dispatcher.getInstance().dispatchEvent(new TimelineScaleEvent(options));
  }

  /**
   * @private
   */
  drawHistogram_() {
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
  }

  /**
   * Zooms a bit about the center
   *
   * @param {number} dir The direction (1 or -1)
   * @param {number=} opt_focus The x value to focus (keep still) while zooming
   * @private
   */
  zoomBy_(dir, opt_focus) {
    var center = [opt_focus !== undefined ? opt_focus : this.element_.innerWidth() / 2, 0];
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
  }

  /**
   * Zooms in a bit
   */
  zoomIn() {
    this.zoomBy_(1);
    Metrics.getInstance().updateMetric(keys.Timeline.ZOOM_IN, 1);
  }

  /**
   * Zooms out a bit
   */
  zoomOut() {
    this.zoomBy_(-1);
    Metrics.getInstance().updateMetric(keys.Timeline.ZOOM_OUT, 1);
  }

  /**
   * Pan a bit
   *
   * @param {number} pixels The number of pixels to pan
   * @private
   */
  pan_(pixels) {
    this.zoom_.translate([this.zoom_.translate()[0] - pixels, 0]);
    this.rescale_();
  }

  /**
   * Pan left a bit
   */
  panLeft() {
    this.pan_(-20);
    Metrics.getInstance().updateMetric(keys.Timeline.PAN_LEFT, 1);
  }

  /**
   * Pan right a bit
   */
  panRight() {
    this.pan_(20);
    Metrics.getInstance().updateMetric(keys.Timeline.PAN_RIGHT, 1);
  }

  /**
   * Handles mouse wheel zoom
   *
   * @param {goog.events.MouseWheelEvent} event
   * @private
   */
  onZoom_(event) {
    // Cant depend on event.offsetX due to FF & chrome being different.
    event.preventDefault();
    var offset = event.clientX - this.element_.find('.c-svg-timeline').offset().left;
    this.zoomBy_(event.deltaY > 0 ? -1 : 1, offset);
    Metrics.getInstance().updateMetric(keys.Timeline.MOUSE_ZOOM, 1);
  }

  /**
   * Jumps the window to the spot
   *
   * @private
   */
  onJump_() {
    var win = /** @type {Brush} */ (this.getItem('window'));

    if (win) {
      var point = d3.mouse(d3.select('.x-axis').node());
      var t = this.xScale_.invert(point[0]).getTime();
      win.jumpTo(t);
      this.rescale_();
    }
  }

  /**
   * Rescales the start/end parameters for the timeline. Called when panning and zooming the timeline.
   *
   * @private
   */
  rescale_() {
    this.updateAxes_();
    this.calculateIntervals_();
    var timeDomain = timelineUi.normalizeExtent(this.xScale_.domain());
    this.start_ = timeDomain[0];
    this.end_ = timeDomain[1];

    this.xAxis_.tickValues(this.getTicks());
    this.throttle_.fire();
  }

  /**
   * Handles item change
   *
   * @param {PropertyChangeEvent} e
   * @private
   */
  onItemChange_(e) {
    var item = /** @type {ITimelineItem} */ (e.target);
    this.updateItems_();
    this.scope_.$emit('timeline.item.' + item.getId(), e.getNewValue());
  }

  /**
   * Updates the x and y axes and removes the first (bottom) element from the y axis. Because it's dumb.
   *
   * @private
   */
  updateAxes_() {
    d3.select('.x-axis').call(/** @type {d3.AxisFn} */ (this.xAxis_));
    d3.select('.y-axis').call(/** @type {d3.AxisFn} */ (this.yAxis_));
    if (d3.select('.y-axis text').data()[0] === 0) {
      d3.select('.y-axis text').remove();
    }
    this.updateItems_();
  }

  /**
   * Calculates the snap and histogram intervals
   *
   * @private
   */
  calculateIntervals_() {
    if (this.zoom_.scale() != this.lastZoom_) {
      var xFn = /** @type {d3.ScaleFn} */ (this.xScale_);
      var pixelScale = 1 / (xFn(1) - xFn(0));

      var px10time = Number(pixelScale.toPrecision(2)) * 10;

      // for the snap interval, find the scale step that is closest to 10 pixels wide
      var steps = timelineUi.SNAP_SCALE;
      var i = googArray.binarySearch(steps, px10time);

      if (i < 0) {
        i = Math.min(Math.abs(i + 1), steps.length - 1);
      }

      if (i === 0) {
        this.snapInterval_ = steps[0];
      } else {
        this.snapInterval_ = Math.abs(steps[i] - px10time) < Math.abs(steps[i - 1] - px10time) ?
          steps[i] : steps[i - 1];
      }
    }

    this.lastZoom_ = this.zoom_.scale();
  }

  /**
   * Updates the timeline items
   *
   * @private
   */
  updateItems_() {
    var height = this.getHeight_() - timelineUi.getAxisHeight() - timelineUi.getHandleHeight();

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
  }

  /**
   * Rounds a time (in milliseconds) to the skip value.
   *
   * @param {number} time
   * @return {number}
   * @private
   */
  roundExtent_(time) {
    var offset = osTime.getTimeOffset();
    return this.snapInterval_ > 0 ?
      Math.round((time + offset) / this.snapInterval_) * this.snapInterval_ - offset : time;
  }

  /**
   * Set the start time and refresh the timeline to reflect the new value.
   *
   * @param {ITime|goog.date.DateLike|string|number} value
   */
  setStart(value) {
    this.start_ = TimeInstant.parseTime(value);
    this.rescale_();
  }

  /**
   * Set the end time and refresh the timeline to reflect the new value.
   *
   * @param {ITime|goog.date.DateLike|string|number} value
   */
  setEnd(value) {
    this.end_ = TimeInstant.parseTime(value);
    this.rescale_();
  }

  /**
   * Sets the visible timeline range by setting startEnd
   * @param {TimeRange} timeRange
   */
  setVisibleRange(timeRange) {
    this.scope_['startEnd'] = timeRange;
  }

  /**
   * Gets the visible timeline range
   * @return {TimeRange}
   */
  getVisibleRange() {
    return new TimeRange(this.start_, this.end_);
  }

  /**
   * Zooms the timeline to the extent of the given item
   *
   * @param {ITimelineItem|string} item The item or item ID to jump to
   */
  zoomToItem(item) {
    if (typeof item === 'string') {
      item = this.getItem(item);
    }

    if (item) {
      this.zoomToExtent(item.getExtent());
    }
  }

  /**
   * Zooms to an extent
   *
   * @param {Array<number>} extent
   */
  zoomToExtent(extent) {
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
  }

  /**
   * Pans the timeline center to the center of the item
   *
   * @param {ITimelineItem|string} item The item or item ID to pan to
   */
  panToItem(item) {
    if (typeof item === 'string') {
      item = this.getItem(item);
    }

    if (item) {
      this.panToExtent(item.getExtent());
    }
  }

  /**
   * Pans to an extent
   *
   * @param {Array<number>} extent
   */
  panToExtent(extent) {
    if (extent && extent.length == 2) {
      var avg = (extent[1] + extent[0]) / 2;
      var domain = timelineUi.normalizeExtent(this.xScale_.domain());
      var diff = (domain[1] - domain[0]) / 2;
      this.setDomain_([avg - diff, avg + diff]);
      this.rescale_();
    }
  }

  /**
   * You can't just use this.xScale_.domain() because it changes the domain that relates to zoom scale = 1. Use this
   * function instead.
   *
   * @param {Array<number>} targetDomain
   * @param {boolean=} opt_clamp Whether or not to clamp the scale. Defaults to just skipping the scale.
   * @private
   */
  setDomain_(targetDomain, opt_clamp) {
    var xFn = /** @type {d3.ScaleFn} */ (this.xScale_);
    var targetDiff = targetDomain[1] - targetDomain[0];

    var domain = timelineUi.normalizeExtent(this.xScale_.domain());
    var diff = domain[1] - domain[0];

    var targetScale = this.zoom_.scale() * diff / targetDiff;

    // enforce min/max zoom
    var limits = this.zoom_.scaleExtent();

    if (opt_clamp) {
      targetScale = math.clamp(targetScale, limits[0], limits[1]);
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
  }

  /**
   * Gets an item by ID from the list of items
   *
   * @param {string} id The ID to search for
   * @return {?ITimelineItem} The item or null if it cannot be found
   */
  getItem(id) {
    for (var i = 0, n = this.items_.length; i < n; i++) {
      if (this.items_[i].getId() == id) {
        return this.items_[i];
      }
    }

    return null;
  }

  /**
   * Append dragging classes to the timeline background element
   *
   * @private
   */
  styleDragStart_() {
    this.backgroundElement_.classed('dragging', true);
  }

  /**
   * Remove dragging classes from the timeline background element
   *
   * @private
   */
  styleDragEnd_() {
    if (this.backgroundElement_) {
      this.backgroundElement_.classed('dragging', false);
    }
  }

  /**
   * @param {PropertyChangeEvent} e
   * @private
   */
  onArrowsChange_(e) {
    if (e.getProperty() == 'zoom') {
      this.zoomToItem(/** @type {string} */ (e.getNewValue()));
    } else if (e.getProperty() == 'pan') {
      this.panToItem(/** @type {string} */ (e.getNewValue()));
    }
  }

  /**
   * Handler for animation brush collection changes
   *
   * @private
   */
  sliceBrushCollectionChanged_() {
    this.brushCollectionChanged_(this.scope_['sliceBrushes']);
  }

  /**
   * Handler for animation brush collection changes
   *
   * @private
   */
  loadBrushCollectionChanged_() {
    this.brushCollectionChanged_(this.scope_['loadBrushes']);
  }

  /**
   * Handler for animation brush collection changes
   *
   * @private
   */
  animationBrushCollectionChanged_() {
    this.brushCollectionChanged_(this.scope_['animationBrushes']);
  }

  /**
   * Handler for hold brush collection changes
   *
   * @private
   */
  holdBrushCollectionChanged_() {
    this.brushCollectionChanged_(this.scope_['holdBrushes']);
  }

  /**
   * Handles changes to to timeline brushes.
   *
   * @param {Array<Brush>} brushes
   * @private
   */
  brushCollectionChanged_(brushes) {
    if (brushes) {
      var height = this.getHeight_();
      var axisHeight = timelineUi.getAxisHeight();
      var handleHeight = timelineUi.getHandleHeight();
      var element = /** @type {d3.Selection} */ (this.skipHoldElement_);
      for (var i = 0; i < brushes.length; i = i + 1) {
        if (!brushes[i].init) {
          brushes[i].setXScale(this.xScale_);
          brushes[i].setSnap(this.snapFn_);
          brushes[i].initSVG(element, height - axisHeight - handleHeight);
        }
      }
    }
  }

  /**
   * Gets the closest snap interval to the given target
   *
   * @param {number} target
   * @return {number} snap
   */
  static getSnap(target) {
    // Get the closest item on the snap scale to the target
    var arr = timelineUi.SNAP_SCALE;
    var i = googArray.binarySearch(arr, target);

    if (i < 0) {
      i = Math.min(Math.abs(i + 1), arr.length - 1);
    }

    return arr[i];
  }

  /**
   * Set the timeline view to the load range.
   *
   */
  static setView() {
    var tlc = TimelineController.getInstance();
    var tlScope = angular.element('.c-svg-timeline').scope();
    if (tlScope && tlScope['timeline']) {
      var timeline = /** @type {Controller} */ (tlScope['timeline']);
      timeline.zoomToExtent([tlc.getStart(), tlc.getEnd()]);
    }
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ui.timeline.TimelineUI');

/**
 * @type {?Function}
 */
let multiFormat_ = null;

/**
 * @param {Date} d
 * @return {!string}
 */
const format_ = function(d) {
  var o = osTime.getTimeOffset() ? new Date(d.getTime() + osTime.getTimeOffset()) : d;
  return multiFormat_(o);
};

/**
 * @param {(Document|Element)} el The element
 * @param {string} type The event type
 * @return {boolean}
 */
const elInTimeline = (el, type) => {
  if (type !== GoogEventType.CONTEXTMENU) {
    return !!$(el).closest('.js-timeline').length;
  }

  return false;
};

// the timeline should be exempt from right-click prevention
events.addExemption(elInTimeline);
