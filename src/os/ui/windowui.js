goog.provide('os.ui.WindowCtrl');
goog.provide('os.ui.windowDirective');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyEvent');
goog.require('goog.events.KeyHandler');
goog.require('goog.log');
goog.require('ol.array');
goog.require('os.array');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.onboarding.contextOnboardingDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.HeaderBtnConfig');
goog.require('os.ui.windowCommonElements');
goog.require('os.ui.windowCommonOptionalElements');
goog.require('os.ui.windowSelector');
goog.require('os.ui.windowZIndexMax');



/**
 * Logger for os.ui.window.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.LOGGER_ = goog.log.getLogger('os.ui.window');

/**
 * Controller for the draggable window directive. You must have mark the window container
 * with <code>id="js-window__container"</code>.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.WindowCtrl = function($scope, $element, $timeout) {
  os.ui.WindowCtrl.base(this, 'constructor');

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

  $scope['windowContainer'] = $scope['windowContainer'] || os.ui.windowSelector.CONTAINER;
  var container = angular.element($scope['windowContainer']);

  // If there is no scope id. Make one
  if (!$scope['id']) {
    $scope['id'] = goog.string.createUniqueString();
  }

  $element[0].id = $scope['id'];

  this.getWindowKeys().forEach(function(key) {
    os.ui.window.registerWindow(key, this.element[0]);
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

      // make sure the window gets positioned eventually. windows should fire a os.ui.WindowEventType.READY event to
      // indicate they are initialized and ready to be positioned.
      readyPromise = $timeout(function() {
        // fail an assertion to make this more obvious in debug mode, and log a warning otherwise.
        var errorMessage = 'Window READY event was not fired for "' + $scope['label'] + '"!';
        goog.asserts.fail(errorMessage);
        goog.log.warning(os.ui.LOGGER_, errorMessage);

        readyOff();
        onWindowReady();
      }, 1000);

      readyOff = $scope.$on(os.ui.WindowEventType.READY, function() {
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
      (os.ui.windowSelector.HEADER + ', .js-window-overlay-content') : os.ui.windowSelector.HEADER;
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
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();
  this.vsm_.listen(goog.events.EventType.RESIZE, this.onViewportResize_, false, this);

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
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = null;
  // If its a closeable window modal, let ESC close it
  if ($scope['showClose'] && $scope['modal']) {
    this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
    this.keyHandler_.listen(goog.events.KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
  }

  // listen for mousedown so z-index can be updated
  goog.events.listen($element[0], goog.events.EventType.MOUSEDOWN, this.updateZIndex_, true, this);

  // listen for all blur and focus events so the active window can be marked
  goog.events.listen(window, goog.events.EventType.MOUSEDOWN, this.onBlurOrFocus_, true, this);

  // listen for mouse enter so we can show/hide the window for overlays
  if ($scope['overlay']) {
    goog.events.listen($element[0], goog.events.EventType.MOUSEOVER, this.showOverlayWindow_, true, this);
    goog.events.listen($element[0], goog.events.EventType.MOUSEOUT, this.hideOverlayWindow_, true, this);
    this.hideOverlayWindow_();
  }

  this.scope.$watch('modal', this.onToggleModal_.bind(this));
  this.scope.$on(os.ui.WindowEventType.RECONSTRAIN, this.constrainWindow_.bind(this));
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
      eventScope.$emit(os.ui.WindowEventType.OPEN, this.element);

      this.bringToFront();

      if (!this.resizeFn_) {
        this.resizeFn_ = this.onWindowResize_.bind(this);
        os.ui.resize(this.element, this.resizeFn_);
      }
    }
  }.bind(this));
};
goog.inherits(os.ui.WindowCtrl, goog.Disposable);


/**
 * Z-index of the top window. This is the maximum z-index for windows all other are decremented
 * @type {number}
 */
os.ui.WindowCtrl.Z = 999;


/**
 * @inheritDoc
 */
