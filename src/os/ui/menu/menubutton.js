goog.provide('os.ui.menu.MenuButtonCtrl');

goog.require('goog.Disposable');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.menu.windows');
goog.require('os.ui.windowSelector');


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
  this.menuPosition = 'left top+3';

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
 *
 * @export
 */
os.ui.menu.MenuButtonCtrl.prototype.openMenu = function() {
  if (this.menu) {
    // To be consistent with bs4, if the menu is open and you click it again, close the menu
    if (this.scope['menu']) {
      this.scope['menu'] = false;
      this.element.blur();
      this.menu.close();
    } else {
      this.scope['menu'] = true;
      os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);
      this.menu.open(undefined, {
        my: this.menuPosition,
        at: this.btnPosition,
        of: this.element || os.ui.windowSelector.CONTAINER,
        within: $(document.firstElementChild)
      });
    }
  }

  os.ui.apply(this.scope);
};


/**
 * Handle menu close
 *
 * @protected
 */
os.ui.menu.MenuButtonCtrl.prototype.onMenuClose = function() {
  this.scope['menu'] = false;
  this.element.blur();
};


/**
 * Toggles a window
 *
 * @export
 */
os.ui.menu.MenuButtonCtrl.prototype.toggle = function() {
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
os.ui.menu.MenuButtonCtrl.prototype.isWindowActive = function(opt_flag) {
  var flag = opt_flag || this.flag;

  if (flag) {
    var s = angular.element(os.ui.windowSelector.CONTAINER).scope();
    return os.ui.window.exists(flag) || (s['mainCtrl'] && s['mainCtrl'][flag]);
  }

  return false;
};
