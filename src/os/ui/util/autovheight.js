goog.provide('os.ui.util.AutoVHeightCtrl');
goog.provide('os.ui.util.autoVHeightDirective');

goog.require('goog.userAgent');
goog.require('os.ui');
goog.require('os.ui.Module');


/**
 * A directive to automatically size a component to a percentage of the viewport height. Available space is determined
 * by subtracting the height of all siblings matching the supplied CSS selector from the overall height of the window.
 * The element using this directive will be automatically resized when the parent size or sibling size changes.
 * NOTE: Siblings are any elements that share the overall height with the target element
 *
 * Example:
 * ```
 *     <div class="sibling-el1"></div>
 *     <div class="sibling-el2"></div>
 *     <div class="this-el" autovheight siblings=".sibling-el1, .sibling-el2, .sibling-el2"></div>
 *     <div class="sibling-el3"></div>
 *
 * ```
 * minHeight: The smallest vh that the element will take. Defaults to 20.
 * padding: An optional amount of the vh to add to caculation to give some space around the element.
 *
 * @return {angular.Directive}
 */
os.ui.util.autoVHeightDirective = function() {
  return {
    restrict: 'A',
    scope: {
      'siblings': '@',
      'padding': '@?',
      'minHeight': '@?'
    },
    controller: os.ui.util.AutoVHeightCtrl
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('autovheight', [os.ui.util.autoVHeightDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$injector} $injector
 * @constructor
 * @ngInject
 */
os.ui.util.AutoVHeightCtrl = function($scope, $element, $injector) {
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

  this['minHeight'] = goog.isDefAndNotNull(this.scope_['minHeight']) ? this.scope_['minHeight'] : 20;
  this['padding'] = goog.isDefAndNotNull(this.scope_['padding']) ? this.scope_['padding'] : 0;

  /**
   * Debounce resize events over a brief period.
   * @type {Function}
   * @private
   */
  this.resizeFn_ = this.onResize_.bind(this);

  var parent = $element.parent();
  parent.resize(this.resizeFn_);

  this['siblings'] = /** @type {string} */ ($scope['siblings']).split(' ');
  if (this['siblings']) {
    for (var i = 0; i < this['siblings'].length; i++) {
      $(this['siblings'][i]).resize(this.resizeFn_);
    }
  }

  // there are some situations where resize won't fire on creation, particularly when using IE or when swapping DOM
  // elements with ng-if. this will make sure it fires as soon as Angular is done manipulating the DOM.
  os.ui.waitForAngular(this.onResize_.bind(this));

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up listeners/references.
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onDestroy_ = function() {
  var parent = this.element_.parent();
  parent.removeResize(this.resizeFn_);

  if (this['siblings']) {
    try {
      for (var i = 0; i < this['siblings'].length; i++) {
        var sib = /** @type {angular.JQLite} */ ($(this['siblings'][i]));
        sib.removeResize(this.resizeFn_);
      }
    } catch (e) {}
  }

  this.resizeFn_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * Handle resize events from the parent or children.
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onResize_ = function() {
  if (this.element_) {
    var winHeight = window.innerHeight;

    var siblingHeight = 0;
    if (this['siblings']) {
      for (var i = 0; i < this['siblings'].length; i++) {
        siblingHeight += $(this['siblings'][i]).outerHeight();
      }
    }

    var useableHeight = winHeight - siblingHeight;

    var vhHeight = this['minHeight'] + 'vh';
    if ((useableHeight / winHeight) * 100 > this['minHeight']) {
      vhHeight = ((useableHeight / winHeight) * 100 - this['padding']) + 'vh';
    }
    this.element_.css('height', vhHeight);
  }
};
