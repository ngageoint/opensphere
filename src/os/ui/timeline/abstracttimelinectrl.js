goog.module('os.ui.timeline.AbstractTimelineCtrl');

goog.require('os.ui.SliderUI');

const googArray = goog.require('goog.array');
const asserts = goog.require('goog.asserts');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const Range = goog.require('goog.math.Range');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');
const metrics = goog.require('os.metrics');
const Metrics = goog.require('os.metrics.Metrics');
const osTime = goog.require('os.time');
const TimeRange = goog.require('os.time.TimeRange');
const TimelineController = goog.require('os.time.TimelineController');
const TimelineEventType = goog.require('os.time.TimelineEventType');
const osTimeline = goog.require('os.time.timeline');
const ui = goog.require('os.ui');
const GlobalMenuEventType = goog.require('os.ui.GlobalMenuEventType');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventType = goog.require('os.ui.events.UIEventType');
const hist = goog.require('os.ui.hist');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const timelineUi = goog.require('os.ui.timeline');
const Brush = goog.require('os.ui.timeline.Brush');
const BrushEventType = goog.require('os.ui.timeline.BrushEventType');
const CurrentTimeMarker = goog.require('os.ui.timeline.CurrentTimeMarker');
const SelectBrush = goog.require('os.ui.timeline.SelectBrush');
const TileAxis = goog.require('os.ui.timeline.TileAxis');

const HistogramData = goog.requireType('os.hist.HistogramData');
const TimelineControllerEvent = goog.requireType('os.time.TimelineControllerEvent');
const IHistogramManager = goog.requireType('os.ui.hist.IHistogramManager');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const ITimelineItem = goog.requireType('os.ui.timeline.ITimelineItem');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');
const {Controller: TimelineCtrl} = goog.requireType('os.ui.timeline.TimelineUI');


/**
 * Controller function for the timeline-panel directive.
 * @unrestricted
 */
class Controller {
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
     * @protected
     */
    this.scope = $scope;
    this.scope['collapsed'] = collapsed;

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
     * @type {?IHistogramManager}
     * @protected
     */
    this.histManager = null;

    /**
     * @type {!Array<string>}
     * @private
     */
    this.histClasses_ = googObject.getKeys(hist.CHART_TYPES);

    /**
     * @type {?TimelineController}
     * @protected
     */
    this.tlc = TimelineController.getInstance();

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
     * @type {?TimelineScaleOptions}
     * @protected
     */
    this.lastScaleOptions = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.moveWindowOnHistUpdate = false;

    /**
     * @type {Array<Function>}
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
     * @type {?function(new: hist.IHistogramChart, !Element)}
     */
    this['histClass'] = null;

    /**
     * @type {?Array<!HistogramData>}
     */
    this['histData'] = null;

    /**
     * @type {boolean}
     */
    this['playing'] = this.tlc.isPlaying();

    /**
     * @type {TimeRange}
     */
    this['timeRange'] = null;

    // initialize the chart type
    var histClass = /** @type {string} */
        (Settings.getInstance().get(['ui', 'timelineSettings', 'chartType'], 'line'));
    var histClassIdx = this.histClasses_.indexOf(histClass);
    if (histClassIdx > -1) {
      googArray.rotate(this.histClasses_, histClassIdx);
      this['histClass'] = hist.CHART_TYPES[this.histClasses_[0]];
    }

    /**
     * @type {Brush}
     */
    this.windowBrush = new Brush();
    this.windowBrush.setClamp(false);
    this.windowBrush.setToolTip('The currently-displayed time window');
    this.windowBrush.drawFlagCheck = drawFlagCheck;

    /**
     * @type {SelectBrush}
     */
    this.selectBrush = new SelectBrush();
    this.selectBrush.setId('select');
    this.selectBrush.setMenuContainer('#map-container');
    this.selectBrush.listen(GoogEventType.CHANGE, this.onSelectChange, false, this);
    this.selectBrush.listen(GoogEventType.EXIT, this.onSelectChange, false, this);
    this.selectBrush.listen(GoogEventType.DRAGSTART, this.onSelectChange, false, this);

    /**
     * @type {TileAxis}
     */
    var tileAxis = new TileAxis();

    /**
     * @type {CurrentTimeMarker}
     */
    var currentTimeMarker = new CurrentTimeMarker();

    /**
     * @type {?Array<!ITimelineItem>}
     */
    this['items'] = [tileAxis, currentTimeMarker, this.windowBrush, this.selectBrush];

    /**
     * @type {?Array<!Brush>}
     */
    this['sliceBrushes'] = [];

    /**
     * @type {?Array<!Brush>}
     */
    this['loadBrushes'] = [];

    /**
     * @type {?Array<!Brush>}
     */
    this['animationBrushes'] = [];

    /**
     * @type {?Array<!Brush>}
     */
    this['holdBrushes'] = [];

    /**
     * @type {boolean}
     * @protected
     */
    this.inEvent = false;

