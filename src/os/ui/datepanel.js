goog.provide('os.ui.DatePanelCtrl');
goog.provide('os.ui.datePanelDirective');

goog.require('goog.math.RangeSet');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.dateControlDirective');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.popover.popoverDirective');


/**
 * @return {angular.Directive}
 */
os.ui.datePanelDirective = function() {
  return {
    restrict: 'AE',
    scope: true,
    templateUrl: os.ROOT + 'views/datepanel.html',
    controller: os.ui.DatePanelCtrl,
    controllerAs: 'ctrl'
  };
};


os.ui.Module.directive('datePanel', [os.ui.datePanelDirective]);



/**
 * Controller for the date panel
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.DatePanelCtrl = function($scope) {
  /**
   *@type {boolean}
   */
  this['extended'] = false;

  /**
   *@type {number}
   */
  this['startHour'] = 0;

  /**
   *@type {number}
   */
  this['startMinute'] = 0;

  /**
   *@type {number}
   */
  this['endHour'] = 1;

  /**
   *@type {number}
   */
  this['endMinute'] = 0;

  /**
   *@type {boolean}
   */
  this['active'] = false;

  /**
   *@type {string}
   */
  this['sliceTip'] = 'Show/hide time filter panel';

  /**
   * @type {string}
   */
  this['sliceTitle'] = 'Time Filter';

  /**
   * @type {string}
   */
  this['sliceDescription'] = 'Creates a time range of less than 24 hours to show data from each loaded day. ' +
  '\nChoose 14:00 to 16:00 to query that time slice every day within the given range. (UTC 0000 = Zulu)';

  this.tlc_ = os.time.TimelineController.getInstance();
};


/**
 * Shows the time slicer or not
 */
os.ui.DatePanelCtrl.prototype.toggleExtend = function() {
  this['extended'] = !this['extended'];
  var menuEl = angular.element('#slice-panel');
  menuEl.toggle();
  if (!this['extended']) {
    this.applySlice();
  }
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'toggleExtend', os.ui.DatePanelCtrl.prototype.toggleExtend);


/**
 * Opens timeline
 */
os.ui.DatePanelCtrl.prototype.expand = function() {
  os.dispatcher.dispatchEvent(new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, 'timeline'));
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'expand', os.ui.DatePanelCtrl.prototype.expand);


/**
 * Update the offset if it changes
 * @return {string}
 */
os.ui.DatePanelCtrl.prototype.getOffset = function() {
  return 'UTC' + (os.time.timeOffsetLabel == 'Z' ? '+0000' : os.time.timeOffsetLabel);
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'getOffset', os.ui.DatePanelCtrl.prototype.getOffset);


/**
 * Enable the apply button when a spinner value changes
 * @param {string} varName
 * @param {number} min
 * @param {number} max
 * @param {number} oldVal
 */
os.ui.DatePanelCtrl.prototype.onChange = function(varName, min, max, oldVal) {
  if (this[varName] != undefined) {
    if (this[varName] == null || this[varName] < min) {
      this[varName] = parseInt(min, 10);
    } else if (this[varName] > max) {
      this[varName] = parseInt(max, 10);
    }
  } else if (oldVal) {
    this[varName] = parseInt(oldVal, 10);
  }
  this['active'] = false;
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'onChange', os.ui.DatePanelCtrl.prototype.onChange);


/**
 * Turns on/off time slice requests
 */
os.ui.DatePanelCtrl.prototype.applySlice = function() {
  var rangeSet = new goog.math.RangeSet();
  if (this['extended']) {
    var start = this['startHour'] * 3600000 + this['startMinute'] * 60000;
    var end = this['endHour'] * 3600000 + this['endMinute'] * 60000;
    rangeSet.add(this.tlc_.buildRange(start, end));
    this['active'] = true;
  } else {
    this['active'] = false;
  }
  var existing = this.tlc_.getSliceRangeSet();
  if (!(existing.isEmpty() && rangeSet.isEmpty())) { // only load if something changed
    this.tlc_.setSliceRanges(rangeSet);
  }
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'applySlice', os.ui.DatePanelCtrl.prototype.applySlice);


/**
 * Turns on time slice requests if they are in use
 */
os.ui.DatePanelCtrl.prototype.applySliceIfActive = function() {
  if (this['active']) {
    this.applySlice();
  }
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype,
    'applySliceIfActive',
    os.ui.DatePanelCtrl.prototype.applySliceIfActive);


/**
 * Turns off slicing
 */
os.ui.DatePanelCtrl.prototype.cancelSlice = function() {
  this.toggleExtend();
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'cancelSlice', os.ui.DatePanelCtrl.prototype.cancelSlice);


/**
 * Validates slice
 * @return {boolean}
 */
os.ui.DatePanelCtrl.prototype.sliceValid = function() {
  var start = this['startHour'] * 60 + this['startMinute'];
  var end = this['endHour'] * 60 + this['endMinute'];
  return start < end;
};
goog.exportProperty(os.ui.DatePanelCtrl.prototype, 'sliceValid', os.ui.DatePanelCtrl.prototype.sliceValid);
