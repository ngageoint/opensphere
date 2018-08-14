goog.provide('os.ui.LoadingBarCtrl');
goog.provide('os.ui.loadingBarDirective');

goog.require('os.ui.Module');


/**
 * Displays a bootstrap spinner bar.  Users may update the 'complete' variable to update the percentage of the bar.
 * @return {angular.Directive}
 */
os.ui.loadingBarDirective = function() {
  return {
    replace: true,
    restrict: 'E',
    scope: {
      'total': '=?',
      'complete': '=?',
      'message': '=?',
      'delay': '@'
    },
    templateUrl: os.ROOT + 'views/modal/loading.html',
    controller: os.ui.LoadingBarCtrl,
    controllerAs: 'loadctrl',
    link: os.ui.loadingBarLink
  };
};


/**
 * Register directive.
 */
os.ui.Module.directive('loadingBar', [os.ui.loadingBarDirective]);



/**
 * Controller function
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @ngInject
 */
os.ui.LoadingBarCtrl = function($scope, $element, $timeout) {
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

  this.unwatchTotal = $scope.$watch('total', goog.bind(function(val) {
    if (val && goog.string.isNumeric(val)) {
      /** @type {number} */ var num = goog.string.toNumber(val);
      if (num > 0) {
        this.total_ = num;
      }
    }
  }, this));

  this.unwatchComplete = $scope.$watch('complete', goog.bind(function(val) {
    if (goog.isNumber(val)) {
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

      var element = goog.dom.getElementByClass('bar', this.element_[0]);
      if (element) {
        goog.style.setWidth(element, this['complete'] + '%');
      }
    }
  }, this));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Sets the amount of time before showing the bar
 * @param {number=} opt_delay Amount of time to delay the showing of the bar, defaults to zero
 */
os.ui.LoadingBarCtrl.prototype.showDelay = function(opt_delay) {
  /** @type {number} */
  var delay = opt_delay ? opt_delay : 0;

  /**
   * @type {angular.$q.Promise}
   * @private
   */
  this.delayPromise_ = this.timeout_(goog.bind(function() {
    this['show'] = true;
  }, this), delay);
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.LoadingBarCtrl.prototype.destroy_ = function() {
  if (this.delayPromise_) {
    this.timeout_.cancel(this.delayPromise_);
  }
  this.element_ = null;
  this.timeout_ = null;
  this.unwatchTotal();
  this.unwatchComplete();
};


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.Attributes} $attr
 * @param {!Object} ctrl
 */
os.ui.loadingBarLink = function($scope, $element, $attr, ctrl) {
  // don't need to use watches for things that won't change
  ctrl.showDelay($attr['delay']);
};