os.ui.WindowCtrl.prototype.disposeInternal = function() {
  os.ui.WindowCtrl.base(this, 'disposeInternal');

  if (!this.closing_) {
    // destroy called by angular, likely by ng-if
    this.close(true);
  }

  if (this.keyHandler_) {
    this.keyHandler_.unlisten(goog.events.KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
    this.keyHandler_.dispose();
    this.keyHandler_ = null;
  }

  goog.events.unlisten(window, goog.events.EventType.MOUSEDOWN, this.onBlurOrFocus_, true, this);
  goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEDOWN, this.updateZIndex_, true, this);
  if (this.scope['overlay']) {
    goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEOVER, this.showOverlayWindow_, true, this);
    goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEOUT, this.hideOverlayWindow_, true, this);
  }

  if (this.element && this.resizeFn_) {
    os.ui.removeResize(this.element, this.resizeFn_);
    this.resizeFn_ = null;
  }

  if (this.scope['modal']) {
    const moreModalsLeft = Object.keys(os.ui.window.getOpenWindows()).some((key) => {
      if (key == '#' + this.scope['id']) {
        return false;
      }

      const win = os.ui.window.getById(key);
      const scope = win.children().first().scope();
      return scope && scope['modal'];
    });

    this.removeModalBg(moreModalsLeft);
  }

  this.getWindowKeys().forEach(function(key) {
    os.ui.window.unregisterWindow(key, this.element[0]);
  }, this);

  goog.dispose(this.vsm_);
  this.vsm_ = null;

  this.element = null;
  this.scope = null;
};


/**
 * Get all keys used to identify the open window.
 *
 * @return {!Array<string>}
 * @protected
 */
os.ui.WindowCtrl.prototype.getWindowKeys = function() {
  var keys = [];

  var id = this.scope ? /** @type {string|undefined} */ (this.scope['id']) : undefined;
  if (id) {
    keys.push('#' + id);
  }

  return keys;
};


/**
 * Adds the modal backdrop
 */
os.ui.WindowCtrl.prototype.addModalBg = function() {
  if (!this.modalElement) {
    var body = $('body');
    this.modalElement = body.append('<div class="' + os.ui.windowSelector.MODAL_BG.substring(1) + ' show"></div>');
    body.addClass('modal-open');
  }
};


/**
 * Removes the modal backdrop
 * @param {boolean=} opt_keepBodyClass Optional flag to leave modal-open on the body, defaults to false
 */
os.ui.WindowCtrl.prototype.removeModalBg = function(opt_keepBodyClass) {
  if (this.modalElement) {
    if (!opt_keepBodyClass) {
      $('body').removeClass('modal-open');
    }

    $(os.ui.windowSelector.MODAL_BG).first().remove();
    this.modalElement = null;
  }
};


/**
 * Moves the window on top of other windows in the application.
 *
 * @export
 */
os.ui.WindowCtrl.prototype.bringToFront = function() {
  if (this.element) {
    os.ui.window.stack(this.element[0]);
  }
};


/**
 * Cascade the window against the top-most window with a matching id.
 *
 * @return {boolean} If the window was cascaded.
 * @protected
 */
os.ui.WindowCtrl.prototype.cascade = function() {
  if (this.scope && this.element) {
    var id = /** @type {string|undefined} */ (this.scope['id']);
    if (id) {
      var selector = os.ui.windowSelector.WINDOW + '#' + id;
      var existing = /** @type {!Array<Element>} */ ($.makeArray($(selector)))
          .sort(os.ui.window.sortByZIndex);

      var top = ol.array.find(existing, function(el) {
        return el !== this.element[0];
      }.bind(this));

      if (top) {
        var containerSelector = this.scope['windowContainer'] || os.ui.windowSelector.CONTAINER;
        var container = document.querySelector(containerSelector);
        os.ui.window.cascade(this.element[0], top, container);

        return true;
      }
    }
  }

  return false;
};


/**
 * Broadcast a params update event down the scope of the window controller for transcluded contents to handle.
 *
 * @param {Object} params
 */
