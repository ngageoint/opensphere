goog.provide('os.ui.TimeSettingsCtrl');
goog.provide('os.ui.timeSettingsDirective');

goog.require('goog.events.KeyHandler');
goog.require('goog.math.Range');
goog.require('goog.math.RangeSet');
goog.require('os.defines');
goog.require('os.metrics.Metrics');
goog.require('os.time');
goog.require('os.time.TimelineController');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.dateTimeDirective');
goog.require('os.ui.popover.popoverDirective');
goog.require('os.ui.spinnerDirective');


/**
 * The timeline settings window directive
 * @return {angular.Directive}
 */
os.ui.timeSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/time.html',
    controller: os.ui.TimeSettingsCtrl,
    controllerAs: 'timeCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('timesettings', [os.ui.timeSettingsDirective]);



/**
 * Controller for the timeline settings dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.TimeSettingsCtrl = function($scope, $element) {
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

  this.populate();
  this.scope.$on('$destroy', this.onDestroy.bind(this));
  this.scope['loadStartTip'] = 'The start of a time range used to load data.';
  this.scope['loadEndTip'] = 'The end of a time range used to load data.';
  this.scope['sliceTip'] = 'A time range less than 24 hours to show data from each loaded day.';
  this.scope['sliceStartTip'] = 'The start of a slice used to load data. Start can be later than end if it crosses ' +
      'midnight.';
  this.scope['sliceEndTip'] = 'The end of a slice used to load data.';
  this.scope['offsetTip'] = 'All times will be shown with this offset (or time zone).';
  this.scope['sliceModels'] = {};

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
os.ui.TimeSettingsCtrl.prototype.onDestroy = function() {
  goog.dispose(this.keyHandler_);
  this.element = null;
  this.scope = null;
};


/**
 * Populates the inital form values from the timeline controller
 * @protected
 */
os.ui.TimeSettingsCtrl.prototype.populate = function() {
  var tlc = os.time.TimelineController.getInstance();

  this.scope['offset'] = 'UTC' + (os.time.timeOffsetLabel == 'Z' ? '+0000' : os.time.timeOffsetLabel);
  this.scope['loadRanges'] = this.fromRangesToDates(tlc.getLoadRanges());
  this.scope['sliceRanges'] = this.fromSlicesToHMS(tlc.getSliceRanges());
};


/**
 * Apply the settings
 */
os.ui.TimeSettingsCtrl.prototype.accept = function() {
  var tlc = os.time.TimelineController.getInstance();

  // do offset
  os.time.applyOffset(this.scope['offset']);

  var sr = this.scope['sliceRanges'];
  var rangeSet = new goog.math.RangeSet();
  for (var i = 0; i < sr.length; i++) {
    var start = sr[i]['start']['hours'] * 3600000 + sr[i]['start']['mins'] * 60000 + sr[i]['start']['secs'] * 1000;
    var end = sr[i]['end']['hours'] * 3600000 + sr[i]['end']['mins'] * 60000 + sr[i]['end']['secs'] * 1000;
    if (start > end) { // make 2 slices if it crosses midnight
      rangeSet.add(tlc.buildRange(0, end));
      end = 86400000;
    }
    rangeSet.add(tlc.buildRange(start, end)); // combines overlapping ranges
  }
  tlc.setSliceRanges(rangeSet);

  var loadRanges = this.scope['loadRanges'];
  if (loadRanges.length > 0) {
    var loadSet = new goog.math.RangeSet();
    tlc.clearLoadRanges();
    for (var i = 0; i < loadRanges.length; i++) {
      var start = this.timeFromField(loadRanges[i].start);
      var end = this.timeFromField(loadRanges[i].end);
      var first = start;
      var last = end;
      if (start > end) {
        first = end;
        last = start;
      }
      loadSet.add(tlc.buildRange(first, last)); // combines overlapping ranges!
    }
    tlc.setLoadRanges(loadSet);
    tlc.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Timeline.TIME_RANGE, 1);

  // move the view
  /** @type {os.ui.timeline.TimelineCtrl} */ (this.scope['timeline']).zoomToExtent([tlc.getStart(), tlc.getEnd()]);
  this.cancel();
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'accept', os.ui.TimeSettingsCtrl.prototype.accept);


/**
 * Cancel/Close
 */
os.ui.TimeSettingsCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'cancel', os.ui.TimeSettingsCtrl.prototype.cancel);


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.TimeSettingsCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  } else if (event.keyCode == goog.events.KeyCodes.ENTER) {
    this.accept();
  }
};


/**
 * Add a slice
 * @param {Object=} opt_slice
 * @param {boolean=} opt_crossesMidnight
 */
os.ui.TimeSettingsCtrl.prototype.addSlice = function(opt_slice, opt_crossesMidnight) {
  var slice = {'start': {'hours': 0, 'mins': 0, 'secs': 0}, 'end': {'hours': 1, 'mins': 0, 'secs': 0}};
  if (opt_slice) {
    slice = {
      'start': {
        'hours': opt_slice['start']['hours'],
        'mins': opt_slice['start']['mins'],
        'secs': opt_slice['start']['secs']
      },
      'end': {
        'hours': opt_slice['end']['hours'],
        'mins': opt_slice['end']['mins'],
        'secs': opt_slice['end']['secs']
      }
    };
  }
  this.scope['sliceRanges'].push(slice);
  this.scope['sliceModels'][this.scope['sliceRanges'].length - 1] = (opt_crossesMidnight ? opt_crossesMidnight : false);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'addSlice', os.ui.TimeSettingsCtrl.prototype.addSlice);


