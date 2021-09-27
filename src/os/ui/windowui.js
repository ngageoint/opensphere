goog.declareModuleId('os.ui.WindowUI');

import './onboarding/contextonboarding.js';
import * as dispatcher from '../dispatcher.js';
import {ROOT, isOSX} from '../os.js';
import UIEvent from './events/uievent.js';
import UIEventType from './events/uieventtype.js';
import Module from './module.js';
import {apply, removeResize, resize} from './ui.js';
import {cascade, close, getById, getOpenWindows, registerWindow, sortByZIndex, stack, toggleVisibility, unregisterWindow} from './window.js';
import windowCommonElements from './windowcommonelements.js';
import WindowEventType from './windoweventtype.js';
import windowSelector from './windowselector.js';

const Disposable = goog.require('goog.Disposable');
const {fail} = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const log = goog.require('goog.log');
const {createUniqueString} = goog.require('goog.string');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: HeaderBtnConfig} = goog.requireType('os.ui.window.HeaderBtnConfig');


/**
 * A draggable, resizable window. The directive uses transclusion, meaning that you
 * can place custom content into the window.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  transclude: true,
  scope: {
    'id': '@',
    'helpContext': '@',
    'windowTooltip': '@',
    'minWidth': '@',
    'maxWidth': '@',
    'minHeight': '@',
    'maxHeight': '@',
    'x': '@',
    'y': '@',
    'width': '@',
    'headerClass': '@',
    'height': '@',
    'label': '@',
    'icon': '@',
    'iconHtml': '@',
    'showClose': '=',
    'showHide': '=',
    'showCollapse': '=',
    'overlay': '@',
    'modal': '=',
    'disableDrag': '@',
    'windowContainer': '@',
    /* Array<HeaderBtnConfig> */
    'headerBtns': '=?',
    'border': '=',
    'bottom': '=?'
  },
  templateUrl: ROOT + 'views/window/window.html',
  controller: Controller,
  controllerAs: 'windowCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'window';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the draggable window directive. You must have mark the window container
 * with <code>id="js-window__container"</code>.
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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

    $scope['windowContainer'] = $scope['windowContainer'] || windowSelector.CONTAINER;
    var container = angular.element($scope['windowContainer']);

    // If there is no scope id. Make one
    if (!$scope['id']) {
      $scope['id'] = createUniqueString();
    }

    $element[0].id = $scope['id'];

    this.getWindowKeys().forEach(function(key) {
      registerWindow(key, this.element[0]);
    }, this);

    if ($scope['x'] == 'center') {
      $scope['x'] = (container.width() - $scope['width']) / 2;
    }

    if ($scope['bottom'] != null && $scope['bottom'] != 'auto') {
      $element.css('top', 'auto');
      $element.css('bottom', $scope['bottom'] + 'px');
    } else if ($scope['y'] == 'center') {
      var maxHeight = Math.min($(window).height(), container.height());
      if ($scope['height'] == 'auto') {
        // Put the element off the screen at the top
        $element.css('top', '-20000px');

        var readyPromise;
        var readyOff;
        var onWindowReady = function() {
          if (this.element && this.scope) {
            // Try cascading the window first. If there aren't any windows to cascade against, use the config.
            if (!this.cascade()) {
              var height = this.element.height();
              this.scope['y'] = (maxHeight - height) / 2;
              this.element.css('top', this.scope['y'] + 'px');
            }

            this.constrainWindow_();
          }
        }.bind(this);

        // make sure the window gets positioned eventually. windows should fire a WindowEventType.READY event to
        // indicate they are initialized and ready to be positioned.
        readyPromise = $timeout(function() {
          // fail an assertion to make this more obvious in debug mode, and log a warning otherwise.
          var errorMessage = 'Window READY event was not fired for "' + $scope['label'] + '"!';
          fail(errorMessage);
          log.warning(logger, errorMessage);

          readyOff();
          onWindowReady();
        }, 1000);

        readyOff = $scope.$on(WindowEventType.READY, function() {
          $timeout.cancel(readyPromise);
          onWindowReady();
        });
      } else {
        $scope['y'] = (maxHeight - $scope['height']) / 2;
      }
    }

    if ($scope['x'] < 0) {
      $scope['x'] = container.width() - Number($scope['width']) + Number($scope['x']);
    }

    if ($scope['y'] < 0) {
      $scope['y'] = container.height() - Number($scope['height']) + Number($scope['y']);
    }

    if (this.scope['modal']) {
      this.addModalBg();
    }

    // make the element draggable
    if (!$scope['disableDrag']) {
      var handler = $scope['overlay'] ?
        (windowSelector.HEADER + ', .js-window-overlay-content') : windowSelector.HEADER;
      var dragConfig = {
        'containment': $scope['windowContainer'],
        'handle': handler,
        'start': this.onDragStart_.bind(this),
        'stop': this.onDragStop_.bind(this),
        'scroll': false
      };
      $element.draggable(dragConfig);
    }

    /**
     * @type {boolean}
     * @private
     */
    this.resizable_ = false;

    if (($scope['minWidth'] && $scope['maxWidth'] && $scope['minWidth'] != $scope['maxWidth']) ||
        ($scope['minHeight'] && $scope['maxHeight'] && $scope['minHeight'] != $scope['maxHeight'])) {
      // make the element resizable. the height/width values must be numbers, or jquery calculations won't work
      // correctly (see THIN-4244).
      var resizeConfig = {
        'containment': $scope['windowContainer'],
        'minWidth': Number($scope['minWidth']) || 200,
        'maxWidth': Number($scope['maxWidth']) || window.screen.availWidth,
        'minHeight': Number($scope['minHeight']) || 100,
        'maxHeight': Number($scope['maxHeight']) || window.screen.availHeight,
        'handles': 'nw, ne, sw, se',
        'start': this.onDragStart_.bind(this),
        'stop': this.onDragStop_.bind(this)
      };
      Object.assign(resizeConfig, $scope['resizeOptions'] || {});
      $element.resizable(resizeConfig);
      this.resizable_ = true;
    } else {
      $element.resizable({disabled: true});
    }

    $element.css('width', $scope['width'] + 'px');

    var height = $scope['height'];
    if ($scope['height'] == 'auto') {
      if ($scope['bottom'] == null || $scope['bottom'] == 'auto') {
        $element.css('bottom', 'auto');
      }
    } else {
      height += 'px';
    }
    $element.css('height', height);

    if (!this.cascade()) {
      // if the window wasn't cascaded, position it based off the config
      $element.css('left', $scope['x'] + 'px');

      if (!($scope['y'] == 'center' && $scope['height'] == 'auto') && ($scope['bottom'] == null ||
          $scope['bottom'] == 'auto')) {
        $element.css('top', $scope['y'] + 'px');
      }
    }

    /**
     * Monitor changes to the browser viewport size.
     * @type {?ViewportSizeMonitor}
     * @private
     */
    this.vsm_ = new ViewportSizeMonitor();
    this.vsm_.listen(GoogEventType.RESIZE, this.onViewportResize_, false, this);

    /**
     * Bound function to handle window resize events.
     * @type {?function()}
     * @private
     */
    this.resizeFn_ = null;

    /**
     * The last window height, for use with expand/collapse behavior.
     * @type {number}
     * @private
     */
    this.lastHeight_ = NaN;

    /**
     * If the window is closing.
     * @type {boolean}
     * @private
     */
    this.closing_ = false;

    /**
     * @type {KeyHandler}
     * @private
     */
    this.keyHandler_ = null;
    // If its a closeable window modal, let ESC close it
    if ($scope['showClose'] && $scope['modal']) {
      this.keyHandler_ = new KeyHandler(getDocument());
      this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
    }

    // listen for mousedown so z-index can be updated
    googEvents.listen($element[0], GoogEventType.MOUSEDOWN, this.updateZIndex_, true, this);

    // listen for all blur and focus events so the active window can be marked
    googEvents.listen(window, GoogEventType.MOUSEDOWN, this.onBlurOrFocus_, true, this);

    // listen for mouse enter so we can show/hide the window for overlays
    if ($scope['overlay']) {
      googEvents.listen($element[0], GoogEventType.MOUSEOVER, this.showOverlayWindow_, true, this);
      googEvents.listen($element[0], GoogEventType.MOUSEOUT, this.hideOverlayWindow_, true, this);
      this.hideOverlayWindow_();
    }

    this.scope.$watch('modal', this.onToggleModal_.bind(this));
    this.scope.$on(WindowEventType.RECONSTRAIN, this.constrainWindow_.bind(this));
    this.scope.$on('$destroy', this.dispose.bind(this));

    this.scope['active'] = true;

    if (!($scope['y'] == 'center' && $scope['height'] == 'auto')) {
      this.constrainWindow_();
    }

    this.element.focus();

    // Stack this new window on top of others
    $timeout(function() {
      if (this.element && this.scope) {
        // notify anyone listening that this window opened
        var eventScope = this.element.scope() || this.scope;
        eventScope.$emit(WindowEventType.OPEN, this.element);

        this.bringToFront();

        if (!this.resizeFn_) {
          this.resizeFn_ = this.onWindowResize_.bind(this);
          resize(this.element, this.resizeFn_);
        }
      }
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (!this.closing_) {
      // destroy called by angular, likely by ng-if
      this.close(true);
    }

    if (this.keyHandler_) {
      this.keyHandler_.unlisten(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
      this.keyHandler_.dispose();
      this.keyHandler_ = null;
    }

    googEvents.unlisten(window, GoogEventType.MOUSEDOWN, this.onBlurOrFocus_, true, this);
    googEvents.unlisten(this.element[0], GoogEventType.MOUSEDOWN, this.updateZIndex_, true, this);
    if (this.scope['overlay']) {
      googEvents.unlisten(this.element[0], GoogEventType.MOUSEOVER, this.showOverlayWindow_, true, this);
      googEvents.unlisten(this.element[0], GoogEventType.MOUSEOUT, this.hideOverlayWindow_, true, this);
    }

    if (this.element && this.resizeFn_) {
      removeResize(this.element, this.resizeFn_);
      this.resizeFn_ = null;
    }

    if (this.scope['modal']) {
      const moreModalsLeft = Object.keys(getOpenWindows()).some((key) => {
        if (key == '#' + this.scope['id']) {
          return false;
        }

        const win = getById(key);
        const scope = win.children().first().scope();
        return scope && scope['modal'];
      });

      this.removeModalBg(moreModalsLeft);
    }

    this.getWindowKeys().forEach(function(key) {
      unregisterWindow(key, this.element[0]);
    }, this);

    dispose(this.vsm_);
    this.vsm_ = null;

    this.element = null;
    this.scope = null;
  }

  /**
   * Get all keys used to identify the open window.
   *
   * @return {!Array<string>}
   * @protected
   */
  getWindowKeys() {
    var keys = [];

    var id = this.scope ? /** @type {string|undefined} */ (this.scope['id']) : undefined;
    if (id) {
      keys.push('#' + id);
    }

    return keys;
  }

  /**
   * Adds the modal backdrop
   */
  addModalBg() {
    if (!this.modalElement) {
      var body = $('body');
      this.modalElement = body.append('<div class="' + windowSelector.MODAL_BG.substring(1) + ' show"></div>');
      body.addClass('modal-open');
    }
  }

  /**
   * Removes the modal backdrop
   * @param {boolean=} opt_keepBodyClass Optional flag to leave modal-open on the body, defaults to false
   */
  removeModalBg(opt_keepBodyClass) {
    if (this.modalElement) {
      if (!opt_keepBodyClass) {
        $('body').removeClass('modal-open');
      }

      $(windowSelector.MODAL_BG).first().remove();
      this.modalElement = null;
    }
  }

  /**
   * Moves the window on top of other windows in the application.
   *
   * @export
   */
  bringToFront() {
    if (this.element) {
      stack(this.element[0]);
    }
  }

  /**
   * Cascade the window against the top-most window with a matching id.
   *
   * @return {boolean} If the window was cascaded.
   * @protected
   */
  cascade() {
    if (this.scope && this.element) {
      var id = /** @type {string|undefined} */ (this.scope['id']);
      if (id) {
        var selector = windowSelector.WINDOW + '#' + id;
        var existing = /** @type {!Array<Element>} */ ($.makeArray($(selector)))
            .sort(sortByZIndex);

        var top = existing.find(function(el) {
          return el !== this.element[0];
        }.bind(this));

        if (top) {
          var containerSelector = this.scope['windowContainer'] || windowSelector.CONTAINER;
          var container = document.querySelector(containerSelector);
          cascade(this.element[0], top, container);

          return true;
        }
      }
    }

    return false;
  }

  /**
   * Broadcast a params update event down the scope of the window controller for transcluded contents to handle.
   *
   * @param {Object} params
   */
  setParams(params) {
    this.scope.$broadcast('os.ui.window.params', params);
  }

  /**
   * @private
   */
  onBlurOrFocus_() {
    this.scope['active'] = false;
    apply(this.scope);
  }

  /**
   * @private
   */
  showOverlayWindow_() {
    var header = this.element.find(windowSelector.HEADER);
    var resizable = this.element.find('.ui-resizable-se');
    if (header) {
      resizable.css('visibility', 'visible');
      header.css('visibility', 'visible');
      this.element.removeClass('modal-borderless');
    }
  }

  /**
   * @private
   */
  hideOverlayWindow_() {
    var header = this.element.find(windowSelector.HEADER);
    this.element.toggleClass('.ui-resizable-se');
    var resizable = this.element.find('.ui-resizable-se');
    if (header) {
      resizable.css('visibility', 'hidden');
      header.css('visibility', 'hidden');
      this.element.addClass('modal-borderless');
    }
  }

  /**
   * Closes the window
   *
   * @param {boolean=} opt_cancel If the cancel event should be fired
   * @export
   */
  close(opt_cancel) {
    this.closing_ = true;

    var eventScope = this.element.scope() || this.scope;

    if (opt_cancel) {
      // notify children the window is closing due to the X being clicked
      eventScope.$broadcast(WindowEventType.CANCEL, this.element);
    }
    eventScope.$broadcast(WindowEventType.CLOSING, this.element);
    eventScope.$emit(WindowEventType.CLOSE, this.element);

    // destroying the scope will clear the element reference, but elements should always be removed from the DOM after
    // the scope is destroyed to ensure listeners are cleared correctly.
    var el = this.element;

    // parent scope is the one created in launchInternal, so destroy that to prevent leaks. do not destroy
    // the parent scope if this scope has already been destroyed. that will happen when Angular is in the process of
    // destroying the root scope (on application close).
    if (!this.isDisposed()) {
      this.scope.$parent.$destroy();
    }

    // remove the element from the DOM
    el.remove();
  }

  /**
   * Toggles the window content
   *
   * @export
   */
  toggle() {
    if (!this.scope['modal']) {
      var content = this.element.find(windowSelector.WRAPPER);

      if (!isNaN(this.lastHeight_)) {
        this.element.height(this.lastHeight_);
        this.lastHeight_ = NaN;
        content.toggle();
        this.element.resizable('option', 'disabled', !this.resizable_);
        this.constrainWindow_();
        this.scope['collapsed'] = false;
        this.element.find('.js-window__header').removeClass('collapsed');
      } else {
        this.element.resizable('option', 'disabled', true);
        this.lastHeight_ = this.element.outerHeight();
        content.toggle();
        var header = this.element.find(windowSelector.HEADER);
        this.element.height(header.outerHeight());
        this.scope['collapsed'] = true;
        this.element.find('.js-window__header').addClass('collapsed');
      }
    }
  }

  /**
   * Hide (not close) the window and raise an event
   *
   * @export
   */
  hide() {
    if (this.scope['id']) {
      toggleVisibility(this.scope['id']);
      var event = new UIEvent(UIEventType.TOGGLE_UI, this.scope['id']);
      dispatcher.getInstance().dispatchEvent(event);
    }
  }

  /**
   * Updates on change
   *
   * @param {?Object} event
   * @param {?Object} ui
   * @protected
   */
  onChange(event, ui) {
    // this is for extensions to this class
  }

  /**
   * Drag start handler. Fires a start event in case the parent needs to take action.
   *
   * @param {?Object} event
   * @param {?Object} ui
   * @private
   */
  onDragStart_(event, ui) {
    this.scope.$emit(WindowEventType.DRAGSTART);

    this.scope['bottom'] = 'auto';
    this.element.css('bottom', 'auto');

    // iframes kill mouse events if you roll over them while dragging, so we'll nip that in the bud
    angular.element('iframe').addClass('u-pointer-events-none');
  }

  /**
   * Drag end handler. Fires an end event in case the parent needs to take action.
   *
   * @param {?Object} event
   * @param {?Object} ui
   * @private
   */
  onDragStop_(event, ui) {
    this.onChange(event, ui);
    this.scope.$emit(WindowEventType.DRAGSTOP);

    // Reset the window height back to auto since jquery changes it
    if (this.scope['height'] == 'auto') {
      this.element.css('height', 'auto');
    }

    // iframes can have mouse events again
    angular.element('iframe').removeClass('u-pointer-events-none');

    // ensure the window is still constrained within the browser window
    this.constrainWindow_();
  }

  /**
   * Handle modal flag change.
   *
   * @param {boolean=} opt_new
   * @param {boolean=} opt_old
   * @private
   */
  onToggleModal_(opt_new, opt_old) {
    if (opt_new !== undefined && opt_new != opt_old) {
      if (opt_new) {
        this.addModalBg();
      } else {
        this.removeModalBg();
      }
    }
  }

  /**
   * If the window isn't a modal and didn't override its z-index, put it on top of other windows by incrementing the
   * global z-index and applying it to the window.
   *
   * @private
   */
  updateZIndex_() {
    this.bringToFront();

    if (!this.scope['active']) {
      this.scope['active'] = true;
      apply(this.scope);
    }
  }

  /**
   * Handle viewport resize event.
   *
   * @param {GoogEvent=} opt_e The resize event.
   * @private
   */
  onViewportResize_(opt_e) {
    this.constrainWindow_();
  }

  /**
   * Handle window resize events.
   * @private
   */
  onWindowResize_() {
    if (this.element) {
      var width = this.element.outerWidth();
      var addClass = 'u-parent-resizer-xs';
      this.element.removeClass('u-parent-resizer-sm');
      if (width > 576) {
        addClass = 'u-parent-resizer-sm';
        this.element.removeClass('u-parent-resizer-xs');
        this.element.removeClass('u-parent-resizer-md');
      }
      if (width > 768) {
        addClass = 'u-parent-resizer-md';
        this.element.removeClass('u-parent-resizer-sm');
        this.element.removeClass('u-parent-resizer-lg');
      }
      if (width > 992) {
        addClass = 'u-parent-resizer-lg';
        this.element.removeClass('u-parent-resizer-md');
        this.element.removeClass('u-parent-resizer-xl');
      }
      if (width > 1200) {
        addClass = 'u-parent-resizer-xl';
        this.element.removeClass('u-parent-resizer-lg');
        this.element.removeClass('u-parent-resizer-xxl');
      }
      if (width > 1500) {
        addClass = 'u-parent-resizer-xxl';
        this.element.removeClass('u-parent-resizer-xl');
      }
      this.element.addClass(addClass);

      ViewportSizeMonitor.getInstanceForWindow().dispatchEvent(GoogEventType.RESIZE);
    }
  }

  /**
   * Constrain the window element within the boundaries of the browser window.
   *
   * @private
   */
  constrainWindow_() {
    // this moves the window back into view rather simplistically
    var x = parseFloat(this.element.css('left').replace('px', ''));
    var y = parseFloat(this.element.css('top').replace('px', ''));
    var w = parseFloat(this.element.css('width').replace('px', ''));
    var h = parseFloat(this.element.css('height').replace('px', ''));
    var winContainerTop = $(this.scope['windowContainer']).offset()['top'];

    var size = this.vsm_.getSize();

    // first make sure the window will not be taller/wider than the browser window
    if (w > size.width) {
      // don't allow shrinking the window beyond its minimum specified width
      var minWidth = parseFloat(this.scope['minWidth'] || this.scope['width'] || 0);
      w = Math.max(size.width, minWidth);
      this.element.css('width', w + 'px');
    }

    if (h > size.height) {
      // don't allow shrinking the window beyond its minimum specified height
      var minHeight = parseFloat(this.scope['minHeight'] || this.scope['height'] || 0);
      h = Math.max(size.height, minHeight);
      this.element.css('height', h + 'px');
    }

    // then position it to be within the boundaries of the browser window
    if (x < 0) {
      this.element.css('left', '0px');
    } else if ((x + w) > size.width) {
      x = Math.max(size.width - w, 0);
      this.element.css('left', x + 'px');
    }

    if (this.scope['bottom'] == null || this.scope['bottom'] == 'auto') {
      if (y < winContainerTop) {
        this.element.css('top', winContainerTop + 'px');
      } else if ((y + h) > size.height) {
        y = Math.max(size.height - h, winContainerTop);
        this.element.css('top', y + 'px');
      }
    }

    // If window is height auto, force max-height on the modal-content
    if (this.scope['height'] == 'auto') {
      var otherHeight = 0;
      windowCommonElements.forEach(function(otherEl) {
        otherHeight += ($(/** @type {string} */ (otherEl)).outerHeight());
      });

      var useableHeight = size.height - otherHeight;
      this.element.find('.modal-content').css('max-height', useableHeight);
    }
  }

  /**
   * Handle header button click
   *
   * @param {!Event} event
   * @param {!HeaderBtnConfig} headerBtnCfg
   * @export
   */
  onHeaderBtnClick(event, headerBtnCfg) {
    var winEl = $(event.target).parents(windowSelector.WINDOW);
    if (!winEl.length) {
      winEl = $(event.target).parents(windowSelector.DOCKED);
    }
    headerBtnCfg.onClick(winEl);
  }

  /**
   * Use ESC key to cancel if modal and showClose is true
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    var ctrlOr = isOSX() ? event.metaKey : event.ctrlKey;
    if (event.keyCode == KeyCodes.ESC && !ctrlOr && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      close(this.element);
    }
  }
}

/**
 * Z-index of the top window. This is the maximum z-index for windows all other are decremented
 * @type {number}
 */
Controller.Z = 999;

/**
 * Logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.WindowUI');
