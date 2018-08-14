goog.provide('os.ui.menu.MenuButtonCtrl');

goog.require('goog.Disposable');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.menu.windows');


/**
 * Controller function for the menu button directive. Any button wishing to pop up a menu should extend this controller.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 * @ngInject
 */
os.ui.menu.MenuButtonCtrl = function($scope, $element) {
  os.ui.menu.MenuButtonCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The menu to pop up.
   * @type {os.ui.menu.Menu<T>|undefined}
   * @protected
   */
  this.menu = undefined;

  /**
   * If using ng-click to call toggle(), this flag will be passed to the UI toggle event.
   * @type {string|undefined}
   * @protected
   */
  this.flag = undefined;

  /**
   * If using ng-click to call toggle(), this metric key will be passed to the UI toggle event.
   * @type {string|undefined}
   * @protected
   */
  this.metricKey = undefined;

  /**
   * The anchor position on the button to display the menu.
   * @type {string}
   */
  this.btnPosition = 'left bottom';

  /**
   * The anchor position on the menu to position relative to the button.
   * @type {string}
   * @protected
   */
  this.menuPosition = 'left top+4';

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.menu.MenuButtonCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.menu.MenuButtonCtrl.prototype.disposeInternal = function() {
  os.ui.menu.MenuButtonCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Open the menu
 */
os.ui.menu.MenuButtonCtrl.prototype.openMenu = function() {
  if (this.menu) {
    this.scope['menu'] = true;
    os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);
    this.menu.open(undefined, {
      my: this.menuPosition,
      at: this.btnPosition,
      of: this.element || '#win-container'
    });
  }
};
goog.exportProperty(
    os.ui.menu.MenuButtonCtrl.prototype,
    'openMenu',
    os.ui.menu.MenuButtonCtrl.prototype.openMenu);


/**
 * Handle menu close
 * @protected
 */
os.ui.menu.MenuButtonCtrl.prototype.onMenuClose = function() {
  this.scope['menu'] = false;
};


/**
 * Toggles a window
 */
os.ui.menu.MenuButtonCtrl.prototype.toggle = function() {
  if (this.flag && !os.ui.menu.windows.openWindow(this.flag)) {
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, this.flag, null, null, this.metricKey);
    os.dispatcher.dispatchEvent(event);
  }
};
goog.exportProperty(
    os.ui.menu.MenuButtonCtrl.prototype,
    'toggle',
    os.ui.menu.MenuButtonCtrl.prototype.toggle);


/**
 * Checks if a window is open in the application
 * @param {string=} opt_flag The ID of the window to check
 * @return {boolean}
 */
os.ui.menu.MenuButtonCtrl.prototype.isWindowActive = function(opt_flag) {
  var flag = opt_flag || this.flag;

  if (flag) {
    var s = angular.element('#win-container').scope();
    return os.ui.window.exists(flag) || (s['mainCtrl'] && s['mainCtrl'][flag]);
  }

  return false;
};
goog.exportProperty(
    os.ui.menu.MenuButtonCtrl.prototype,
    'isWindowActive',
    os.ui.menu.MenuButtonCtrl.prototype.isWindowActive);
