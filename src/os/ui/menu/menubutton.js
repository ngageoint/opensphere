goog.module('os.ui.menu.MenuButtonCtrl');

const Disposable = goog.require('goog.Disposable');
const dispatcher = goog.require('os.Dispatcher');
const {apply} = goog.require('os.ui');
const GlobalMenuEventType = goog.require('os.ui.GlobalMenuEventType');
const UIEvent = goog.require('os.ui.events.UIEvent');
const UIEventType = goog.require('os.ui.events.UIEventType');
const {toggleWindow} = goog.require('os.ui.menu.windows');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');

const Menu = goog.requireType('os.ui.menu.Menu');


/**
 * Controller function for the menu button directive. Any button wishing to pop up a menu should extend this controller.
 *
 * @template T
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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
     * @type {Menu<T>|undefined}
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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * Open the menu
   *
   * @export
   */
  openMenu() {
    if (this.menu) {
      // To be consistent with bs4, if the menu is open and you click it again, close the menu
      if (this.scope['menu']) {
        this.scope['menu'] = false;
        this.element.blur();
        this.menu.close();
      } else {
        this.scope['menu'] = true;
        dispatcher.getInstance().listenOnce(GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);
        this.menu.open(undefined, {
          my: this.menuPosition,
          at: this.btnPosition,
          of: this.element || windowSelector.CONTAINER,
          within: $(document.firstElementChild)
        });
      }
    }

    apply(this.scope);
  }

  /**
   * Handle menu close
   *
   * @protected
   */
  onMenuClose() {
    this.scope['menu'] = false;
    this.element.blur();
  }

  /**
   * Toggles a window
   *
   * @export
   */
  toggle() {
    if (this.flag && !toggleWindow(this.flag)) {
      var event = new UIEvent(UIEventType.TOGGLE_UI, this.flag, null, null, this.metricKey);
      dispatcher.getInstance().dispatchEvent(event);
    }
  }

  /**
   * Checks if a window is open in the application
   *
   * @param {string=} opt_flag The ID of the window to check
   * @return {boolean}
   * @export
   */
  isWindowActive(opt_flag) {
    var flag = opt_flag || this.flag;

    if (flag) {
      var s = angular.element(windowSelector.CONTAINER).scope();
      if (s) {
        return osWindow.exists(flag) || (s['mainCtrl'] && s['mainCtrl'][flag]);
      }
    }

    return false;
  }
}

exports = Controller;
