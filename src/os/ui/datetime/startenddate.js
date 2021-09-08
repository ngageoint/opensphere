goog.module('os.ui.datetime.StartEndDateUI');

goog.require('os.ui.datetime.DateTimeUI');

const log = goog.require('goog.log');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The start-end-date directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'startDate': '=',
    'endDate': '=',
    'saving': '=',
    'lockStart': '@lockstart',
    'lockEnd': '@lockend',
    'asDate': '@',
    'startLabel': '@',
    'endLabel': '@',
    'startRequired': '=',
    'endRequired': '=',
    'disabled': '=?',
    'showLabels': '=?',
    'vertical': '=?'
  },
  templateUrl: ROOT + 'views/datetime/startenddate.html',
  controller: Controller,
  controllerAs: 'startEndCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'start-end-date';

/**
 * Register start-end-date directive.
 */
Module.directive('startEndDate', [directive]);

/**
 * Controller function for the date-time directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?boolean}
     */
    this['startInvalid'] = null;

    /**
     * @type {?boolean}
     */
    this['endInvalid'] = null;

    /**
     * @type {string}
     */
    this['start'] = this.scope['startDate'];

    /**
     * @type {string}
     */
    this['end'] = this.scope['endDate'];

    /**
     * @type {?boolean}
     */
    this['startRequired'] = this.scope['lockStart'] || this.scope['startRequired'] || false;

    /**
     * @type {?boolean}
     */
    this['endRequired'] = this.scope['lockEnd'] || this.scope['endRequired'] || false;

    /**
     * @type {?boolean}
     */
    this['showLabels'] = this.scope['showLabels'] != null ? this.scope['showLabels'] : true;

    /**
     * @type {?boolean}
     */
    this['vertical'] = this.scope['vertical'] != null ? this.scope['vertical'] : false;

    /**
     * If start date is prior to end date.
     * @type {boolean}
     */
    this['orderValid'] = true;

    this['startLabel'] = $scope['startLabel'] || 'Start Date';
    this['endLabel'] = $scope['endLabel'] || 'End Date';

    // external change
    $scope.$watch('startDate', function(val, oldVal) {
      if (!this.equals(this['start'], this.scope['startDate'])) {
        var date = new Date(this.scope['startDate']);
        // The data time strips miliseconds, do that before it does so
        // We dont think theres an internal update
        date.setUTCMilliseconds(0);
        if (this.scope['asDate']) {
          this.scope['startDate'] = date;
        } else {
          this.scope['startDate'] = date.getTime();
        }
        this['start'] = date.getTime();
        this.validate_();
      }
    }.bind(this));

    // internal change
    $scope.$watch('startEndCtrl.start', function(val, oldVal) {
      if (!this.equals(this['start'], this.scope['startDate'])) {
        log.fine(logger, 'startEndDate - watch "startDate"');
        if (this.scope['asDate']) {
          this.scope['startDate'] = Controller.getDate(this['start']);
        } else {
          this.scope['startDate'] = this['start'];
        }

        this.validate_();
        $scope.$emit('startDateChanged', val);
      }
    }.bind(this));

    // external change
    $scope.$watch('endDate', function(val, oldVal) {
      if (!this.equals(this['end'], this.scope['endDate'])) {
        var date = new Date(this.scope['endDate']);
        // The data time strips miliseconds, do that before it does so
        // We dont think theres an internal update
        date.setUTCMilliseconds(0);
        if (this.scope['asDate']) {
          this.scope['endDate'] = date;
        } else {
          this.scope['endDate'] = date.getTime();
        }
        this['end'] = date.getTime();
        this.validate_();
      }
    }.bind(this));

    // internal change
    $scope.$watch('startEndCtrl.end', function(val, oldVal) {
      if (!this.equals(this['end'], this.scope['endDate'])) {
        log.fine(logger, 'startEndDate - watch "endDate"');
        if (this.scope['asDate']) {
          this.scope['endDate'] = Controller.getDate(this['end']);
        } else {
          this.scope['endDate'] = this['end'];
        }
        this.validate_();
        $scope.$emit('endDateChanged', val);
      }
    }.bind(this));

    $scope.$watch('startEndCtrl.startInvalid', function(val, oldVal) {
      if (this.scope['lockStart'] || this['startInvalid']) {
        this['startRequired'] = true;
      } else if (val !== oldVal) {
        this['startRequired'] = val;
        apply(this.scope);
      }
      this.validate_();
    }.bind(this));

    $scope.$watch('startEndCtrl.endInvalid', function(val, oldVal) {
      if (this.scope['lockEnd'] || this['endInvalid']) {
        this['endRequired'] = true;
      } else if (val !== oldVal) {
        this['endRequired'] = val;
        apply(this.scope);
      }
      this.validate_();
    }.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    this['orderValid'] = null;
    this.scope = null;
  }

  /**
   * Validate start/end times.
   *
   * @private
   */
  validate_() {
    var start = this['start'];
    var end = this['end'];
    this.scope['dateForm']['startDate']['$dirty'] = true;
    if (this.scope['dateForm']['endDate']) {
      this.scope['dateForm']['endDate']['$dirty'] = true;
    }

    if (start && end) {
      var startDate = new Date(start).getTime();
      var endDate = new Date(end).getTime();
      this['orderValid'] = (endDate >= startDate) ? true : undefined;
    } else {
      this['orderValid'] = true;
    }
  }

  /**
   * Compare dates since some can be numbers or date vars
   *
   * @param {string|Date} a
   * @param {string|Date} b
   * @return {boolean}
   */
  equals(a, b) {
    if (!a || !b) {
      // handle 'emtpy' value comparison specifically
      return !a && !b;
    } else {
      return new Date(a).getTime() == new Date(b).getTime();
    }
  }

  /**
   * Checks if the start date is in an error state.
   *
   * @return {boolean}
   * @export
   */
  checkStartForError() {
    if (this.scope) {
      // if not dirty never show error
      if (!this.scope['dateForm']['startDate']['$dirty']) {
        return false;
      }

      // if required and not set
      if (this['startRequired'] && !this['start']) {
        return true;
      }

      // if order is not valid
      if (!this['orderValid']) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the end date is in an error state.
   *
   * @return {boolean}
   * @export
   */
  checkEndForError() {
    if (this.scope) {
      if (!this.scope['dateForm']['endDate']) {
        return false;
      }

      // if not dirty never show error
      if (!this.scope['dateForm']['endDate']['$dirty']) {
        return false;
      }

      // if required and not set
      if (this['endRequired'] && !this['end']) {
        return true;
      }

      // if order is not valid
      if (!this['orderValid']) {
        return true;
      }
    }

    return false;
  }

  /**
   * Make getting a date or null helper
   *
   * @param {string} date
   * @return {Date}
   */
  static getDate(date) {
    return date ? new Date(date) : null;
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.datetime.StartEndDateUI');

exports = {
  Controller,
  directive,
  directiveTag
};
