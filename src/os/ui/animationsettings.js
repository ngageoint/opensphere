goog.provide('os.ui.AnimationSettingsCtrl');
goog.provide('os.ui.animationSettingsDirective');

goog.require('goog.events.KeyHandler');
goog.require('goog.math.Range');
goog.require('os.defines');
goog.require('os.metrics.Metrics');
goog.require('os.time');
goog.require('os.time.TimelineController');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.dateTimeDirective');
goog.require('os.ui.popover.popoverDirective');


/**
 * The animation settings window directive
 * @return {angular.Directive}
 */
os.ui.animationSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/animationsettings.html',
    controller: os.ui.AnimationSettingsCtrl,
    controllerAs: 'animationCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('animationsettings', [os.ui.animationSettingsDirective]);



/**
 * Controller for the animation settings dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.AnimationSettingsCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?Date}
   * @protected
   */
  this.loadStart = null;

  /**
   * @type {?Date}
   * @protected
   */
  this.loadEnd = null;

  /**
   * @type {?Date}
   * @protected
   */
  this.loopStart = null;

  /**
   * @type {?Date}
   * @protected
   */
  this.loopEnd = null;

  this.populate();

  $scope.$watch('loopStart', this.onLoopDatesChange.bind(this));
  $scope.$watch('loopEnd', this.onLoopDatesChange.bind(this));
  $scope.$on('$destroy', this.onDestroy.bind(this));

  $scope['loopRangeTip'] = 'The time range used to animate data.';
  $scope['tilesTip'] = 'The size of each tile frame.';
  $scope['windowTip'] = 'The size of the blue active window.';
  $scope['skipTip'] = 'The amount of time that the active window skips forward or back with each frame.';
  $scope['fadeTip'] = 'Fade in/out features based on the size of your timeline window and scroll direction.';

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);

  this.scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Clean up
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.onDestroy = function() {
  goog.dispose(this.keyHandler_);

  this.element = null;
  this.loadStart = null;
  this.loadEnd = null;
  this.loopStart = null;
  this.loopEnd = null;
  this.scope = null;
  this.element = null;
};


/**
 * @type {boolean}
 * @protected
 */
os.ui.AnimationSettingsCtrl.autoConfigure = true;


/**
 * @type {Array<{label: string, value: number}>}
 * @const
 */
os.ui.AnimationSettingsCtrl.UNITS = [{
  label: 'ms',
  value: 1
}, {
  label: 'secs',
  value: 1000
}, {
  label: 'mins',
  value: 60 * 1000
}, {
  label: 'hrs',
  value: 60 * 60 * 1000
}, {
  label: 'days',
  value: 24 * 60 * 60 * 1000
}, {
  label: 'weeks',
  value: 7 * 24 * 60 * 60 * 1000
}];


/**
 * Populates the inital form values from the animation controller
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.populate = function() {
  var tlc = os.time.TimelineController.getInstance();

  this.loadStart = new Date(tlc.getStart() + os.time.timeOffset);
  this.loadEnd = new Date(tlc.getEnd() + os.time.timeOffset);
  this.scope['autoConfig'] = os.ui.AnimationSettingsCtrl.autoConfigure;

  // if no animation ranges are defined, the loop is equal to the loaded range
  this.scope['autoLoop'] = !tlc.hasAnimationRanges();

  if (this.scope['autoLoop']) {
    this.scope['loopStart'] = this.loopStart = this.loadStart;
    this.scope['loopEnd'] = this.loopEnd = this.loadEnd;
  } else {
    this.scope['loopStart'] = this.loopStart = new Date(tlc.getLoopStart() + os.time.timeOffset);
    this.scope['loopEnd'] = this.loopEnd = new Date(tlc.getLoopEnd() + os.time.timeOffset);
  }

  this.detectUnits(this.scope, tlc.getOffset(), tlc.getSkip());
  this.autoConfigure();

  this.scope['duration'] = tlc.getDuration();
  this.scope['durations'] = ['day', 'week', 'month', 'year'];
  this.scope['units'] = os.ui.AnimationSettingsCtrl.UNITS;
  this.scope['fade'] = tlc.getFade();
};


/**
 * If there is a conflict that will change manually defined animation ranges.
 * @return {boolean}
 */
os.ui.AnimationSettingsCtrl.prototype.hasMultipleRanges = function() {
  var tlc = os.time.TimelineController.getInstance();
  return tlc.getAnimationRanges().length > 1;
};
goog.exportProperty(
    os.ui.AnimationSettingsCtrl.prototype,
    'hasMultipleRanges',
    os.ui.AnimationSettingsCtrl.prototype.hasMultipleRanges);


