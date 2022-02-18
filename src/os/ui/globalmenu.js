goog.declareModuleId('os.ui.GlobalMenuUI');

import * as dispatcher from '../dispatcher.js';
import {isObject} from '../object/object.js';
import {Controller as ActionMenuCtrl, directive as actionMenuDirective} from './actionmenu.js';
import GlobalMenuEventType from './globalmenueventtype.js';
import Module from './module.js';
import * as ui from './ui.js';

const Delay = goog.require('goog.async.Delay');
const {getDocument, getViewportSize} = goog.require('goog.dom');
const GoogEventType = goog.require('goog.events.EventType');

const {default: ActionManager} = goog.requireType('os.ui.action.ActionManager');


/**
 * Defines a global menu directive. You should only need one of these. See `openMenu`.
 *
 * @return {angular.Directive} the directive definition
 */
export const directive = () => {
  var dir = actionMenuDirective();
  dir['scope'] = true;
  dir['controller'] = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'global-menu';

Module.directive('globalMenu', directive);

/**
 * Controller function for the ActionMenu directive
 * @unrestricted
 */
export class Controller extends ActionMenuCtrl {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @param {angular.JQLite} $element
   * @param {angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    this.element.removeClass('show');
    this.onDownBind_ = this.onClick_.bind(this);

    /**
     * @type {angular.JQLite|string|null}
     */
    this.target = null;

    /**
     * @type {({left:number,top:number}|undefined|!jQuery)}
     */
    this.targetOffset = undefined;

    /**
     * @type {Delay}
     * @private
     */
    this.listenerDelay_ = new Delay(this.onAddOutsideListener_, 25, this);
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    this.listenerDelay_.dispose();
    this.listenerDelay_ = null;
  }

  /**
   * Closes an already-open menu and dispatches a menu close event
   *
   * @param {boolean=} opt_dispatch
   */
  close(opt_dispatch) {
    if (opt_dispatch === undefined) {
      opt_dispatch = true;
    }

    this.target = null;
    this.targetOffset = undefined;

    if (this.element.hasClass('show')) {
      if (opt_dispatch && dispatcher.getInstance()) {
        dispatcher.getInstance().dispatchEvent(GlobalMenuEventType.MENU_CLOSE);
      }

      this.element.removeClass('show');
      this.element.removeClass('right-menu');
      this.element.blur();
    }
    this.element.find('#js-global-menu__title').remove();

    var doc = getDocument();
    doc.removeEventListener(GoogEventType.MOUSEDOWN, this.onDownBind_, true);
    doc.removeEventListener(GoogEventType.POINTERDOWN, this.onDownBind_, true);
    doc.removeEventListener(GoogEventType.SCROLL, this.onScroll_.bind(this), true);

    ui.apply(this.scope);
  }

  /**
   * Opens a menu
   */
  open() {
    ui.apply(this.scope);
    this.listenerDelay_.start();
  }

  /**
   * @private
   */
  onAddOutsideListener_() {
    var doc = getDocument();
    doc.addEventListener(GoogEventType.MOUSEDOWN, this.onDownBind_, true);
    doc.addEventListener(GoogEventType.POINTERDOWN, this.onDownBind_, true);
    doc.addEventListener(GoogEventType.SCROLL, this.onScroll_.bind(this), true);
  }

  /**
   * Click handler
   *
   * @param {Event} e
   * @private
   */
  onClick_(e) {
    // if we didn't click on something in the menu
    if (!$(e.target).closest('#js-global-menu').length) {
      // close the menu
      this.close();
    }
  }

  /**
   * @inheritDoc
   */
  invoke(action) {
    if (super.invoke(action) && !action.doNotCloseOnInvoke) {
      this.close();
      return true;
    }

    return false;
  }

  /**
   * Checks the position and ensures that the menu doesn't run off the screen
   *
   * @override
   * @protected
   */
  position() {
    var element = this.element;
    var pos = this.scope['position'] || element.position();

    this.timeout(function() {
      if (isObject(pos)) {
        var x = pos.left || pos.right || pos.x;
        var y = pos.top || pos.bottom || pos.y;
        var w = element.outerWidth();
        var h = element.outerHeight();
        var viewportSize = getViewportSize();

        if (x + w > viewportSize.width - 5) {
          x = viewportSize.width - 5 - w;
          element.addClass('right-menu');
        } else if (x + 2 * w > viewportSize.width - 5) {
          element.addClass('right-menu');
        }

        x = x < 0 ? 5 : x;
        y = y < 0 ? 5 : y;

        // offset the menu from the bottom if it's too tall
        var yThreshold = 50;
        if (y + h > viewportSize.height - yThreshold) {
          y = viewportSize.height - yThreshold - h;
        }

        // clear everything before setting
        element.css('top', '');
        element.css('bottom', '');
        element.css('left', '');
        element.css('right', '');

        element.css(pos['right'] !== undefined ? 'right' : 'left', x + 'px');
        element.css(pos['bottom'] !== undefined ? 'bottom' : 'top', y + 'px');
      } else if (pos == 'right') {
        element.addClass('right-menu');
      }

      element.addClass('show');
    }, 5);
  }

  /**
   * Set target
   *
   * @param {angular.JQLite|string} target
   */
  setTarget(target) {
    this.target = target;
    this.targetOffset = $(target).offset();
  }

  /**
   * Close window if target position changed
   *
   * @private
   */
  onScroll_() {
    if (this.targetOffset) {
      var currPos = $(this.target).offset();
      if (this.targetOffset['left'] != currPos['left'] || this.targetOffset['top'] != currPos['top']) {
        Controller.closeMenu();
      }
    }
  }

  /**
   * Allow closing the current global menu if its up
   */
  static closeMenu() {
    var menuEl = angular.element('#js-global-menu');
    var s = menuEl.scope();
    var ctrl = /** @type {Controller} */ (s['actionMenu']);

    // close any open menu
    ctrl.close();
  }
}

/**
 * Opens a menu
 *
 * @param {ActionManager} provider The action menu manager that supplies the menu
 * @param {{
 *  x: (number|undefined),
 *  y: (number|undefined),
 *  left: (number|undefined),
 *  right: (number|undefined),
 *  top: (number|undefined),
 *  bottom: (number|undefined)
 *  }|string} position The position relative to the target
 * @param {(angular.JQLite|string)=} opt_target An optional target selector to position from
 * @param {?angular.JQLite=} opt_root Optional root element containing the target
 * @param {?string=} opt_title Optional title html for the menu
 */
export const openMenu = function(provider, position, opt_target, opt_root, opt_title) {
  var menuEl = angular.element('#js-global-menu');
  var s = menuEl.scope();
  s['provider'] = provider;
  var ctrl = /** @type {Controller} */ (s['actionMenu']);
  Controller.closeMenu();

  // update the menu title if provided
  if (opt_title) {
    ctrl.addTitle('#js-global-menu', '<div id="js-global-menu__title" class="text-truncate">' + opt_title + '</div>');
  }

  if (opt_target) {
    ctrl.setTarget(opt_target);
  }

  var timeout = /** @type {angular.$timeout} */ (ui.injector.get('$timeout'));
  if (timeout) {
    // the menu may need to be updated before we position it, in particular for right orientation. call the positioning
    // logic after a timeout so the menu is reconstructed first.
    timeout(goog.partial(positionMenu, position, opt_target, opt_root));
  } else {
    // this shouldn't happen, but if it does we don't want to prevent the menu from being opened
    positionMenu(position, opt_target, opt_root);
  }
};


/**
 * Opens a menu
 *
 * @param {{
 *  x: (number|undefined),
 *  y: (number|undefined),
 *  left: (number|undefined),
 *  right: (number|undefined),
 *  top: (number|undefined),
 *  bottom: (number|undefined)
 *  }|string} position The position relative to the target
 * @param {(angular.JQLite|string)=} opt_target An optional target selector to position from
 * @param {?angular.JQLite=} opt_root Optional root element containing the target
 */
const positionMenu = function(position, opt_target, opt_root) {
  var menuEl = angular.element('#js-global-menu');
  var s = menuEl.scope();
  var ctrl = /** @type {Controller} */ (s['actionMenu']);

  var targetEl;
  if (typeof opt_target === 'string') {
    // target is a selector from the document or a root element
    targetEl = opt_root != null ? opt_root.find(opt_target) : angular.element(opt_target);
  } else if (opt_target !== undefined) {
    // target is an element
    targetEl = opt_target;
  }

  var p = position;
  if (targetEl != null) {
    var pos = /** @type {{left: number, top:number}} */ (targetEl.offset());
    if (pos.top) {
      pos.top -= $(document).scrollTop();
    }
    if (typeof position === 'string') {
      var parts = position.split(/\s+/);
      position = parts[0];
      var offset = parts.length > 1 ? parseInt(parts[1], 10) : 2;

      if (position == 'right') {
        // align the right edges of the target/menu, position offset px below the target
        var menuX = pos.left - menuEl.outerWidth() + targetEl.outerWidth();
        var menuY = pos.top + targetEl.outerHeight() + offset;
        p = /** @type {{x: number, y: number}} */ ({x: menuX, y: menuY});
      } else if (position == 'bottom') {
        // align the bottom edge of the menu with the offset px above the top edge of the target
        menuY = pos.top - offset;
        p = {x: pos.left, bottom: menuEl.parent().outerHeight() - menuY};
      } else {
        // align the left edges of the target/menu, position offset below the target
        p = {x: pos.left, y: pos.top + targetEl.outerHeight() + offset};
      }
    } else {
      p.x += pos.left;
      p.y += pos.top;
    }
  }

  s = menuEl.scope();
  s['position'] = p;

  // if we want to support animation in the future, this needs to be delayed by the amount of
  // time it takes the animation to finish
  ctrl.open();
};
