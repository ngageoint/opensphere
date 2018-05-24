goog.provide('os.ui.onboarding.NgOnboardingCtrl');
goog.provide('os.ui.onboarding.ngOnboardingDirective');
goog.require('goog.array');
goog.require('goog.object');
goog.require('os.config.Settings');
goog.require('os.ui.Module');


/**
 * The ng-onboarding directive, adapted from ngOnboarding by Adam Albrecht.
 * @see http://github.com/adamalbrecht/ngOnboarding/
 * @return {angular.Directive}
 */
os.ui.onboarding.ngOnboardingDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'enabled': '=',
      'config': '=',
      'steps': '=',
      'onFinishCallback': '=',
      'index': '=stepIndex'
    },
    replace: true,
    templateUrl: os.ROOT + 'views/onboarding/ngonboarding.html',
    controller: os.ui.onboarding.NgOnboardingCtrl,
    controllerAs: 'ngOnboardCtrl'
  };
};


/**
 * Register ng-onboarding directive.
 */
os.ui.Module.directive('ngOnboarding', [os.ui.onboarding.ngOnboardingDirective]);



/**
 * Controller function for the onboarding directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.$sce} $sce
 * @constructor
 * @ngInject
 */
os.ui.onboarding.NgOnboardingCtrl = function($scope, $sce) {
  /**
   * @dict
   * @private
   */
  this.defaultOptions_ = {
    'overlay': true,
    'overlayOpacity': 0.6,
    'horizontalAlign': 'default',
    'verticalAlign': 'default'
  };

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.$sce}
   * @private
   */
  this.sce_ = $sce;

  /**
   * @type {?Object}
   * @private
   */
  this.curStep_ = null;

  /**
   * @type {number}
   */
  this['stepCount'] = $scope['steps'].length;

  $scope.$watch('index', this.onIndexChange_.bind(this));

  if ($scope['steps'].length && !$scope['index']) {
    return $scope['index'] = 0;
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up listeners/references.
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.destroy_ = function() {
  this.sce_ = null;
  this.scope_ = null;
};


/**
 * Move to the next step.
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.next = function() {
  if (!this['lastStep']) {
    this.scope_['index'] = this.scope_['index'] + 1;
  } else {
    this.close();
  }
};
goog.exportProperty(
    os.ui.onboarding.NgOnboardingCtrl.prototype,
    'next',
    os.ui.onboarding.NgOnboardingCtrl.prototype.next);


/**
 * Move to the previous step.
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.previous = function() {
  this.scope_['index'] = this.scope_['index'] - 1;
};
goog.exportProperty(
    os.ui.onboarding.NgOnboardingCtrl.prototype,
    'previous',
    os.ui.onboarding.NgOnboardingCtrl.prototype.previous);


/**
 * Close onboarding.
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.close = function() {
  this.scope_['enabled'] = false;
  this.setupOverlay_(false);
  if (this.scope_['onFinishCallback']) {
    this.scope_['onFinishCallback']();
  }
};
goog.exportProperty(
    os.ui.onboarding.NgOnboardingCtrl.prototype,
    'close',
    os.ui.onboarding.NgOnboardingCtrl.prototype.close);


/**
 * Close onboarding and prevent others from being displayed.
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.stopShowing = function() {
  os.settings.set('onboarding.showOnboarding', false);
  this.close();
};
goog.exportProperty(
    os.ui.onboarding.NgOnboardingCtrl.prototype,
    'stopShowing',
    os.ui.onboarding.NgOnboardingCtrl.prototype.stopShowing);


/**
 * @param {boolean} showOverlay
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.setupOverlay_ = function(showOverlay) {
  $('.c-ng-onboarding__focus').removeClass('c-ng-onboarding__focus');
  if (showOverlay) {
    if (this.scope_['overlay']) {
      if (this.curStep_['attachTo']) {
        $(this.curStep_['attachTo']).addClass('c-ng-onboarding__focus');
      }

      if (this.curStep_['focusOn']) {
        $(this.curStep_['focusOn']).addClass('c-ng-onboarding__focus');
      }
    }
  }
};


/**
 * Returns the height of a DOM element. Works with Element and SVGElement types.
 * @param {jQuery} element jQuery element.
 * @return {number}
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.getElementHeight_ = function(element) {
  return SVGElement && element[0] instanceof SVGElement ? element[0].getBBox().height : element.outerHeight();
};


/**
 * Returns the width of a DOM element. Works with Element and SVGElement types.
 * @param {jQuery} element jQuery element.
 * @return {number}
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.getElementWidth_ = function(element) {
  return SVGElement && element[0] instanceof SVGElement ? element[0].getBBox().width : element.outerWidth();
};


/**
 * Handle changes to the step index.
 * @param {?number} newVal The new index
 * @param {?number} oldVal The old index
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.onIndexChange_ = function(newVal, oldVal) {
  if (newVal === null) {
    this.scope_['enabled'] = false;
    this.setupOverlay_(false);
    return;
  }

  this.curStep_ = this.scope_['steps'][this.scope_['index']];
  this['lastStep'] = this.scope_['index'] + 1 === this.scope_['steps'].length;
  this['showNextButton'] = this.scope_['index'] + 1 < this.scope_['steps'].length;
  this['showPreviousButton'] = this.scope_['index'] > 0;

  // reset the popover
  var attributesToClear = ['title', 'top', 'right', 'bottom', 'left', 'width', 'height', 'position'];
  attributesToClear.forEach(function(attr) {
    this.scope_[attr] = null;
  }, this);

  // apply default configuration
  for (var key in this.defaultOptions_) {
    this.scope_[key] = this.defaultOptions_[key];
  }

  // override defaults with passed configuration
  if (this.scope_['config'] != null) {
    for (var key in this.scope_['config']) {
      this.scope_[key] = this.scope_['config'][key];
    }
  }

  // apply step-specific configuration
  for (var key in this.curStep_) {
    // allow storing descriptions as arrays for readability in JSON files.
    var val = this.curStep_[key];
    if (key == 'description' && goog.isArray(val)) {
      val = val.join('');
    }
    this.scope_[key] = val;
  }

  this['description'] = this.sce_.trustAsHtml(this.scope_['description']);
  this.setupOverlay_(true);

  this.setupPositioning_();
};


/**
 * Positions the onboarding step popover.
 * @private
 */
os.ui.onboarding.NgOnboardingCtrl.prototype.setupPositioning_ = function() {
  var bottom;
  var left;
  var right;
  var top;
  var xMargin;
  var yMargin;
  this.scope_['position'] = this.curStep_['position'];
  xMargin = 15;
  yMargin = 15;

  if (this.curStep_['attachTo']) {
    var attachTo = $(this.curStep_['attachTo']);
    if (attachTo && attachTo.length > 0) {
      if (!(this.scope_['left'] || this.scope_['right'])) {
        left = null;
        right = null;

        if (this.scope_['position'] === 'right') {
          left = attachTo.offset().left + attachTo.outerWidth() + xMargin;

          // if (this.curStep_['horizontalAlign'] == 'center') {
          //   // offset by half the target element width, remove the margin, account for popover arrow width
          //   left = left - this.getElementWidth_(attachTo) / 2 - xMargin + 11;
          // }
        } else if (this.scope_['position'] === 'left') {
          right = $(window).width() - attachTo.offset().left + xMargin;

          // if (this.curStep_['horizontalAlign'] == 'center') {
          //   // offset by half the target element width, remove the margin, account for popover arrow width
          //   right = right - this.getElementWidth_(attachTo) / 2 - xMargin + 11;
          // }
        } else if (this.scope_['position'] === 'top' || this.scope_['position'] === 'bottom') {
          left = attachTo.offset().left;

          // if (this.curStep_['horizontalAlign'] == 'center') {
          //   left = left - $('.js-onboarding__popover').outerWidth() / 2 + this.getElementWidth_(attachTo) / 2;
          //   left = left < 0 ? 0 : left;
          // }
        }

        if (this.curStep_['xOffset']) {
          if (left !== null) {
            left = left + this.curStep_['xOffset'];
          }
          if (right !== null) {
            right = right - this.curStep_['xOffset'];
          }
        }

        this.scope_['left'] = left;
        this.scope_['right'] = right;
      }

      if (!(this.scope_['top'] || this.scope_['bottom'])) {
        top = null;
        bottom = null;
        if (this.scope_['position'] === 'left' || this.scope_['position'] === 'right') {
          top = attachTo.offset().top;

          if (this.curStep_['verticalAlign'] == 'center') {
            top = top - $('.js-onboarding__popover').outerHeight() / 2 + this.getElementHeight_(attachTo) / 2;
          }
        } else if (this.scope_['position'] === 'bottom') {
          top = attachTo.offset().top + attachTo.outerHeight() + yMargin;
        } else if (this.scope_['position'] === 'top') {
          bottom = $(window).height() - attachTo.offset().top + yMargin;
        }

        if (this.curStep_['yOffset']) {
          if (top !== null) {
            top = top + this.curStep_['yOffset'];
          }
          if (bottom !== null) {
            bottom = bottom - this.curStep_['yOffset'];
          }
        }
        top = top < 0 ? 0 : top;
        bottom = bottom < 0 ? 0 : bottom;
        this.scope_['top'] = top;
        this.scope_['bottom'] = bottom;
      }
    } else {
      // couldn't find the attachTo element, so center the popover
      this.scope_['position'] = 'centered';
    }
  }

  if (this.scope_['position'] && this.scope_['position'].length) {
    this['positionClass'] = 'bs-popover-' + this.scope_['position'];
  } else {
    this['positionClass'] = null;
  }
};