    /**
     * @type {Menu|undefined}
     * @protected
     */
    this.loadMenu = undefined;

    /**
     * @type {KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(this.element[0]);
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.onKey, false, this);

    /**
     * @type {Menu|undefined}
     * @protected
     */
    this.zoomMenu = undefined;

    // force the animation/hold range state to be updated
    this.onAnimationRangeChanged_(null);
    this.onHoldRangeChanged_(null);

    this.initMenus();

    /**
     * @type {Object<string, Menu>}
     * @private
     */
    this.menus_ = {
      '.js-load-presets': this.loadMenu,
      '.js-zoom-group': this.zoomMenu
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
  }

  /**
   * Clear references to Angular/DOM elements.
   */
  destroy() {
    this.releaseControl();
    this.keyHandler_.dispose();

    for (var i = 0, n = this.destroyers_.length; i < n; i++) {
      this.destroyers_[i]();
    }

    var selectBrush = /** @type {SelectBrush} */ (this.getItem('select'));
    selectBrush.unlisten(GoogEventType.CHANGE, this.onSelectChange, false, this);
    selectBrush.unlisten(GoogEventType.EXIT, this.onSelectChange, false, this);
    selectBrush.unlisten(GoogEventType.DRAGSTART, this.onSelectChange, false, this);

    var items = /** @type {!Array<ITimelineItem>} */ (this['items']);
    for (i = 0, n = items.length; i < n; i++) {
      items[i].dispose();
    }

    dispose(this.loadMenu);
    dispose(this.zoomMenu);
    this.loadMenu = undefined;
    this.zoomMenu = undefined;

    this.tlc = null;
    this.lastScaleOptions = null;

    this.scope = null;
    this.element = null;
    this.timeout = null;
  }

  /**
   * Handle timeline window change
   *
   * @param {angular.Scope.Event | null} event
   * @param {Array<number>} range
   * @protected
   */
  onWindow(event, range) {
    if (!this.inEvent && range && range.length === 2) {
      this.inEvent = true;
      var diff = range[1] - range[0];

      // only change skip if the size actually changed
      if (diff != this.tlc.getOffset()) {
        this.tlc.setOffset(diff);
        if (!this.tlc.getLock()) {
          this.tlc.setSkip(diff / 2);
        } else {
          this.tlc.setSkip(diff);
          this.tlc.setLockRange(diff);
        }
      }
      if (this.tlc.getLock() && this.tlc.getAnimationRange().start != range[0]) {
        this.tlc.updateLock(false);
        AlertManager.getInstance().sendAlert('Moving the currently displayed window turns off the timeline lock. ' +
          'Relock at the new location if desired.', AlertEventSeverity.INFO);
        this.tlc.setSkip(diff / 2);
      }

      this.tlc.setCurrent(range[1]);
      this.inEvent = false;
    }
  }

  /**
   * Handle timeline load range change
   *
   * @param {angular.Scope.Event | null} event
   * @param {Array<number>} range
   * @protected
   */
  onLoad(event, range) {
    if (!this.inEvent && range && range.length === 2) {
      this.inEvent = true;
      this.tlc.setRange(this.tlc.buildRange(range[0], range[1]));
      this.inEvent = false;
    }
  }

  /**
   * Handle timeline load range change
   *
   * @param {angular.Scope.Event | null} event
   * @param {Array<number>} range
   * @protected
   */
  onLoop(event, range) {
    if (!this.inEvent && range && range.length === 2) {
      this.inEvent = true;

      // TODO: Handle this.
      // this.tlc.setLoopStart(range[0]);
      // this.tlc.setLoopEnd(range[1]);

      this.inEvent = false;
    }
  }

  /**
   * Handle timeline scale change event.
   *
   * @param {angular.Scope.Event} event
   * @param {TimelineScaleOptions} scaleOptions Options for the timeline scale.
   */
  onScaleEvent(event, scaleOptions) {
    this.lastScaleOptions = scaleOptions;

    var formats = labelFormats;
    var i = formats.length;
    var format = '';
    var diff = scaleOptions['end'] - scaleOptions['start'];

    while (i--) {
      format += formats[i].format;

      if (diff > formats[i].diff) {
        break;
      }
    }

    var s = new Date(scaleOptions['start'] + osTime.getTimeOffset());
    var e = new Date(scaleOptions['end'] + osTime.getTimeOffset());

    format += ' ';

    this.scope['start'] = osTime.momentFormat(s, format, true) + osTime.getTimeOffsetLabel();
    this.scope['end'] = osTime.momentFormat(e, format, true) + osTime.getTimeOffsetLabel();

    this.updateHistograms_();

    if (this.updateBrushesOnScale) {
      this.updateBrushes();
      this.updateBrushesOnScale = false;
    }
  }

  /**
   * Handle fps changes.
   *
   * @param {number=} opt_new
   * @param {number=} opt_old
   * @private
   */
  onFpsChange_(opt_new, opt_old) {
    if (opt_new != null && opt_new !== opt_old) {
      var value = fpsValues[opt_new];
      this['fps'] = value;
      this.setTimelineFps(value);

      Metrics.getInstance().updateMetric(metrics.keys.Timeline.FPS, 1);
    }
  }

