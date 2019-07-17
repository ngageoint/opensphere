goog.provide('os.ui.MenuButtonCtrl');

goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.menu.windows');
goog.require('os.ui.windowSelector');



/**
 * Controller function for the menu button directive. Any button wishing
 * to pop up a menu should use a controller that extends this controller.
 *
 * @param {!angular.Scope} $scope The scope
 * @param {!angular.JQLite} $element The element
 * @constructor
 * @ngInject
 */
os.ui.MenuButtonCtrl = function($scope, $element) {
  /**
   * The menu to pop up
   * @type {?os.ui.action.ActionManager}
   * @protected
   */
  this.menu = null;

  /**
   * If using ng-click to call toggle(), this flag will be passed to
   * the UI toggle event.
   * @type {undefined|string}
   * @protected
   */
  this.flag = undefined;

  /**
   * If using ng-click to call toggle(), this metric key will be passed
   * to the UI toggle event.
   * @type {undefined|string}
   * @protected
   */
  this.metricKey = undefined;

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The position of the menu relative to this button. The default "top" aligns
   * the top of the menu with the bottom of the button. "bottom" does the inverse.
   * @type {string}
   * @protected
   */
  this.position = 'top';

  $scope.$on('$destroy', this.onDestroy.bind(this));
};


/**
 * Clean up
 *
 * @protected
 */
os.ui.MenuButtonCtrl.prototype.onDestroy = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Open the menu
 *
 * @export
 */
os.ui.MenuButtonCtrl.prototype.openMenu = function() {
  if (this.menu) {
    // To be consistent with bs4, if the menu is open and you click it again, close the menu
    if (this.scope['menu'] ||
        this.element.hasClass('active') ||
        this.element.hasClass('active-remove') ||
        this.element.hasClass('active-remove-active')) {
      this.scope['menu'] = false;
      this.element.blur();
    } else {
      this.scope['menu'] = true;
      os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);
      os.ui.openMenu(this.menu, this.position, this.element || undefined);
    }
  }

  os.ui.apply(this.scope);
};


/**
 * Handle menu close
 *
 * @protected
 */
os.ui.MenuButtonCtrl.prototype.onMenuClose = function() {
  this.scope['menu'] = false;
  this.element.blur();
};


/**
 * Toggles a window
 *
 * @export
 */
os.ui.MenuButtonCtrl.prototype.toggle = function() {
  if (this.flag && !os.ui.menu.windows.toggleWindow(this.flag)) {
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, this.flag, null, null, this.metricKey);
    os.dispatcher.dispatchEvent(event);
  }
};


/**
 * Checks if a window is open in the application
 *
 * @param {string=} opt_flag The ID of the window to check
 * @return {boolean}
 * @export
 */
os.ui.MenuButtonCtrl.prototype.isWindowActive = function(opt_flag) {
  var flag = opt_flag || this.flag;

  if (flag) {
    var s = angular.element(os.ui.windowSelector.CONTAINER).scope();
    return os.ui.window.exists(flag) || (s['mainCtrl'] && s['mainCtrl'][flag]);
  }

  return false;
};
