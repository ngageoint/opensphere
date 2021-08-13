goog.module('os.ui.UISwitchUI');
goog.module.declareLegacyNamespace();

const Delay = goog.require('goog.async.Delay');
const log = goog.require('goog.log');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const UISwitchEventType = goog.require('os.ui.UISwitchEventType');

const Logger = goog.requireType('goog.log.Logger');


/**
 * A directive which takes a list of items and creates a common directive that controls them
 *
 * Each item in items is passed to the directive function. That function then returns
 * the directive string (e.g. 'my-directive'). The generic directive is used when the
 * directive function returns null or when more than one directive is found for a set
 * of items.
 *
 * The items array is placed on the scope as 'items' for the resulting directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<div></div>',
  scope: {
    'items': '=',
    'directiveFunction': '=',
    'options': '=?',
    'scopeUpdateFunction': '=?',
    'generic': '@',
    'alwaysSwitch': '@'
  },
  controller: Controller,
  controllerAs: 'uiSwitch'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'uiswitch';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the UI switch directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * If the UI should be switched even when the directive doesn't change.
     * @type {boolean}
     * @private
     */
    this.alwaysSwitch_ = this.scope['alwaysSwitch'] === 'true';

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.currUI_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.lastUI_ = null;

    /**
     * @type {?angular.$compile}
     * @private
     */
    this.compile_ = $compile;

    /**
     * @type {Array.<function()>}
     * @private
     */
    this.destroyers_ = [];

    this.destroyers_.push($scope.$watch('items', this.onDataChange_.bind(this)));
    $scope.$on(UISwitchEventType.UPDATE, this.update_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));

    /**
     * @type {?MutationObserver}
     * @private
     */
    this.observer_ = null;

    /**
     * @type {?Delay}
     * @private
     */
    this.delay_ = null;

    if ('MutationObserver' in window && MutationObserver) {
      this.observer_ = new MutationObserver(this.onChange_.bind(this));
      this.observer_.observe(this.element_[0], /** @type {MutationObserverInit} */ ({'childList': true}));
    } else {
      // This should take care of older browsers, but can cause a race condition. Especially the first time that
      // a templateUrl is loaded.
      this.delay_ = new Delay(this.onChange_, 25, this);
    }

    this.update_();
  }

  /**
   * Handles changes to $scope.items
   *
   * @param {*} newVal
   * @param {*} oldVal
   * @private
   */
  onDataChange_(newVal, oldVal) {
    this.update_();
  }

  /**
   * Updates the displayed UI
   *
   * @private
   */
  update_() {
    var x = this.scope['items'];

    var items = Array.isArray(x) ? /** @type {Array} */ (x) : [x];
    var ui = /** @type {function(*):string} */ (this.scope['directiveFunction']);
    var generic = /** @type {string} */ (this.scope['generic']) || null;

    /** @type {?string} */
    var newUI = null;

    log.fine(logger, 'Checking UI ui: ' + ui + ' items: ' + items + ' generic: ' + generic);

    if (items && ui) {
      for (var i = 0, n = items.length; i < n; i++) {
        // get the directive from the item
        var u = ui(items[i]);

        if (newUI && newUI != u) {
          // it is different from another item in the list, so we'll default to the generic directive
          newUI = generic;
          break;
        } else {
          // first time, so set it
          newUI = u;
        }
      }
    }

    log.fine(logger, 'The new UI is ' + newUI);

    if (this.alwaysSwitch_ || newUI != this.lastUI_) {
      this.remove_();

      if (newUI) {
        var html = '<' + newUI + '></' + newUI + '>';

        // make a new scope
        var s = this.scope.$new();

        // put the items on the scope
        s['items'] = items;

        this.addToScope(s);

        // compile
        // This cast should not be necessary, are we missing something in the externs?
        this.currUI_ = /** @type {?angular.JQLite} */ (this.compile_(html)(s));
        this.element_.append(this.currUI_);

        if (this.delay_) {
          this.delay_.start();
        }
      }
    } else if (this.currUI_) {
      // update the items on the scope
      s = this.currUI_.scope();
      s['items'] = items;

      apply(s);
    }

    this.lastUI_ = newUI;
  }

  /**
   * Adds stuff onto the scope if necessary
   *
   * @param {!angular.Scope} scope
   * @protected
   */
  addToScope(scope) {
    var scopeUpdateFunction = /** @type {function(angular.Scope)} */ (this.scope['scopeUpdateFunction']);
    if (scopeUpdateFunction) {
      scopeUpdateFunction(scope);
    }
  }

  /**
   * Handles resizing on the inner directive
   *
   * @private
   */
  onChange_() {
    this.scope.$emit('controls.changed', this.element_.outerWidth(), this.element_.outerHeight());
  }

  /**
   * Removes the current UI
   *
   * @private
   */
  remove_() {
    if (this.currUI_) {
      this.scope.$emit('controls.changed', -this.element_.outerWidth(), -this.element_.outerHeight());
      var s = this.currUI_.scope();
      this.currUI_.remove();

      if (s) {
        s.$destroy();
      }

      this.currUI_ = null;
      this.lastUI_ = null;
    }
  }

  /**
   * Cleans up the property change listener
   *
   * @private
   */
  onDestroy_() {
    for (var i = 0, n = this.destroyers_.length; i < n; i++) {
      this.destroyers_[i]();
    }

    if (this.observer_) {
      this.observer_.disconnect();
      this.observer_ = null;
    }

    if (this.delay_) {
      this.delay_.stop();
      this.delay_.dispose();
      this.delay_ = null;
    }

    this.remove_();
    this.scope = null;
    this.element_ = null;
    this.compile_ = null;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.UISwitchUI');

exports = {
  Controller,
  directive,
  directiveTag
};