os.ui.WindowCtrl.prototype.setParams = function(params) {
  this.scope.$broadcast('os.ui.window.params', params);
};


/**
 * @private
 */
os.ui.WindowCtrl.prototype.onBlurOrFocus_ = function() {
  this.scope['active'] = false;
  os.ui.apply(this.scope);
};


/**
 * @private
 */
os.ui.WindowCtrl.prototype.showOverlayWindow_ = function() {
  var header = this.element.find(os.ui.windowSelector.HEADER);
  var resizable = this.element.find('.ui-resizable-se');
  if (header) {
    resizable.css('visibility', 'visible');
    header.css('visibility', 'visible');
    this.element.removeClass('modal-borderless');
  }
};


/**
 * @private
 */
os.ui.WindowCtrl.prototype.hideOverlayWindow_ = function() {
  var header = this.element.find(os.ui.windowSelector.HEADER);
  this.element.toggleClass('.ui-resizable-se');
  var resizable = this.element.find('.ui-resizable-se');
  if (header) {
    resizable.css('visibility', 'hidden');
    header.css('visibility', 'hidden');
    this.element.addClass('modal-borderless');
  }
};


/**
 * Closes the window
 *
 * @param {boolean=} opt_cancel If the cancel event should be fired
 * @export
 */
os.ui.WindowCtrl.prototype.close = function(opt_cancel) {
  this.closing_ = true;

  var eventScope = this.element.scope() || this.scope;

  if (opt_cancel) {
    // notify children the window is closing due to the X being clicked
    eventScope.$broadcast(os.ui.WindowEventType.CANCEL, this.element);
  }
  eventScope.$broadcast(os.ui.WindowEventType.CLOSING, this.element);
  eventScope.$emit(os.ui.WindowEventType.CLOSE, this.element);

  // destroying the scope will clear the element reference, but elements should always be removed from the DOM after
  // the scope is destroyed to ensure listeners are cleared correctly.
  var el = this.element;

  // parent scope is the one created in os.ui.window.launchInternal, so destroy that to prevent leaks. do not destroy
  // the parent scope if this scope has already been destroyed. that will happen when Angular is in the process of
  // destroying the root scope (on application close).
  if (!this.isDisposed()) {
    this.scope.$parent.$destroy();
  }

  // remove the element from the DOM
  el.remove();
};


/**
 * Toggles the window content
 *
 * @export
 */
os.ui.WindowCtrl.prototype.toggle = function() {
  if (!this.scope['modal']) {
    var content = this.element.find(os.ui.windowSelector.WRAPPER);

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
      var header = this.element.find(os.ui.windowSelector.HEADER);
      this.element.height(header.outerHeight());
      this.scope['collapsed'] = true;
      this.element.find('.js-window__header').addClass('collapsed');
    }
  }
};


/**
 * Hide (not close) the window and raise an event
 *
 * @export
 */
os.ui.WindowCtrl.prototype.hide = function() {
  if (this.scope['id']) {
    os.ui.window.toggleVisibility(this.scope['id']);
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, this.scope['id']);
    os.dispatcher.dispatchEvent(event);
  }
};


/**
 * Updates on change
 *
 * @param {?Object} event
 * @param {?Object} ui
 * @protected
 */
os.ui.WindowCtrl.prototype.onChange = function(event, ui) {
  // this is for extensions to this class
};


/**
 * Drag start handler. Fires a start event in case the parent needs to take action.
 *
 * @param {?Object} event
 * @param {?Object} ui
 * @private
 */
os.ui.WindowCtrl.prototype.onDragStart_ = function(event, ui) {
  this.scope.$emit(os.ui.WindowEventType.DRAGSTART);

  this.scope['bottom'] = 'auto';
  this.element.css('bottom', 'auto');

  // iframes kill mouse events if you roll over them while dragging, so we'll nip that in the bud
  angular.element('iframe').addClass('u-pointer-events-none');
};


