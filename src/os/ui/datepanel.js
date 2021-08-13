goog.module('os.ui.DatePanelUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.datetime.DateControlUI');
goog.require('os.ui.popover.PopoverUI');

const RangeSet = goog.require('goog.math.RangeSet');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const {getTimeOffsetLabel} = goog.require('os.time');
const TimelineController = goog.require('os.time.TimelineController');
const Module = goog.require('os.ui.Module');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventType = goog.require('os.ui.events.UIEventType');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/datepanel.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'date-panel';

Module.directive('datePanel', [directive]);

/**
 * Controller for the date panel
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
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

    this.tlc_ = TimelineController.getInstance();
  }

  /**
   * Shows the time slicer or not
   *
   * @export
   */
  toggleExtend() {
    this['extended'] = !this['extended'];

    if (!this['extended']) {
      this.applySlice();
    }
  }

  /**
   * Opens timeline
   *
   * @export
   */
  expand() {
    dispatcher.getInstance().dispatchEvent(new UIEvent(UIEventType.TOGGLE_UI, 'timeline'));
  }

  /**
   * Update the offset if it changes
   *
   * @return {string}
   * @export
   */
  getOffset() {
    return 'UTC' + (getTimeOffsetLabel() == 'Z' ? '+0000' : getTimeOffsetLabel());
  }

  /**
   * Enable the apply button when a spinner value changes
   *
   * @param {string} varName
   * @param {number} min
   * @param {number} max
   * @param {number} oldVal
   * @export
   */
  onChange(varName, min, max, oldVal) {
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
  }

  /**
   * Turns on/off time slice requests
   *
   * @export
   */
  applySlice() {
    var rangeSet = new RangeSet();
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
  }

  /**
   * Turns on time slice requests if they are in use
   *
   * @export
   */
  applySliceIfActive() {
    if (this['active']) {
      this.applySlice();
    }
  }

  /**
   * Turns off slicing
   *
   * @export
   */
  cancelSlice() {
    this.toggleExtend();
  }

  /**
   * Validates slice
   *
   * @return {boolean}
   * @export
   */
  sliceValid() {
    var start = this['startHour'] * 60 + this['startMinute'];
    var end = this['endHour'] * 60 + this['endMinute'];
    return start < end;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
