goog.declareModuleId('os.ui.MenuButtonCtrl');

import * as dispatcher from '../dispatcher.js';
import UIEvent from './events/uievent.js';
import UIEventType from './events/uieventtype.js';
import {openMenu} from './globalmenu.js';
import GlobalMenuEventType from './globalmenueventtype.js';
import * as windows from './menu/windowsmenu.js';
import * as ui from './ui.js';
import * as osWindow from './window.js';
import windowSelector from './windowselector.js';

const {default: ActionManager} = goog.requireType('os.ui.action.ActionManager');


/**
 * Controller function for the menu button directive. Any button wishing
 * to pop up a menu should use a controller that extends this controller.
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * The menu to pop up
     * @type {?ActionManager}
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
  }

  /**
   * Clean up
   *
   * @protected
   */
  onDestroy() {
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
      if (this.scope['menu'] ||
          this.element.hasClass('active') ||
          this.element.hasClass('active-remove') ||
          this.element.hasClass('active-remove-active')) {
        this.scope['menu'] = false;
        this.element.blur();
      } else {
        this.scope['menu'] = true;
        dispatcher.getInstance().listenOnce(GlobalMenuEventType.MENU_CLOSE, this.onMenuClose, false, this);
        openMenu(this.menu, this.position, this.element || undefined);
      }
    }

    ui.apply(this.scope);
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
    if (this.flag && !windows.toggleWindow(this.flag)) {
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
      return osWindow.exists(flag) || (s['mainCtrl'] && s['mainCtrl'][flag]);
    }

    return false;
  }
}