/**
 * Drag end handler. Fires an end event in case the parent needs to take action.
 *
 * @param {?Object} event
 * @param {?Object} ui
 * @private
 */
os.ui.WindowCtrl.prototype.onDragStop_ = function(event, ui) {
  this.onChange(event, ui);
  this.scope.$emit(os.ui.WindowEventType.DRAGSTOP);

  // Reset the window height back to auto since jquery changes it
  if (this.scope['height'] == 'auto') {
    this.element.css('height', 'auto');
  }

  // iframes can have mouse events again
  angular.element('iframe').removeClass('u-pointer-events-none');

  // ensure the window is still constrained within the browser window
  this.constrainWindow_();
};


/**
 * Handle modal flag change.
 *
 * @param {boolean=} opt_new
 * @param {boolean=} opt_old
 * @private
 */
os.ui.WindowCtrl.prototype.onToggleModal_ = function(opt_new, opt_old) {
  if (opt_new !== undefined && opt_new != opt_old) {
    if (opt_new) {
      this.addModalBg();
    } else {
      this.removeModalBg();
    }
  }
};


/**
 * If the window isn't a modal and didn't override its z-index, put it on top of other windows by incrementing the
 * global z-index and applying it to the window.
 *
 * @private
 */
os.ui.WindowCtrl.prototype.updateZIndex_ = function() {
  this.bringToFront();

  if (!this.scope['active']) {
    this.scope['active'] = true;
    os.ui.apply(this.scope);
  }
};


/**
 * Handle viewport resize event.
 *
 * @param {goog.events.Event=} opt_e The resize event.
 * @private
 */
os.ui.WindowCtrl.prototype.onViewportResize_ = function(opt_e) {
  this.constrainWindow_();
};


/**
 * Handle window resize events.
 * @private
 */
os.ui.WindowCtrl.prototype.onWindowResize_ = function() {
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

    goog.dom.ViewportSizeMonitor.getInstanceForWindow().dispatchEvent(goog.events.EventType.RESIZE);
  }
};


/**
 * Constrain the window element within the boundaries of the browser window.
 *
 * @private
 */
os.ui.WindowCtrl.prototype.constrainWindow_ = function() {
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
    os.ui.windowCommonElements.forEach(function(otherEl) {
      otherHeight += ($(/** @type {string} */ (otherEl)).outerHeight());
    });

    var useableHeight = size.height - otherHeight;
    this.element.find('.modal-content').css('max-height', useableHeight);
  }
};


/**
 * Handle header button click
 *
 * @param {!Event} event
 * @param {!os.ui.window.HeaderBtnConfig} headerBtnCfg
 * @export
 */
os.ui.WindowCtrl.prototype.onHeaderBtnClick = function(event, headerBtnCfg) {
  var winEl = $(event.target).parents(os.ui.windowSelector.WINDOW);
  if (!winEl.length) {
    winEl = $(event.target).parents(os.ui.windowSelector.DOCKED);
  }
  headerBtnCfg.onClick(winEl);
};


/**
 * Use ESC key to cancel if modal and showClose is true
 *
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.WindowCtrl.prototype.handleKeyEvent_ = function(event) {
  var ctrlOr = os.isOSX() ? event.metaKey : event.ctrlKey;
  if (event.keyCode == goog.events.KeyCodes.ESC && !ctrlOr && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    os.ui.window.close(this.element);
  }
};


/**
 * A draggable, resizable window. The directive uses transclusion, meaning that you
 * can place custom content into the window.
 *
 * @return {angular.Directive}
 */
os.ui.windowDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    scope: {
      'id': '@',
      'helpContext': '@',
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
      /* Array.<os.ui.window.HeaderBtnConfig> */
      'headerBtns': '=?',
      'border': '=',
      'bottom': '=?'
    },
    templateUrl: os.ROOT + 'views/window/window.html',
    controller: os.ui.WindowCtrl,
    controllerAs: 'windowCtrl'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('window', [os.ui.windowDirective]);
