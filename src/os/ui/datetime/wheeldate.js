goog.provide('os.ui.datetime.WheelDateCtrl');
goog.provide('os.ui.datetime.wheelDateDirective');

goog.require('goog.async.Delay');
goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.ui.Module');


/**
 * The wheel-date directive. This directive creates a date field that will adjust the date based on the mouse
 * cursor position when the mouse is scrolled. The date passed via the scope will be updated when the Enter key
 * is pressed or the date field loses focus.
 * @return {angular.Directive}
 */
os.ui.datetime.wheelDateDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'date': '=',
      'disable': '=',
      'isRequired': '=',
      'blurOnSelect': '=?'
    },
    templateUrl: os.ROOT + 'views/datetime/wheeldate.html',
    controller: os.ui.datetime.WheelDateCtrl,
    controllerAs: 'wheelDate'
  };
};


/**
 * Add the directive to the os.ui module.
 */
os.ui.Module.directive('wheelDate', [os.ui.datetime.wheelDateDirective]);


/**
 * Today button should set the date rather than just bring it into view
 * @param {string} id
 * @this os.ui.datetime.WheelDateCtrl
 * @private
 */
os.ui.datetime.newToday_ = function(id) {
  os.ui.datetime.oldToday_.call(this, id);
  this['_selectDate'](id);
  $(id).blur();
};


/**
 * @type {Function}
 * @private
 */
os.ui.datetime.oldToday_ = null;


/**
 * THIN-6229 - Today button should set the date rather than just bring it into view
 * @suppress {checkTypes}
 * @private
 */
os.ui.datetime.fixToday_ = function() {
  if ($.datepicker && !os.ui.datetime.oldToday_) {
    os.ui.datetime.oldToday_ = $.datepicker['_gotoToday'];
    $.datepicker['_gotoToday'] = os.ui.datetime.newToday_;
  }
};



/**
 * Controller function for the wheel-date directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.datetime.WheelDateCtrl = function($scope, $element, $timeout) {
  os.ui.datetime.fixToday_();

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
        function(dateText, inst) {
          fixFocusIE = true;
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

  /**
   * Handler for mouse wheel events.
   * @type {goog.events.MouseWheelHandler}
   * @private
   */
  this.wheelHandler_ = new goog.events.MouseWheelHandler(goog.dom.getDocument());

  /**
   * @type {boolean}
   * @private
   */
  this.dirty_ = false;

  /**
   * @type {?goog.async.Delay}
   * @private
   */
  this.blurDelay_ = null;

  /**
   * @type {Element}
   * @private
   */
  this.inputElement_ = $element.find('.date-picker')[0];
  goog.events.listen(this.inputElement_, goog.events.EventType.FOCUS, this.onDateFocus_, false, this);
  goog.events.listen(this.inputElement_, goog.events.EventType.BLUR, this.onDateBlur_, false, this);

  if ($scope['date']) {
    this['date'] = new Date($scope['date'].getTime());
  } else {
    // watch for $scope.date initialization
    var unwatchDate = $scope.$watch('date', function(newVal, oldVal) {
      if (newVal && oldVal && newVal.getTime() == oldVal.getTime()) {
        this['date'] = new Date(newVal.getTime());
        /** @type {!jQuery} */ (this.element_.find('.date-picker')).datepicker('setDate', this['date']);
        unwatchDate();
      }
    }.bind(this));
  }

  $scope.$watch('date', this.onDateChanged_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.ui.datetime.WheelDateCtrl.LOGGER_ = goog.log.getLogger('os.ui.datetime.WheelDateCtrl');


/**
 * Clear references to Angular/DOM elements.
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.destroy_ = function() {
  goog.events.unlisten(this.inputElement_, goog.events.EventType.FOCUS, this.onDateFocus_, false, this);
  goog.events.unlisten(this.inputElement_, goog.events.EventType.BLUR, this.onDateBlur_, false, this);
  this.wheelHandler_.dispose();
  this.wheelHandler_ = null;
  this.inputElement_ = null;
  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * Change handler for date control.
 * @param {?Date} newVal
 * @param {?Date} oldVal
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.onDateChanged_ = function(newVal, oldVal) {
  if (!newVal && oldVal) {
    goog.log.fine(os.ui.datetime.WheelDateCtrl.LOGGER_, 'Wheel date reset on null date');
    /** @type {!jQuery} */ (this.element_.find('.date-picker')).datepicker('setDate', null);
    this['date'] = null;
  }
  if (newVal && (!oldVal || newVal.getTime() !== oldVal.getTime())) {
    this['date'] = new Date(newVal.getTime());
    this.element_.find('.date-picker').datepicker('setDate', this['date']);

    goog.log.fine(os.ui.datetime.WheelDateCtrl.LOGGER_, 'Wheel date changed to: ' + newVal.toUTCString());
  }
};


/**
 * Registers mouse wheel listener on focus, unregisters it on blur.
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.onDateFocus_ = function(event) {
  if (!this.wheelHandler_.hasListener(goog.events.MouseWheelHandler.EventType.MOUSEWHEEL)) {
    this.wheelHandler_.listen(
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.handleWheelEvent_, false, this);

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
};


/**
 * Registers mouse wheel listener on focus, unregisters it on blur.
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.onDateBlur_ = function(event) {
  this.wheelHandler_.unlisten(
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.handleWheelEvent_, false, this);

  // Picking a date from the jquery ui datepicker calendar will fire a blur event, but jquery will refocus
  // the input by calling focus() on the element. We don't want to update the scope right now if the calendar
  // was used to pick a date because the ng-change event will handle that once this['date'] is synced up.
  // Put the blur handler on a delay so if the element is focused again, we don't set the wrong date on the
  // scope.
  this.blurDelay_ = new goog.async.Delay(this.handleBlur_, 250, this);
  this.blurDelay_.start();
};


/**
 * Update the scope if a mousewheel event changed the date.
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.handleBlur_ = function() {
  if (this.dirty_) {
    this.dirty_ = false;
    this.timeout_(this.updateScopeDate.bind(this));
  }

  this.blurDelay_.dispose();
  this.blurDelay_ = null;
};


/**
 * Handle mouse wheel events. This callback is registered on focus and removed on blur and will update the date
 * based on the cursor start position in the date field.
 * @param {goog.events.MouseWheelEvent} event
 * @private
 */
os.ui.datetime.WheelDateCtrl.prototype.handleWheelEvent_ = function(event) {
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
    this.element_.find('.date-picker').datepicker('setDate', this['date']);
    input.selectionStart = origStart;
    input.selectionEnd = origEnd;

    this.dirty_ = true;
    os.ui.apply(this.scope_);
  }
};


/**
 * Updates Angular scope's date so the parent can react. This should only fire when the user chooses a date
 * from the calendar, hits enter, or the field loses focus. Mouse wheel changes should be suppressed.
 */
os.ui.datetime.WheelDateCtrl.prototype.updateScopeDate = function() {
  goog.log.fine(os.ui.datetime.WheelDateCtrl.LOGGER_, 'Wheel date updating scope.');

  if (!this['date'] || goog.isDateLike(this['date'])) {
    // a date was chosen, so update the scope and remove focus from the input to prevent mouse scrolling
    this.scope_['date'] = this['date'] ? new Date(this['date'].getTime()) : null;
    if (this.scope_['blurOnSelect']) {
      this.timeout_(function() {
        document.activeElement.blur();
      });
    }
  }
};
goog.exportProperty(
    os.ui.datetime.WheelDateCtrl.prototype,
    'updateScopeDate',
    os.ui.datetime.WheelDateCtrl.prototype.updateScopeDate);