/**
 * Remove a slice
 * @param {number} index
 */
os.ui.TimeSettingsCtrl.prototype.removeSlice = function(index) {
  this.scope['sliceRanges'].splice(index, 1);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'removeSlice', os.ui.TimeSettingsCtrl.prototype.removeSlice);


/**
 * Add a load range
 * @param {Object} range
 */
os.ui.TimeSettingsCtrl.prototype.addRange = function(range) {
  this.scope['loadRanges'].push({'start': range.start, 'end': range.end});
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'addRange', os.ui.TimeSettingsCtrl.prototype.addRange);


/**
 * Remove a load range
 * @param {number} index
 */
os.ui.TimeSettingsCtrl.prototype.removeRange = function(index) {
  this.scope['loadRanges'].splice(index, 1);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'removeRange', os.ui.TimeSettingsCtrl.prototype.removeRange);


/**
 * @param {!Array<goog.math.Range>} ranges
 * @return {Array<Object>}
 * @protected
 */
os.ui.TimeSettingsCtrl.prototype.fromRangesToDates = function(ranges) {
  var dates = /** @type {Array<Object>}  */ ([]);
  for (var i = 0; i < ranges.length; i++) {
    dates.push({
      'start': (new Date(ranges[i].start + os.time.timeOffset)).toISOString(),
      'end': (new Date(ranges[i].end + os.time.timeOffset)).toISOString()
    });
  }
  return dates;
};


/**
 * @param {!Array<goog.math.Range>} ranges
 * @return {Array<Object>}
 * @protected
 */
os.ui.TimeSettingsCtrl.prototype.fromSlicesToHMS = function(ranges) {
  var dates = /** @type {Array<Object>}  */ ([]);
  for (var i = 0; i < ranges.length; i++) {
    if (ranges[i].end == 86400000) { // subtract a second so it displays correctly
      ranges[i].end = 86399000;
    }
    dates.push({
      'start': {
        'hours': Math.floor(ranges[i].start / 3600000),
        'mins': Math.floor(ranges[i].start / 60000) % 60,
        'secs': Math.floor(ranges[i].start / 1000) % 60
      },
      'end': {
        'hours': Math.floor(ranges[i].end / 3600000),
        'mins': Math.floor(ranges[i].end / 60000) % 60,
        'secs': Math.floor(ranges[i].end / 1000) % 60
      }
    });
  }
  return dates;
};


/**
 * translates timestring into time number
 * @param {string|Date} field
 * @return {number}
 * @protected
 */
os.ui.TimeSettingsCtrl.prototype.timeFromField = function(field) {
  return (goog.isString(field) ? os.time.parse(field, null, true) : field).getTime() - os.time.timeOffset;
};


/**
 * Checks for valid
 * @return {boolean}
 */
os.ui.TimeSettingsCtrl.prototype.valid = function() {
  var sr = this.scope['sliceRanges'];
  for (var i = 0; i < sr.length; i++) {
    var start = sr[i]['start']['hours'] * 3600000 + sr[i]['start']['mins'] * 60000 + sr[i]['start']['secs'] * 1000;
    var end = sr[i]['end']['hours'] * 3600000 + sr[i]['end']['mins'] * 60000 + sr[i]['end']['secs'] * 1000;
    if (start > end && !this.scope['sliceModels'][i]) {
      return false;
    }
  }

  var loadRanges = this.scope['loadRanges'];
  for (var i = 0; i < loadRanges.length; i++) {
    var start = this.timeFromField(loadRanges[i].start);
    var end = this.timeFromField(loadRanges[i].end);
    if (start >= end) {
      return false;
    }
  }

  return true;
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'valid', os.ui.TimeSettingsCtrl.prototype.valid);


/**
 * Checks for valid time range
 * @param {string} start
 * @param {string} end
 * @return {boolean}
 */
os.ui.TimeSettingsCtrl.prototype.isValid = function(start, end) {
  return new Date(start) < new Date(end);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'isValid', os.ui.TimeSettingsCtrl.prototype.isValid);


/**
 * Checks for valid slice
 * @param {Object} start
 * @param {Object} end
 * @param {boolean=} opt_ignore
 * @return {boolean}
 */
os.ui.TimeSettingsCtrl.prototype.isValidSlice = function(start, end, opt_ignore) {
  var valid = true;
  if (start && end) {
    var first = start['hours'] * 3600000 + start['mins'] * 60000 + start['secs'] * 1000;
    var last = end['hours'] * 3600000 + end['mins'] * 60000 + end['secs'] * 1000;
    valid = first <= last || opt_ignore;
  }
  return /** @type {boolean} */ (valid);
};
goog.exportProperty(os.ui.TimeSettingsCtrl.prototype, 'isValidSlice', os.ui.TimeSettingsCtrl.prototype.isValidSlice);
