goog.declareModuleId('os.ui.util.AutoHeightUI');

import Module from '../module.js';
import * as ui from '../ui.js';


/**
 * A directive to automatically size a component to a percentage of available space. Available space is determined
 * by subtracting the height of all siblings matching the supplied CSS selector from the height of the parent. The
 * element using this directive will be automatically resized when the parent size or sibling size changes.
 *
 * Example:
 * ```
 *   <div class="parent-el">
 *     <div class="sibling-el1"></div>
 *     <div class="sibling-el2"></div>
 *     <div class="this-el" autoheight siblings=".sibling-el1, .sibling-el2, .sibling-el2"></div>
 *     <div class="sibling-el3"></div>
 *   </div>
 * ```
 *
 * The default height is 100% of available space, but height can be specified as a percent (with or without the %),
 * or a decimal percentage (0-1). To specify a custom height using the example above, change the 'autoheight'
 * attribute to 'autoheight="50%"'.
 *
 * Note: This directive depends on jquery.resize, so make sure that library is loaded when using this.
 *
 * @todo Should this also handle width?
 * @todo Include padding in the calculation? This could be helpful when using the directive on multiple siblings.
 * @todo Should the height be a two-way binding? May be necessary if siblings use the directive, but aren't always
 *       visible.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'A',
  scope: {
    'parent': '@',
    'siblings': '@',
    'height': '@autoheight',
    'minHeight': '@minheight'
  },
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'autoheight';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$injector} $injector
   * @ngInject
   */
  constructor($scope, $element, $injector) {
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
     * @type {number}
     * @private
     */
    this.height_ = 1;
    this.initHeight_();

    /**
     * Debounce resize events over a brief period.
     * @type {Function}
     * @private
     */
    this.resizeFn_ = this.onResize_.bind(this);

    /**
     * The parent element to use for determining max height.
     * @type {?angular.JQLite}
     * @private
     */
    this.parent_ = this.getParent_();

    if (this.parent_) {
      // listen for parent size changes
      ui.resize(this.parent_, this.resizeFn_);

      // listen for sibling resize changes
      var siblings = /** @type {string} */ ($scope['siblings']);
      if (siblings) {
        ui.resize(this.parent_.find(siblings), this.resizeFn_);
      }

      // there are some situations where resize won't fire on creation, particularly when using IE or when swapping DOM
      // elements with ng-if. this will make sure it fires as soon as Angular is done manipulating the DOM.
      ui.waitForAngular(this.onResize_.bind(this));
    }

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up listeners/references.
   *
   * @private
   */
  onDestroy_() {
    if (this.parent_) {
      ui.removeResize(this.parent_, this.resizeFn_);

      var siblings = /** @type {string} */ (this.scope_['siblings']);
      if (siblings) {
        ui.removeResize(this.parent_.find(siblings), this.resizeFn_);
      }

      this.parent_ = null;
    }

    this.resizeFn_ = null;
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * Get the parent for the directive.
   *
   * @return {?angular.JQLite}
   * @private
   */
  getParent_() {
    var parent = null;

    if (this.scope_ && this.element_) {
      var immediateParent = this.element_.parent();

      var parentSelector = /** @type {string|undefined} */ (this.scope_['parent']);
      if (parentSelector) {
        // start searching from the parent, because we don't want to match the current element
        parent = immediateParent.closest(parentSelector);
      }

      if (!parent || !parent.length) {
        // parent hasn't been found, use the immediate parent
        parent = immediateParent;
      }
    }

    return parent;
  }

  /**
   * Initialize the height multiplier from the scope.
   *
   * @private
   */
  initHeight_() {
    if (this.scope_['height']) {
      var height = Number(this.scope_['height'].replace(/%/, ''));
      if (isNaN(height) || height > 100 || height <= 0) {
        // default to 100% if the height can't be parsed, is negative, or greater than 100 because any of those
        // are the result of an incorrect directive definition
        height = 1;
      } else if (height > 1 && height <= 100) {
        // convert percents from >1 to 100 to a decimal
        height /= 100;
      }

      this.height_ = height;
    }
  }

  /**
   * Handle resize events from the parent or children.
   *
   * @private
   */
  onResize_() {
    if (this.element_ && this.parent_) {
      var siblingHeight = 0;
      var siblings = /** @type {string} */ (this.scope_['siblings']);
      if (siblings) {
        this.parent_.find(siblings).each(function(index) {
          // include padding, borders, margin in the height calculation
          siblingHeight += $(this).outerHeight(true);
        });
      }

      var minHeight = Number(this.scope_['minHeight']) || 0;
      var height = Math.max((this.parent_.height() - siblingHeight) * this.height_, minHeight);
      this.element_.css('height', height + 'px');
    }
  }
}
