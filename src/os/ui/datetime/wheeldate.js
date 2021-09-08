goog.module('os.ui.datetime.WheelDateUI');

const Delay = goog.require('goog.async.Delay');
const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const MouseWheelHandler = goog.require('goog.events.MouseWheelHandler');
const log = goog.require('goog.log');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const windowSelector = goog.require('os.ui.windowSelector');
const MouseWheelEvent = goog.requireType('goog.events.MouseWheelEvent');
const Logger = goog.requireType('goog.log.Logger');

const BrowserEvent = goog.requireType('goog.events.BrowserEvent');


/**
 * The wheel-date directive. This directive creates a date field that will adjust the date based on the mouse
 * cursor position when the mouse is scrolled. The date passed via the scope will be updated when the Enter key
 * is pressed or the date field loses focus.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'date': '=',
    'disable': '=',
    'isRequired': '=',
    'blurOnSelect': '=?',
    'eventContainer': '@',
    'name': '@'
  },
  templateUrl: ROOT + 'views/datetime/wheeldate.html',
  controller: Controller,
  controllerAs: 'wheelDate'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'wheel-date';

/**
 * Add the directive to the os.ui module.
 */
Module.directive('wheelDate', [directive]);

/**
 * Today button should set the date rather than just bring it into view
 *
 * @param {string} id
 * @this Controller
 */
const newToday = function(id) {
  oldToday.call(this, id);
  this['_selectDate'](id);
  $(id).trigger('blur');
};

/**
 * @type {Function}
 */
let oldToday = null;

/**
 * THIN-6229 - Today button should set the date rather than just bring it into view
 *
 * @suppress {checkTypes}
 */
const fixToday = function() {
  if ($.datepicker && !oldToday) {
    oldToday = $.datepicker['_gotoToday'];
    $.datepicker['_gotoToday'] = newToday;
  }
};

