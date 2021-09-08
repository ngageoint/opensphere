goog.module('os.ui.LoadingBarUI');

const {getElementByClass} = goog.require('goog.dom');
const {isNumeric, toNumber} = goog.require('goog.string');
const {setWidth} = goog.require('goog.style');
const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * Displays a bootstrap spinner bar.  Users may update the 'complete' variable to update the percentage of the bar.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  replace: true,
  restrict: 'E',
  scope: {
    'total': '=?',
    'complete': '=?',
    'message': '=?',
    'delay': '@'
  },
  templateUrl: ROOT + 'views/modal/loading.html',
  controller: Controller,
  controllerAs: 'loadctrl',
  link: loadingBarLink
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'loading-bar';

/**
 * Register directive.
 */
Module.directive('loadingBar', [directive]);

/**
 * Controller function
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
     * @type {number}
     * @private
     */
    this.total_ = 100;

    /**
     * @type {number}
     * @private
     */
    this['complete'] = 0;

    /**
     * @type {boolean}
     */
    this['show'] = false;

    /**
     * @type {boolean}
     */
    this['indeterminate'] = false;

    /**
     * @type {string}
     */
    this['message'] = 'Loading...';

    this.unwatchTotal = $scope.$watch('total', function(val) {
      if (val && isNumeric(val)) {
        /** @type {number} */ var num = toNumber(val);
        if (num > 0) {
          this.total_ = num;
        }
      }
    }.bind(this));

    this.unwatchComplete = $scope.$watch('complete', function(val) {
      if (typeof val === 'number') {
        if (val < 0) {
          // for negative values, show an indeterminate progress bar (full bar, no percent complete)
          this['complete'] = 100;
          this['indeterminate'] = true;
        } else {
          // this allows the loading bar to go backwards, but that's up to the parent to control. loading may have
          // multiple stages, so we want to allow going backwards.
          this['complete'] = Math.floor((val / this.total_) * 100);
          this['indeterminate'] = false;
        }

        var element = getElementByClass('progress-bar', this.element_[0]);
        if (element) {
          setWidth(element, this['complete'] + '%');
        }
      }
    }.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Sets the amount of time before showing the bar
   *
   * @param {number=} opt_delay Amount of time to delay the showing of the bar, defaults to zero
   */
  showDelay(opt_delay) {
    /** @type {number} */
    var delay = opt_delay ? opt_delay : 0;

    /**
     * @type {angular.$q.Promise}
     * @private
     */
    this.delayPromise_ = this.timeout_(function() {
      this['show'] = true;
    }.bind(this), delay);
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    if (this.delayPromise_) {
      this.timeout_.cancel(this.delayPromise_);
    }
    this.element_ = null;
    this.timeout_ = null;
    this.unwatchTotal();
    this.unwatchComplete();
  }
}


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.Attributes} $attr
 * @param {!Object} ctrl
 */
const loadingBarLink = function($scope, $element, $attr, ctrl) {
  // don't need to use watches for things that won't change
  ctrl.showDelay($attr['delay']);
};

exports = {
  Controller,
  directive,
  directiveTag
};