/**
 * Handles changes to loop dates
 * @param {Date} newValue
 * @param {Date} oldValue
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.onLoopDatesChange = function(newValue, oldValue) {
  if (goog.isString(this.scope['loopStart'])) {
    this.loopStart = os.time.parse(this.scope['loopStart'], null, true);
  }

  if (goog.isString(this.scope['loopEnd'])) {
    this.loopEnd = os.time.parse(this.scope['loopEnd'], null, true);
  }

  this.autoConfigure();
};


/**
 * Sets the auto configuration
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.autoConfigure = function() {
  if (this.scope['autoConfig']) {
    var tlc = os.time.TimelineController.getInstance();
    var diff = tlc.getSmallestAnimateRangeLength();

    if (diff >= 28 * os.time.timeline.DAY - 30 * os.time.timeline.MIN) {
      this.setTileAnimation(7 * os.time.timeline.DAY, os.time.Duration.WEEK);
    } else if (diff >= 5 * os.time.timeline.DAY - 30 * os.time.timeline.MIN) {
      this.setTileAnimation(os.time.timeline.DAY, os.time.Duration.DAY);
    } else {
      var offset = os.ui.timeline.TimelineCtrl.getSnap(diff / 24);
      var viewsize = tlc.getRange().getLength();
      if (offset < viewsize / 24) {
        offset = Math.min(diff / 2, viewsize / 24);
      }
      this.scope['duration'] = os.time.Duration.DAY;
      this.detectUnits(this.scope, offset, offset / 2);
    }
  }
};
goog.exportProperty(os.ui.AnimationSettingsCtrl.prototype, 'onAutoChange',
    os.ui.AnimationSettingsCtrl.prototype.autoConfigure);


/**
 * @param {Object<string, *>} obj
 * @param {number} win
 * @param {number} skip
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.detectUnits = function(obj, win, skip) {
  var units = os.ui.AnimationSettingsCtrl.UNITS;
  for (var i = 0, n = units.length; i < n; i++) {
    if (win % units[i].value === 0) {
      obj['windowUnit'] = units[i];
      obj['window'] = win / units[i].value;
    }

    if (skip % units[i].value === 0) {
      obj['skipUnit'] = units[i];
      obj['skip'] = skip / units[i].value;
    }
  }
};


/**
 * @param {number} offset
 * @param {string} duration
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.setTileAnimation = function(offset, duration) {
  this.scope['duration'] = duration;
  this.detectUnits(this.scope, offset, offset);
};


/**
 * @return {Date} The load start date
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.getLoadStart = function() {
  var start = this.loadStart;
  var end = this.loadEnd;
  return start.getTime() < end.getTime() ? start : end;
};


/**
 * @return {Date} The load end date
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.getLoadEnd = function() {
  var start = this.loadStart;
  var end = this.loadEnd;
  return start.getTime() < end.getTime() ? end : start;
};


/**
 * @return {Date} The loop start date
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.getLoopStart = function() {
  var start = this.loopStart;
  var end = this.loopEnd;
  return start.getTime() < end.getTime() ? start : end;
};


/**
 * @return {Date} The loop end date
 * @protected
 */
os.ui.AnimationSettingsCtrl.prototype.getLoopEnd = function() {
  var start = this.loopStart;
  var end = this.loopEnd;
  return start.getTime() < end.getTime() ? end : start;
};


/**
 * Apply the settings
 */
os.ui.AnimationSettingsCtrl.prototype.accept = function() {
  var tlc = os.time.TimelineController.getInstance();

  if (this.scope['fade'] != tlc.getFade()) {
    // turn fade on/off (this will reset feature opacity if needed)
    tlc.setFade(this.scope['fade']);
  }

  // TODO animation ranges

  // always clear animate ranges on save
  tlc.clearAnimateRanges();

  // if a manual range was provided, set it now
  if (!this.scope['autoLoop']) {
    var loopStart = this.loopStart.getTime() - os.time.timeOffset;
    var loopEnd = this.loopEnd.getTime() - os.time.timeOffset;
    if (loopStart != loopEnd) {
      // only add the range if the start/end aren't equal
      var range = new goog.math.Range(loopStart, loopEnd);
      tlc.addAnimateRange(range);
    }
  }

  // do window/skip
  os.ui.AnimationSettingsCtrl.autoConfigure = this.scope['autoConfig'];

  tlc.setOffset(this.scope['window'] * this.scope['windowUnit']['value']);
  tlc.setSkip(this.scope['skip'] * this.scope['skipUnit']['value']);
  tlc.setDuration(this.scope['duration']);

  tlc.setCurrent(tlc.getLoopStart() + tlc.getOffset());

  // move the view
  /** @type {os.ui.timeline.TimelineCtrl} */ (this.scope['timeline']).zoomToExtent([tlc.getStart(), tlc.getEnd()]);
  this.cancel();
};
goog.exportProperty(os.ui.AnimationSettingsCtrl.prototype, 'accept', os.ui.AnimationSettingsCtrl.prototype.accept);


/**
 * Cancel/Close
 */
os.ui.AnimationSettingsCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.AnimationSettingsCtrl.prototype, 'cancel', os.ui.AnimationSettingsCtrl.prototype.cancel);


/**
 * Handles the ui fade checkbox toggle
 */
os.ui.AnimationSettingsCtrl.prototype.onFadeChange = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.FADE, 1);
};
goog.exportProperty(os.ui.AnimationSettingsCtrl.prototype, 'onFadeChange',
    os.ui.AnimationSettingsCtrl.prototype.onFadeChange);


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.AnimationSettingsCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  } else if (event.keyCode == goog.events.KeyCodes.ENTER) {
    this.accept();
  }
};