/**
 * Controller function for the wheel-date directive
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
    fixToday();

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
     * @type {string}
     * @private
     */
    this.name_ = this.scope_['name'] || 'default';

    var fixFocusIE = false;

    /**
     * jQuery UI date picker options.
     * @dict
     */
    this['dateOptions'] = {
      'changeYear': true,
      'changeMonth': true,
      'closeText': 'Close',
      'currentText': 'Today',
      'showButtonPanel': true,
      'yearRange': '1900:+10',
      'dateFormat': 'yy-mm-dd', // ISO-8601
      'onSelect':
          /**
           * @param {string} dateText
           * @param {*} inst
           * @this Element
           */
          (dateText, inst) => {
            fixFocusIE = true;
            $timeout(() => {
              $scope.$emit(this.name_ + '.userSelected');
            });
          },
      'beforeShow':
          /**
           * @param {HTMLInputElement} input
           * @param {*} inst
           * @return {boolean}
           */
          function(input, inst) {
            var result = true;
            if (navigator.userAgent.toLowerCase().match(/msie/) || navigator.userAgent.toLowerCase().match(/.net/)) {
              result = !fixFocusIE;
            }
            fixFocusIE = false;
            return result;
          }
    };

    /**
     * @type {Date}
     */
    this['date'] = null;

    //
    // Some browsers (like Chrome 73+) treat wheel events on document-level elements as passive by default. If a valid
    // selector is not provided, fall back on the element as the event target. Using the window/document/body will result
    // in console exceptions and possibly unexpected handler behavior in browsers implementing this behavior.
    //
    var eventContainer = this.scope_['eventContainer'] || windowSelector.APP;
    var eventContainerEl = document.querySelector(eventContainer) || this.element_[0];

    /**
     * Handler for mouse wheel events.
     * @type {MouseWheelHandler}
     * @private
     */
    this.wheelHandler_ = new MouseWheelHandler(eventContainerEl);

    /**
     * @type {boolean}
     * @private
     */
    this.dirty_ = false;

    /**
     * @type {?Delay}
     * @private
     */
    this.blurDelay_ = null;

    /**
     * @type {Element}
     * @private
     */
    this.inputElement_ = $element[0];
    googEvents.listen(this.inputElement_, GoogEventType.FOCUS, this.onDateFocus_, false, this);
    googEvents.listen(this.inputElement_, GoogEventType.BLUR, this.onDateBlur_, false, this);

    if ($scope['date']) {
      this['date'] = new Date($scope['date'].getTime());
    } else {
      // watch for $scope.date initialization
      var unwatchDate = $scope.$watch('date', function(newVal, oldVal) {
        if (newVal && oldVal && newVal.getTime() == oldVal.getTime()) {
          this['date'] = new Date(newVal.getTime());
          /** @type {!jQuery} */ (this.element_).datepicker('setDate', this['date']);
          unwatchDate();
        }
      }.bind(this));
    }

    $scope.$watch('date', this.onDateChanged_.bind(this));

    $scope.$on(this.name_ + '.open', this.openDatePicker.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clear references to Angular/DOM elements.
   *
   * @private
   */
  destroy_() {
    googEvents.unlisten(this.inputElement_, GoogEventType.FOCUS, this.onDateFocus_, false, this);
    googEvents.unlisten(this.inputElement_, GoogEventType.BLUR, this.onDateBlur_, false, this);
    this.wheelHandler_.dispose();
    this.wheelHandler_ = null;
    this.inputElement_ = null;
    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * Change handler for date control.
   *
   * @param {?Date} newVal
   * @param {?Date} oldVal
   * @private
   */
  onDateChanged_(newVal, oldVal) {
    if (!newVal && oldVal) {
      log.fine(logger, 'Wheel date reset on null date');
      /** @type {!jQuery} */ (this.element_).datepicker('setDate', null);
      this['date'] = null;
    }
    if (newVal && (!oldVal || newVal.getTime() !== oldVal.getTime())) {
      this['date'] = new Date(newVal.getTime());
      this.element_.datepicker('setDate', this['date']);

      log.fine(logger, 'Wheel date changed to: ' + newVal.toUTCString());
    }
  }

  /**
   * Open the current element's datepicker.
   *
   * @private
   */
  openDatePicker() {
    this.element_.focus();
  }

  /**
   * Registers mouse wheel listener on focus, unregisters it on blur.
   *
   * @param {BrowserEvent} event
   * @private
   */
  onDateFocus_(event) {
    if (!this.wheelHandler_.hasListener(MouseWheelHandler.EventType.MOUSEWHEEL)) {
      this.wheelHandler_.listen(
          MouseWheelHandler.EventType.MOUSEWHEEL, this.handleWheelEvent_, false, this);

      if (this.scope_['blurOnSelect'] && this.blurDelay_) {
        // jquery focused the element after calendar selection, so blur the input ourselves.
        this.blurDelay_.dispose();
        this.blurDelay_ = null;
        this.dirty_ = false;

        this.timeout_(function() {
          document.activeElement.blur();
        });
      }
    }
  }

  /**
   * Registers mouse wheel listener on focus, unregisters it on blur.
   *
   * @param {BrowserEvent} event
   * @private
   */
  onDateBlur_(event) {
    this.wheelHandler_.unlisten(
        MouseWheelHandler.EventType.MOUSEWHEEL, this.handleWheelEvent_, false, this);

    // Picking a date from the jquery ui datepicker calendar will fire a blur event, but jquery will refocus
    // the input by calling focus() on the element. We don't want to update the scope right now if the calendar
    // was used to pick a date because the ng-change event will handle that once this['date'] is synced up.
    // Put the blur handler on a delay so if the element is focused again, we don't set the wrong date on the
    // scope.
    this.blurDelay_ = new Delay(this.handleBlur_, 250, this);
    this.blurDelay_.start();
  }

  /**
   * Update the scope if a mousewheel event changed the date.
   *
   * @private
   */
  handleBlur_() {
    if (this.dirty_) {
      this.dirty_ = false;
      this.timeout_(this.updateScopeDate.bind(this));
    }

    this.blurDelay_.dispose();
    this.blurDelay_ = null;
  }

  /**
   * Handle mouse wheel events. This callback is registered on focus and removed on blur and will update the date
   * based on the cursor start position in the date field.
   *
   * @param {MouseWheelEvent} event
   * @private
   */
  handleWheelEvent_(event) {
    if (event) {
      event.preventDefault();

      var input = /** @type {HTMLInputElement} */ (event.target);
      var origStart = input.selectionStart;
      var origEnd = input.selectionEnd;
      var delta = event.deltaY < 0 ? 1 : -1;

      // Format ISO-8601 (YYYY-MM-DD). This will need update if we support other formats.
      if (origEnd < 5) {
        this['date'].setFullYear(this['date'].getFullYear() + delta);
      } else if (origEnd < 8) {
        this['date'].setMonth(this['date'].getMonth() + delta);
      } else {
        this['date'].setDate(this['date'].getDate() + delta);
      }

      // update the jquery date picker. this will reset the selection position, so set it back to the original values.
      this.element_.datepicker('setDate', this['date']);
      input.selectionStart = origStart;
      input.selectionEnd = origEnd;

      this.dirty_ = true;
      apply(this.scope_);
    }
  }

  /**
   * Updates Angular scope's date so the parent can react. This should only fire when the user chooses a date
   * from the calendar, hits enter, or the field loses focus. Mouse wheel changes should be suppressed.
   *
   * @export
   */
  updateScopeDate() {
    log.fine(logger, 'Wheel date updating scope.');

    if (!this['date'] || goog.isDateLike(this['date'])) {
      // a date was chosen, so update the scope and remove focus from the input to prevent mouse scrolling
      this.scope_['date'] = this['date'] ? new Date(this['date'].getTime()) : null;
      if (this.scope_['blurOnSelect']) {
        this.timeout_(function() {
          document.activeElement.blur();
        });
      }
    }
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.datetime.WheelDateUI');

exports = {
  Controller,
  directive,
  directiveTag
};