  /**
   * Initialize the framerate from the timeline controller.
   *
   * @private
   */
  initFps_() {
    if (this.tlc) {
      var fps = this.tlc.getFps();
      if (this['fps'] != fps) {
        // find the first slider value that doesn't exceed the controller value. stop iteration at the last value and use
        // it if the value is larger than allowed.
        var values = fpsValues;
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
  }

  /**
   * Sets the framerate on the timeline controller.
   *
   * @param {number} value The desired framerate
   * @protected
   */
  setTimelineFps(value) {
    // stop listening so we don't loop ourselves
    this.tlc.unlisten(TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
    this.tlc.setFps(value);
    this.tlc.listen(TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
  }

  /**
   * Set if the timeline should be collapsed.
   * @param {boolean} value
   */
  setCollapsed(value) {
    collapsed = value;
    this.scope['collapsed'] = collapsed;
    this.adjust();
  }

  /**
   * Handle histogram change event.
   *
   * @param {goog.events.Event} event
   */
  onHistogramChange(event) {
    this.updateHistograms_();
  }

  /**
   * Update timeline histograms.
   *
   * @private
   */
  updateHistograms_() {
    if (this.lastScaleOptions) { // draw scale even when histograms not presented
      var histograms = collapsed ?
        [] : this.histManager.getHistograms(this.lastScaleOptions);
      this['histData'] = histograms;
      if (this.moveWindowOnHistUpdate) {
        this.moveWindowToData();
      }
      ui.apply(this.scope);
    }
  }

  /**
   * Get the tooltip for histogram bins.
   *
   * @param {HistogramData} histogram
   * @param {Object.<string, *>} item
   * @return {string}
   * @export
   */
  getHistogramTooltip(histogram, item) {
    var tooltip = '';
    if (histogram && histogram.getTitle()) {
      tooltip += histogram.getTitle() + '<br>';
    }
    tooltip += 'Features: <span class="u-text-red">' + item['value'] + '</span>';
    return tooltip;
  }

  /**
   * Ensures that brushes match the current timeline state.
   *
   * @private
   */
  ensureBrushState_() {
    // Make sure we have the brush has  the current range, as its possiable
    // for the range to be changed after the control is created.
    this.onSliceRangeChanged_(null);
    this.onLoadRangeChanged_(null);
    this.onAnimationRangeChanged_(null);
    this.onHoldRangeChanged_(null);
  }

  /**
   * Take control of the timeline controller.
   */
  assumeControl() {
    if (!this.hasControl) {
      this.hasControl = true;
      // register timeline controller listeners
      this.tlc.listen(TimelineEventType.SHOW, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.RESET, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.PLAY, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.STOP, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.SLICE_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.ANIMATE_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.HOLD_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.listen(TimelineEventType.REFRESH_LOAD, this.refreshLoadBrushes_, false, this);
      // configure the timeline controller and save the current state for resets
      osTimeline.autoConfigureFromTimeRange(this.tlc);

      this.ensureBrushState_();

      this.moveWindowToData();
      this.savestate();
    }
  }

  /**
   * Release control of the timeline controller and return it back to the date control.
   */
  releaseControl() {
    // unregister timeline controller listeners
    if (this.hasControl) {
      this.hasControl = false;
      this.tlc.unlisten(TimelineEventType.SHOW, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.RESET, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.PLAY, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.STOP, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.FPS_CHANGE, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.SLICE_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.ANIMATE_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.HOLD_RANGE_CHANGED, this.onTimelineEvent, false, this);
      this.tlc.unlisten(TimelineEventType.REFRESH_LOAD, this.refreshLoadBrushes_, false, this);
    }
  }

  /**
   * Saves the current state of the timeline controller.
   */
  savestate() {
    this.tlcState_ = this.tlc.persist();
  }

  /**
   * Handle events from the timeline controller.
   *
   * @param {TimelineControllerEvent} event The event
   */
  onTimelineEvent(event) {
    this.updateTimeline();

    if (event.type === TimelineEventType.ANIMATE_RANGE_CHANGED) {
      this.onAnimationRangeChanged_(null);
    }

    if (event.type === TimelineEventType.HOLD_RANGE_CHANGED) {
      this.onHoldRangeChanged_(null);
    }

    if (event.type === TimelineEventType.SLICE_RANGE_CHANGED) {
      this.onSliceRangeChanged_(null);
    }

    if (event.type === TimelineEventType.RANGE_CHANGED) {
      this.onLoadRangeChanged_(null);
    }

    if (event.type === TimelineEventType.HOLD_RANGE_CHANGED ||
        event.type === TimelineEventType.SLICE_RANGE_CHANGED ||
        event.type === TimelineEventType.RANGE_CHANGED) {
      this.updateHistograms_();
    }

    ui.apply(this.scope);
  }

  /**
   * Updates the timeline UI state.
   *
   * @param {boolean=} opt_force Force a full update
   */
  updateTimeline(opt_force) {
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
          this['timeRange'] = new TimeRange(this.lastStart_ - buffer, this.lastEnd_ + buffer);

          // wait until rescale to update brushes or they won't be sized correctly
          this.updateBrushesOnScale = true;
        }
      }

      if (!this.updateBrushesOnScale) {
        this.updateBrushes();
      }

      this.inEvent = false;
    }
  }

  /**
   * Updates brushes from the timeline controller.
   */
  updateBrushes() {
    // set window
    var brush = /** @type {Brush} */ (this.getItem('window'));
    if (brush) {
      brush.setExtent([this.tlc.getCurrent() - this.tlc.getOffset(), this.tlc.getCurrent()], true);
    }

    // set loop
    brush = /** @type {Brush} */ (this.getItem('loop'));
    if (brush && !this.tlc.hasAnimationRanges()) {
      brush.setExtent([this.tlc.getLoopStart(), this.tlc.getLoopEnd()], true);
    }
  }

  /**
   * Gets a timeline item by ID
   *
   * @param {string} id The ID
   * @return {?ITimelineItem} The item or null if it could not be found
   */
  getItem(id) {
    var list = /** @type {!Array<ITimelineItem>} */ (this['items']);

    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].getId() == id) {
        return list[i];
      }
    }

