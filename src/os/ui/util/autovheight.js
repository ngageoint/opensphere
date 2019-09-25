goog.provide('os.ui.util.AutoVHeightCtrl');
goog.provide('os.ui.util.autoVHeightDirective');

goog.require('goog.userAgent');
goog.require('os.config.ThemeSettingsChangeEvent');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.windowCommonElements');


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
 * useMaxHeight: Set to true to use max-height property instead of height
 * padding: An optional amount of the vh to add to caculation to give some space around the element.
 * omitOptionalCommonElements: Opt-out of being offset by application specific, additional elements.
 * @see {os.ui.windowCommonOptionalElements} for more detail.
 *
 * @return {angular.Directive}
 */
os.ui.util.autoVHeightDirective = function() {
  return {
    restrict: 'A',
    scope: {
      'siblings': '@',
      'padding': '@?',
      'minHeight': '@?',
      'autovheightDisabled': '=?',
      'useMaxHeight': '=?',
      'omitOptionalCommonElements': '<?'
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
 * @constructor
 * @ngInject
 */
os.ui.util.AutoVHeightCtrl = function($scope, $element) {
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
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = goog.dom.ViewportSizeMonitor.getInstanceForWindow();

  /**
   * @type {number}
   * @private
   */
  this.minHeight_ = this.scope_['minHeight'] != null ? this.scope_['minHeight'] : 20;

  /**
   * @type {string}
   * @private
   */
  this.heightProperty_ = (this.scope_['useMaxHeight'] != null && this.scope_['useMaxHeight'])
    ? 'max-height' : 'height';

  /**
   * @type {number}
   * @private
   */
  this.padding_ = this.scope_['padding'] != null ? this.scope_['padding'] : 0;

  /**
   * @type {?function()}
   * @private
   */
  this.resizeFn_ = null;

  if (!$scope['autovheightDisabled']) {
    this.onEnable_();
  }

  $scope.$watch('autovheightDisabled', function() {
    if (!$scope['autovheightDisabled']) {
      if (!this.resizeFn_) {
        this.onEnable_();
      }
    } else if (this.resizeFn_) {
      this.onDisable_();
    }
  }.bind(this));

  $scope.$on('resize', this.onResize_.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up listeners/references.
 *
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onDestroy_ = function() {
  if (!this.scope_['autovheightDisabled']) {
    this.onDisable_();
  }

  this.vsm_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onEnable_ = function() {
  this.resizeFn_ = this.onResize_.bind(this);
  this.addResizeListeners_();

  // there are some situations where resize won't fire on creation, particularly when using IE or when swapping DOM
  // elements with ng-if. this will make sure it fires as soon as Angular is done manipulating the DOM.
  os.ui.waitForAngular(this.resizeFn_);
};


/**
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onDisable_ = function() {
  this.removeResizeListeners_();
  this.element_.css('height', 'auto');
  this.resizeFn_ = null;
};


/**
 * Handle resize events from the parent or children.
 *
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.onResize_ = function() {
  if (this.element_ && this.resizeFn_) {
    var winHeight = window.innerHeight;

    var siblingHeight = 0;
    os.ui.windowCommonElements.forEach(function(sibling) {
      siblingHeight += ($(/** @type {string} */ (sibling)).outerHeight(true));
    });

    if (!this.scope_['omitOptionalCommonElements']) {
      goog.object.getValues(os.ui.windowCommonOptionalElements).forEach(function(sibling) {
        siblingHeight += ($(/** @type {string} */ (sibling)).outerHeight(true));
      });
    }

    if (this.scope_['siblings']) {
      $.makeArray($(this.scope_['siblings'])).forEach(function(sibling) {
        siblingHeight += ($(/** @type {string} */ (sibling)).outerHeight(true));
      });
    }

    var useableHeight = winHeight - siblingHeight;
    var vhHeight = this.minHeight_ + 'vh';
    if ((useableHeight / winHeight) * 100 > this.minHeight_) {
      vhHeight = ((useableHeight / winHeight) * 100 - this.padding_) + 'vh';
    }
    this.element_.css(this.heightProperty_, vhHeight);
  }
};


/**
 * Add resize handlers to siblings
 *
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.addResizeListeners_ = function() {
  if (this.scope_) {
    os.dispatcher.listen(os.config.ThemeSettingsChangeEvent, this.onResize_, false, this);
    this.vsm_.listen(goog.events.EventType.RESIZE, this.onResize_, false, this);

    // add resize to common elements
    var allCommonElements = goog.array.clone(os.ui.windowCommonElements);
    goog.object.extend(allCommonElements, os.ui.windowCommonOptionalElements);
    allCommonElements.forEach(function(sibling) {
      os.ui.resize($(/** @type {string} */ (sibling)), this.resizeFn_);
    }.bind(this));

    var siblings = /** @type {string} */ (this.scope_['siblings']);
    if (siblings) {
      os.ui.resize($(siblings), this.resizeFn_);
    }
  }
};


/**
 * Add resize handlers to siblings
 *
 * @private
 */
os.ui.util.AutoVHeightCtrl.prototype.removeResizeListeners_ = function() {
  if (this.scope_) {
    os.dispatcher.unlisten(os.config.ThemeSettingsChangeEvent, this.onResize_, false, this);
    this.vsm_.unlisten(goog.events.EventType.RESIZE, this.onResize_, false, this);

    // remove resize from common elements
    var allCommonElements = goog.array.clone(os.ui.windowCommonElements);
    goog.array.extend(allCommonElements, os.ui.windowCommonOptionalElements);
    allCommonElements.forEach(function(sibling) {
      if (this.resizeFn_) {
        os.ui.removeResize($(/** @type {string} */ (sibling)), this.resizeFn_);
      }
    }, this);

    var siblings = /** @type {string} */ (this.scope_['siblings']);
    if (siblings && this.resizeFn_) {
      try {
        os.ui.removeResize($(siblings), this.resizeFn_);
      } catch (e) {}
    }
  }
};
