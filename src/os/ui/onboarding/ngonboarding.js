goog.declareModuleId('os.ui.onboarding.NgOnboardingUI');

import Settings from '../../config/settings.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';

const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const GoogEventType = goog.require('goog.events.EventType');


/**
 * The ng-onboarding directive, adapted from ngOnboarding by Adam Albrecht.
 *
 * @see http://github.com/adamalbrecht/ngOnboarding/
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: {
    'enabled': '=',
    'config': '=',
    'steps': '=',
    'onFinishCallback': '=',
    'index': '=stepIndex'
  },
  replace: true,
  templateUrl: ROOT + 'views/onboarding/ngonboarding.html',
  controller: Controller,
  controllerAs: 'ngOnboardCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'ng-onboarding';

/**
 * Register ng-onboarding directive.
 */
Module.directive('ngOnboarding', [directive]);

/**
 * Controller function for the onboarding directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$sce} $sce
   * @ngInject
   */
  constructor($scope, $sce) {
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
    $scope.$on('$destroy', this.destroy_.bind(this));

    /**
     * @type {?ViewportSizeMonitor}
     * @private
     */
    this.vsm_ = new ViewportSizeMonitor();
    this.vsm_.listen(GoogEventType.RESIZE, this.onResize_, false, this);

    if ($scope['steps'].length && !$scope['index']) {
      $scope['index'] = 0;
    }
  }

  /**
   * Clean up listeners/references.
   *
   * @private
   */
  destroy_() {
    if (this.vsm_) {
      this.vsm_.dispose();
      this.vsm_ = null;
    }
    this.sce_ = null;
    this.scope_ = null;
  }

  /**
   * Move to the next step.
   *
   * @export
   */
  next() {
    if (!this['lastStep']) {
      this.scope_['index'] = this.scope_['index'] + 1;
    } else {
      this.close();
    }
  }

  /**
   * Move to the previous step.
   *
   * @export
   */
  previous() {
    this.scope_['index'] = this.scope_['index'] - 1;
  }

  /**
   * Close onboarding.
   *
   * @export
   */
  close() {
    this.scope_['enabled'] = false;
    this.setupOverlay_(false);
    if (this.scope_['onFinishCallback']) {
      this.scope_['onFinishCallback']();
    }
  }

  /**
   * Close onboarding and prevent others from being displayed.
   *
   * @export
   */
  stopShowing() {
    Settings.getInstance().set('onboarding.showOnboarding', false);
    this.close();
  }

  /**
   * @param {boolean} showOverlay
   * @private
   */
  setupOverlay_(showOverlay) {
    $('.c-ng-onboarding__focus').removeClass('c-ng-onboarding__focus');
    $('.c-ng-onboarding__highlight').removeClass('c-ng-onboarding__highlight');
    if (showOverlay) {
      if (this.scope_['overlay']) {
        if (this.curStep_['attachTo']) {
          $(this.curStep_['attachTo']).addClass('c-ng-onboarding__focus');
        }

        if (this.curStep_['focusOn']) {
          $(this.curStep_['focusOn']).addClass('c-ng-onboarding__focus');
        }

        if (this.curStep_['highlight']) {
          $(this.curStep_['highlight']).addClass('c-ng-onboarding__highlight');
        }
      }
    }
  }

  /**
   * Returns the height of a DOM element. Works with Element and SVGElement types.
   *
   * @param {jQuery} element jQuery element.
   * @return {number}
   * @private
   */
  getElementHeight_(element) {
    return SVGElement && element[0] instanceof SVGElement ? element[0].getBBox().height : element.outerHeight();
  }

  /**
   * Handle window resize
   *
   * @private
   */
  onResize_() {
    // reset the popover
    var attributesToClear = ['top', 'right', 'bottom', 'left', 'position'];
    attributesToClear.forEach(function(attr) {
      this.scope_[attr] = null;
    }, this);

    this.setupPositioning_();
  }

  /**
   * Handle changes to the step index.
   *
   * @param {?number} newVal The new index
   * @param {?number} oldVal The old index
   * @private
   */
  onIndexChange_(newVal, oldVal) {
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
      if (key == 'description' && Array.isArray(val)) {
        val = val.join('');
      }
      this.scope_[key] = val;
    }

    this['description'] = this.sce_.trustAsHtml(this.scope_['description']);
    this.setupOverlay_(true);

    this.setupPositioning_();
  }

  /**
   * Positions the onboarding step popover.
   *
   * @private
   */
  setupPositioning_() {
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

          var windowWidth = $(window).width();
          var popoverWidth = $('.js-onboarding__popover').outerWidth();
          if (this.scope_['position'] === 'right') {
            left = attachTo.offset().left + attachTo.outerWidth() + xMargin;
            right = windowWidth - attachTo.offset().left + xMargin;
            if (left + popoverWidth > windowWidth &&
                right + popoverWidth < windowWidth) {
              left = 'auto';
              this.scope_['position'] = 'left';
            } else {
              right = null;
            }
          } else if (this.scope_['position'] === 'left') {
            right = windowWidth - attachTo.offset().left + xMargin;
          } else if (this.scope_['position'] === 'top' || this.scope_['position'] === 'bottom') {
            left = attachTo.offset().left;
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
          var windowHeight = $(window).height();
          if (this.scope_['position'] === 'left' || this.scope_['position'] === 'right') {
            top = attachTo.offset().top;

            if (this.curStep_['verticalAlign'] == 'center') {
              top = top - $('.js-onboarding__popover').outerHeight() / 2 + this.getElementHeight_(attachTo) / 2;
            }
          } else if (this.scope_['position'] === 'bottom') {
            top = attachTo.offset().top + attachTo.outerHeight() + yMargin;
            var popoverHeight = $('.js-onboarding__popover').outerHeight();
            if (
            /* check if popover overflows bottom of window */
              (top + popoverHeight > windowHeight) &&
                /* check if popover on top would overflow top of window */
                (popoverHeight - attachTo.offset().top + yMargin <= 0)) {
              // switch to top
              top = null;
              this.scope_['position'] = 'top';
              bottom = windowHeight - attachTo.offset().top + yMargin;
            }
          } else if (this.scope_['position'] === 'top') {
            bottom = windowHeight - attachTo.offset().top + yMargin;
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
  }
}