    return null;
  }

  /**
   * Skip to the first frame.
   *
   * @export
   */
  firstFrame() {
    this.tlc.first();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.FIRST_FRAME, 1);
  }

  /**
   * Skip to the last frame.
   *
   * @export
   */
  lastFrame() {
    this.tlc.last();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.LAST_FRAME, 1);
  }

  /**
   * Step ahead one frame.
   *
   * @export
   */
  nextFrame() {
    this.tlc.next();
    this.tlc.clamp();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.NEXT_FRAME, 1);
  }

  /**
   * Step back one frame.
   *
   * @export
   */
  previousFrame() {
    this.tlc.prev();
    this.tlc.clamp();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.PREV_FRAME, 1);
  }

  /**
   * Resets the timeline controller back to the last saved state.
   *
   * @export
   */
  reset() {
    if (this.tlcState_) {
      this.tlc.reset(this.tlcState_);
      this.updateTimeline(true);
      Metrics.getInstance().updateMetric(metrics.keys.Timeline.RESET, 1);
      var refreshTimer = new Delay(this.refreshLoadBrushes_, 10, this);
      refreshTimer.start();
    }
  }

  /**
   * Start/stop timeline animation.
   *
   * @export
   */
  togglePlay() {
    this['playing'] = !this['playing'];

    if (this['playing']) {
      this.tlc.play();
    } else {
      this.tlc.stop();
    }
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.TOGGLE_PLAY, 1);
  }

  /**
   * Zoom in
   *
   * @export
   */
  zoomIn() {
    this.getTimelineCtrl().zoomIn();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.ZOOM_IN, 1);
  }

  /**
   * Zoom out
   *
   * @export
   */
  zoomOut() {
    this.getTimelineCtrl().zoomOut();
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.ZOOM_OUT, 1);
  }

  /**
   * Gets a reference to the timeline controller.
   *
   * @return {TimelineCtrl} The timeline controller
   */
  getTimelineCtrl() {
    return /** @type {TimelineCtrl} */ (this.element.find('.js-timeline').children().scope()['timeline']);
  }

  /**
   * Switch chart type between points and histogram
   *
   * @export
   */
  toggleChartType() {
    googArray.rotate(this.histClasses_, 1);

    var chartType = this.histClasses_[0];
    this['histClass'] = hist.CHART_TYPES[chartType];
    Settings.getInstance().set(['ui', 'timelineSettings', 'chartType'], chartType);

    var metricKey = metrics.keys.Timeline.CHART_TYPE + metrics.SUB_DELIMITER + chartType;
    Metrics.getInstance().updateMetric(metricKey, 1);
  }

  /**
   * @param {string} selector
   * @export
   */
  openMenu(selector) {
    var menu = this.menus_[selector];
    if (menu) {
      // clear the previous data actions
      var dataGroup = menu.getRoot().find('Data');
      asserts.assert(!!dataGroup, 'Group "Data" should exist!');
      dataGroup.children.length = menu === this.zoomMenu ? 1 : 0;

      // add data actions
      var histData = /** @type {?Array<!HistogramData>} */ (this['histData']);
      if (histData) {
        var prefix = menu === this.loadMenu ? 'load:' : 'zoom:';
        var tip = menu === this.loadMenu ? 'Zooms to and loads ' : 'Zooms to ';
        var sort = 100;

        for (var i = 0; i < histData.length; i++) {
          var hd = histData[i];
          var range = hd.getRange();
          var label = hd.getTitle();

          if (hd.getVisible() && Controller.isSafeRange(range)) {
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

      dispatcher.getInstance().listenOnce(GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);

      menu.open(undefined, {
        my: 'left bottom',
        at: 'left top',
        of: selector
      });
    }
  }

  /**
   * @param {goog.events.Event} evt
   * @protected
   */
  onMenuClose(evt) {
    this.scope['menu'] = null;
  }

  /**
   * Begins selection on the timeline
   *
   * @export
   */
  select() {
    this.scope['selecting'] = !this.scope['selecting'];
    angular.element('.brush-select .background').css('display', this.scope['selecting'] ? 'block' : 'none');
  }

  /**
   * Handles select brush active/inactive
   *
   * @param {goog.events.Event} e
   * @protected
   */
  onSelectChange(e) {
    this.scope['selecting'] = e.type == GoogEventType.DRAGSTART;
    ui.apply(this.scope);
  }

  /**
   * Handles removing a disposed animation brush
   *
   * @param {goog.events.Event} e
   * @private
   */
  animateBrushDeleted_(e) {
    var brush = /** @type {Brush} */ (e.currentTarget);
    this.tlc.removeAnimateRange(brush.getRange());
  }

  /**
   * Handler for brush property changes.
   *
   * @param {os.events.PropertyChangeEvent} e
   * @private
   */
  animateBrushPropertyChanged_(e) {
    if (e.getProperty() === 'extent') {
      var newExt = e.getNewValue();
      var oldExt = e.getOldValue();
      this.tlc.updateAnimateRange(new Range(newExt[0], newExt[1]), new Range(oldExt[0], oldExt[1]));
    }
  }

  /**
   * Handles removing a disposed slice brush
   *
   * @param {goog.events.Event} e
   * @private
   */
  sliceBrushDeleted_(e) {
    var brush = /** @type {Brush} */ (e.currentTarget);
    this.tlc.removeSliceRange(brush.getRange());
  }

  /**
   * Handler for brush property changes.
   *
   * @param {os.events.PropertyChangeEvent} e
   * @private
   */
  sliceBrushPropertyChanged_(e) {
    if (e.getProperty() === 'extent') {
      var newEx = e.getNewValue();
      var oldEx = e.getOldValue();
      if (!this.tlc.updateSliceRange(new Range(newEx[0], newEx[1]), new Range(oldEx[0], oldEx[1]))) {
        e.target.setExtent(oldEx);
      }
    }
  }

  /**
   * Handles removing a disposed load brush
   *
   * @param {goog.events.Event} e
   * @private
   */
  loadBrushDeleted_(e) {
    var brush = /** @type {Brush} */ (e.currentTarget);
    this.tlc.removeLoadRange(brush.getRange());
  }

  /**
   * Handler for brush property changes.
   *
   * @param {os.events.PropertyChangeEvent} e
   * @private
   */
  loadBrushPropertyChanged_(e) {
    if (e.getProperty() === 'extent') {
      var newExt = e.getNewValue();
      var oldExt = e.getOldValue();
      this.tlc.updateLoadRange(new Range(newExt[0], newExt[1]), new Range(oldExt[0], oldExt[1]));
    }
  }

  /**
   * Creates a timeline slice brush.
   *
   * @param {Range} range
   * @return {Brush}
   */
  getSliceBrush(range) {
    var brush = new Brush();
    brush.setId('slice-' + googString.createUniqueString());
    brush.setSilentDrag(true);
    brush.setEventType(BrushEventType.BRUSH_END);
    brush.setClass('slice');
    brush.setToolTip('The slice range');
    brush.canDelete = true;
    brush.drawFlagCheck = drawFlagCheck;
    brush.setExtent([range.start, range.end]);
    brush.listen('deleted', this.sliceBrushDeleted_.bind(this));
    brush.listen(GoogEventType.PROPERTYCHANGE, this.sliceBrushPropertyChanged_.bind(this));
    return brush;
  }

  /**
   * Creates a timeline load brush.
   *
   * @param {Range} range
   * @return {Brush}
   */
  getLoadBrush(range) {
    var brush = new Brush();
    if (this.tlc.hasSliceRanges()) {
      brush.setId('considered-' + googString.createUniqueString());
      brush.setClass('considered');
    } else {
      brush.setId('load-' + googString.createUniqueString());
      brush.setClass('load');
    }
    brush.setToolTip('The load range');
    brush.setSilentDrag(true);
    brush.setEventType(BrushEventType.BRUSH_END);
    brush.canDelete = this.tlc.getLoadRanges().length > 1;
    brush.drawFlagCheck = drawFlagCheck;
    brush.setExtent([range.start, range.end]);
    brush.listen('deleted', this.loadBrushDeleted_.bind(this));
    brush.listen(GoogEventType.PROPERTYCHANGE, this.loadBrushPropertyChanged_.bind(this));
    return brush;
  }

  /**
   * Creates a timeline animate brush.
   *
   * @param {Range} range
   * @return {Brush}
   */
  getAnimateBrush(range) {
    var brush = new Brush();
    brush.setId('loop-' + googString.createUniqueString());
    brush.setSilentDrag(true);
    brush.setEventType(BrushEventType.BRUSH_END);
    brush.setToolTip('The playback loop');
    brush.canDelete = true;
    brush.drawFlagCheck = drawFlagCheck;
    brush.setExtent([range.start, range.end]);
    brush.listen('deleted', this.animateBrushDeleted_.bind(this));
    brush.listen(GoogEventType.PROPERTYCHANGE, this.animateBrushPropertyChanged_.bind(this));
    return brush;
  }

  /**
   * Creates a timeline hold brush.
   *
   * @param {Range} range
   * @return {Brush}
   */
  getHoldBrush(range) {
    var brush = new Brush();
    brush.setId('loop-' + googString.createUniqueString());
    brush.setSilentDrag(true);
    brush.setEventType(BrushEventType.BRUSH_END);
    brush.setClass('hold');
    brush.setToolTip('The hold range');
    brush.canDelete = true;
    brush.drawFlagCheck = drawFlagCheck;
    brush.setExtent([range.start, range.end]);
    brush.listen('deleted', this.holdBrushDeleted_.bind(this));
    brush.listen(GoogEventType.PROPERTYCHANGE, this.holdBrushPropertyChanged_.bind(this));
    return brush;
  }

  /**
   * Adds a slice brush from range
   *
   * @param {Range} range
   */
  addSliceBrush(range) {
    // Add a new slice ?
    var current = this['sliceBrushes'];
    var brush = this.getSliceBrush(range);
    current.push(brush);
    this['sliceBrushes'] = current.splice(0);
    this.tlc.addSliceRange(range);
  }

  /**
   * Adds a load brush from range
   *
   * @param {Range} range
   */
  addLoadBrush(range) {
    // Add a new load ?
    var current = this['loadBrushes'];
    var brush = this.getLoadBrush(range);
    current.push(brush);
    this['loadBrushes'] = current.splice(0);
    this.tlc.addLoadRange(range);
  }

  /**
   * Adds a animation brush from range
   *
   * @param {Range} range
   */
  addAnimateBrush(range) {
    // Add a new animate ?
    var current = this['animationBrushes'];
    var brush = this.getAnimateBrush(range);
    current.push(brush);
    this['animationBrushes'] = current.splice(0);
    this.tlc.addAnimateRange(range);
  }

  /**
   * Adds a hold brush from range
   *
   * @param {Range} range
   */
  addHoldBrush(range) {
    // Add a new hold ?
    var current = this['holdBrushes'];
    var brush = this.getHoldBrush(range);
    current.push(brush);
    this['holdBrushes'] = current.splice(0);
    this.tlc.addHoldRange(range);
  }

  /**
   * Consoldated method for handling timeline brush changes.
   *
   * @param {Array<!Brush>} brushCollection
   * @param {Array<!Range>} ranges
   * @param {function(goog.math.Range): Brush} getBrushFunction
   * @return {Array<!Brush>} new collection of brushes
   * @private
   */
  processTimelineRangeChanged_(brushCollection, ranges, getBrushFunction) {
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
  }

  /**
   * Quietly deletes all of the brushes and reloads them
   *
   * @private
   */
  refreshLoadBrushes_() {
    this.refreshBrushSet_(this['loadBrushes'], this.onLoadRangeChanged_.bind(this));
  }

  /**
   * Quietly deletes all of the brushes and reloads them
   *
   * @protected
   */
  refreshAllBrushes() {
    this.refreshLoadBrushes_();
    this.refreshBrushSet_(this['sliceBrushes'], this.onSliceRangeChanged_.bind(this));
    this.refreshBrushSet_(this['holdBrushes'], this.onHoldRangeChanged_.bind(this));
    this.refreshBrushSet_(this['animationBrushes'], this.onAnimationRangeChanged_.bind(this));
  }

  /**
   * Quietly deletes all of the brushes and reloads them
   *
   * @param {?Array<!Brush>} brushes
   * @param {function(goog.events.Event)} brushChangedCallback
   * @private
   */
  refreshBrushSet_(brushes, brushChangedCallback) {
    for (var i = 0; i < brushes.length; i++) {
      brushes[i].deleteBrush(true);
    }
    brushChangedCallback(null);
  }

  /**
   * Handler for changes to the timeline controllers load range change events
   * which are fired when animation ranges change.
   *
   * @param {goog.events.Event} e
   * @private
   */
  onSliceRangeChanged_(e) {
    this['sliceBrushes'] = this.processTimelineRangeChanged_(this['sliceBrushes'],
        this.tlc.getEffectiveSliceRanges(), this.getSliceBrush.bind(this));
  }

  /**
   * Handler for changes to the timeline controllers load range change events
   * which are fired when animation ranges change.
   *
   * @param {goog.events.Event} e
   * @private
   */
  onLoadRangeChanged_(e) {
    this['loadBrushes'] = this.processTimelineRangeChanged_(this['loadBrushes'],
        this.tlc.getLoadRanges(), this.getLoadBrush.bind(this));
  }

  /**
   * Handler for changes to the timeline controllers animation range change events
   * which are fired when animation ranges change.
   *
   * @param {goog.events.Event} e
   * @private
   */
  onAnimationRangeChanged_(e) {
    this['animationBrushes'] = this.processTimelineRangeChanged_(this['animationBrushes'],
        this.tlc.getAnimationRanges(), this.getAnimateBrush.bind(this));
  }

  /**
   * Handler for changes to the timeline controllers hold range change events
   * which are fired when animation ranges change.
   *
   * @param {goog.events.Event} e
   * @private
   */
  onHoldRangeChanged_(e) {
    this['holdBrushes'] = this.processTimelineRangeChanged_(this['holdBrushes'],
        this.tlc.getHoldRanges(), this.getHoldBrush.bind(this));
  }

  /**
   * Handles removing a disposed hold brush
   *
   * @param {goog.events.Event} e
   * @private
   */
  holdBrushDeleted_(e) {
    var brush = /** @type {Brush} */ (e.currentTarget);
    this.tlc.removeHoldRange(brush.getRange());
  }

  /**
   * Handler for hold brush property changes.
   *
   * @param {os.events.PropertyChangeEvent} e
   * @private
   */
  holdBrushPropertyChanged_(e) {
    if (e.getProperty() === 'extent') {
      var newExt = e.getNewValue();
      var oldExt = e.getOldValue();
      this.tlc.updateHoldRange(new Range(newExt[0], newExt[1]), new Range(oldExt[0], oldExt[1]));
    }
  }

  /**
   * Creates the timeline menus.
   *
   * @protected
   */
  initMenus() {
    if (!this.loadMenu) {
      this.loadMenu = new Menu(new MenuItem({
        type: MenuItemType.ROOT,
        children: [{
          type: MenuItemType.GROUP,
          label: 'Load',
          sort: 0
        }, {
          type: MenuItemType.GROUP,
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
          type: MenuItemType.GROUP,
          label: 'Data',
          children: [],
          sort: 20
        }]
      }));

      this.initMenu(this.loadMenu, 'load:', 'Load', 'Zooms to and loads ');
    }

    if (!this.zoomMenu) {
      this.zoomMenu = new Menu(new MenuItem({
        type: MenuItemType.ROOT,
        children: [{
          type: MenuItemType.GROUP,
          label: 'Zoom To',
          sort: 0
        }, {
          type: MenuItemType.GROUP,
          label: 'Ranges',
          sort: 10,
          children: [{
            eventType: 'zoom:item.load',
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
          type: MenuItemType.GROUP,
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
  }

  /**
   * @param {!Menu} menu The menu.
   * @param {string} prefix The event type prefix.
   * @param {string} type
   * @param {string} tip
   * @protected
   */
  initMenu(menu, prefix, type, tip) {
    var root = menu.getRoot();
    var group = root.find(type);
    asserts.assert(!!group, 'Timeline menu group "' + type + '" should exist!');

    var ranges = Ranges;
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
  }

  /**
   * Handle menu events.
   *
   * @param {MenuEvent} event The menu event.
   * @protected
   */
  onMenuEvent(event) {
    var parts = event.type.split(':');
    var type = parts[0];
    var rangeText = parts[1];
    var begin;
    var end;
    var doOffset = true;

    // get a reference to the timeline
    var timeline = angular.element('.c-svg-timeline').scope()['timeline'];
    var histData = /** @type {?Array<!HistogramData>} */ (this['histData']);

    switch (rangeText) {
      case Ranges.TODAY:
        begin = osTime.floor(new Date(), 'day');
        end = osTime.ceil(new Date(), 'day');
        break;
      case Ranges.YESTERDAY:
        begin = osTime.floor(new Date(), 'day');
        end = osTime.ceil(new Date(), 'day');
        begin.setUTCDate(begin.getUTCDate() - 1);
        end.setUTCDate(end.getUTCDate() - 1);
        break;
      case Ranges.THISWEEK:
        begin = osTime.floor(new Date(), 'week');
        end = osTime.ceil(new Date(), 'week');
        break;
      case Ranges.LASTWEEK:
        begin = osTime.floor(new Date(), 'week');
        end = osTime.ceil(new Date(), 'week');
        begin.setUTCDate(begin.getUTCDate() - 7);
        end.setUTCDate(end.getUTCDate() - 7);
        break;
      case Ranges.THISMONTH:
        begin = osTime.floor(new Date(), 'month');
        end = osTime.ceil(new Date(), 'month');
        break;
      case Ranges.LAST30:
        end = osTime.ceil(new Date(), 'day');
        begin = osTime.offset(end, 'day', -30);
        break;
      case Ranges.LAST60:
        end = osTime.ceil(new Date(), 'day');
        begin = osTime.offset(end, 'day', -60);
        break;
      case Ranges.LAST90:
        end = osTime.ceil(new Date(), 'day');
        begin = osTime.offset(end, 'day', -90);
        break;
      case Ranges.THISYEAR:
        begin = osTime.floor(new Date(), 'year');
        end = osTime.ceil(new Date(), 'year');
        break;
      case 'All Data':
        if (histData) {
          // all data
          var min = Number.POSITIVE_INFINITY;
          var max = Number.NEGATIVE_INFINITY;

          for (var i = 0, n = histData.length; i < n; i++) {
            var range = histData[i].getRange();

            if (Controller.isSafeRange(range)) {
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
            var extent = timelineUi.normalizeExtent([range.start, range.end]);
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

    if (begin !== undefined && end !== undefined) {
      if (doOffset) {
        begin.setTime(begin.getTime() - osTime.getTimeOffset());
        end.setTime(end.getTime() - osTime.getTimeOffset());
      }

      var item = timeline.getItem('window');
      if (item) {
        var s = begin.getTime();
        var e = end.getTime();

        timeline.zoomToExtent([s, e]);

        if (type == 'load') {
          this.tlc.setRange(this.tlc.buildRange(s, e));
          osTimeline.autoConfigureFromTimeRange(this.tlc);
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
  }

  /**
   * Handle keyboard events
   *
   * @param {KeyEvent} event
   * @protected
   */
  onKey(event) {
    var ctrl = this.getTimelineCtrl();

    if (ctrl) {
      switch (event.keyCode) {
        case KeyCodes.PAGE_UP:
        case KeyCodes.UP:
          event.stopPropagation();
          ctrl.zoomIn();
          break;
        case KeyCodes.PAGE_DOWN:
        case KeyCodes.DOWN:
          event.stopPropagation();
          ctrl.zoomOut();
          break;
        case KeyCodes.LEFT:
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
        case KeyCodes.RIGHT:
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
        case KeyCodes.SPACE:
          event.stopPropagation();
          this.togglePlay();
          break;
        default:
          break;
      }
    }
  }

  /**
   * @protected
   */
  moveWindowToData() {
    var histData = /** @type {?Array<!HistogramData>} */ (this['histData']);
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
  }

  /**
   * Closes the timeline by sending a UI toggle event. This event must be listened for by the timeline's container
   * which should hide/destroy the timeline.
   *
   * @export
   */
  close() {
    this.tlc.clearAnimateRanges();
    this.tlc.clearHoldRanges();
    var event = new UIEvent(UIEventType.TOGGLE_UI, 'timeline');
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * Toggles the expanded/collapsed (normal vs. ribbon) view of the timeline
   *
   * @export
   */
  toggleCollapse() {
    this.setCollapsed(!collapsed);
  }

  /**
   * Modifies the timeline DOM and resets the SVG state.
   */
  adjust() {
    var ctrl = this.getTimelineCtrl();
    var timelineContainerEl = this.element.find('.js-timeline-panel');
    var timelineEl = timelineContainerEl.find('.js-timeline');

    if (collapsed) {
      timelineContainerEl.removeClass('c-timeline-panel__expanded');
      timelineContainerEl.addClass('c-timeline-panel__collapsed');
      timelineEl.removeClass('c-timeline__expanded');
      timelineEl.addClass('c-timeline__collapsed');
    } else {
      timelineContainerEl.removeClass('c-timeline-panel__collapsed');
      timelineContainerEl.addClass('c-timeline-panel__expanded');
      timelineEl.removeClass('c-timeline__collapsed');
      timelineEl.addClass('c-timeline__expanded');
    }

    ui.injector.get('$timeout')(function() {
      // the inner timeline SVG doesn't resize correctly without this slight delay for some reason
      ctrl.initSvg();
      this.refreshAllBrushes();
    }.bind(this), 100);
  }

  /**
   * Record animation
   *
   * @export
   */
  record() {
    // stop animating prior to trying to record for sanity's sake
    if (this.tlc.isPlaying()) {
      this.tlc.stop();
    }
    dispatcher.getInstance().dispatchEvent(TimelineEventType.RECORD);
    Metrics.getInstance().updateMetric(metrics.keys.Timeline.RECORD, 1);
  }

  /**
   * @param {TimeRange} range
   * @return {boolean} Whether the range is safe to use for pan/zoom
   */
  static isSafeRange(range) {
    return !!range && range.getStart() != osTime.TimeInstant.MIN_TIME &&
        range.getEnd() != osTime.TimeInstant.MAX_TIME &&
        !isNaN(range.getStart()) && !isNaN(range.getEnd()) &&
        !(range.getStart() == 0 && range.getEnd() == 0);
  }
}


/**
 * @type {Array<number>}
 */
const fpsValues = [0.5, 1, 2, 4, 6, 8, 18, 24, 30];


/**
 * @type {boolean}
 */
let collapsed = false;


/**
 * Whether or not to draw "flags" on brushes.
 * @return {boolean}
 */
const drawFlagCheck = () => !collapsed;


/**
 * @type {Array<{diff: number, format: string}>}
 */
const labelFormats = [{
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
 * @enum {string}
 */
const Ranges = {
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


exports = Controller;
