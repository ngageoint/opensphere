goog.provide('plugin.im.action.feature.ui.ActionConfigCtrl');

goog.require('goog.Disposable');
goog.require('os.fn');
goog.require('os.ui.window');



/**
 * Base controller for configuring a feature action.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 * @ngInject
 */
plugin.im.action.feature.ui.ActionConfigCtrl = function($scope, $element) {
  plugin.im.action.feature.ui.ActionConfigCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root element for the directive.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The feature action.
   * @type {T}
   * @protected
   */
  this.action = /** @type {T|undefined} */ ($scope['action']);

  /**
   * The feature action.
   * @type {string}
   * @protected
   */
  this.type = /** @type {string|undefined} */ ($scope['type']) || '';

  // set up values on the confirm directive scope
  $scope.$parent['confirmCallback'] = this.saveAction.bind(this);
  $scope.$parent['confirmValue'] = this.action;

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(plugin.im.action.feature.ui.ActionConfigCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.ActionConfigCtrl.prototype.disposeInternal = function() {
  plugin.im.action.feature.ui.ActionConfigCtrl.base(this, 'disposeInternal');

  this.action = null;
  this.element = null;
  this.scope = null;
};


/**
 * Initialize the UI from the action.
 *
 * @protected
 */
plugin.im.action.feature.ui.ActionConfigCtrl.prototype.initialize = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.WindowEventType.READY);
  }
};


/**
 * Save changes to the action.
 * @protected
 */
plugin.im.action.feature.ui.ActionConfigCtrl.prototype.saveAction = os.fn.noop;
