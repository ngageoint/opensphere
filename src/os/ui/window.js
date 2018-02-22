goog.provide('os.ui.WindowCtrl');
goog.provide('os.ui.WindowEventType');
goog.provide('os.ui.window');
goog.provide('os.ui.window.HeaderBtnConfig');
goog.provide('os.ui.windowDirective');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.onboarding.contextOnboardingDirective');


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
      'height': '@',
      'label': '@',
      'icon': '@',
      'iconHtml': '@',
      'showClose': '=',
      'showHide': '=',
      'showCollapse': '=',
      'noScroll': '@',
      'overlay': '@',
      'modal': '=',
      'zIndex': '@',
      'disableDrag': '@',
      'windowContainer': '@',
      'closeFlag': '=',
      /* Array.<os.ui.window.HeaderBtnConfig> */
      'headerBtns': '=?'
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


/**
 * Creates a window by wrapping a window around the given html
 * @param {Object.<string, *>} options The attibute/value pairs for the window
 * @param {!string} html The HTML or directive name
 * @param {string=} opt_parent The selector for the parent defaults to <code>#win-container</code>
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object.<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
os.ui.window.create = function(options, html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (!opt_parent) {
    opt_parent = '#win-container';
  }

  if (html.indexOf('<') == -1) {
    // we were just given the directive name
    html = '<' + html + '></' + html + '>';
  }

  var win = '<' + ('key' in options ? 'savedwindow' : 'window');

  for (var key in options) {
    var val = options[key];
    if (key === 'label' && goog.isString(val)) {
      val = val.replace('"', '&quot;');
    }
    win += ' ' + key + '="' + val + '"';
  }

  win += '>' + html + '</' + ('key' in options ? 'savedwindow' : 'window') + '>';
  os.ui.window.launch(win, opt_parent, opt_scope, opt_compile, opt_scopeOptions);
};


/**
 * Convenience function for adding a new window to the application
 * @param {!string} html The HTML to launch
 * @param {string=} opt_parent The selector for the parent. Defaults to <code>#win-container</code>.
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object.<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
os.ui.window.launch = function(html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (!opt_parent) {
    opt_parent = '#win-container';
  }

  if (html.indexOf('<') == -1) {
    // we were just given the directive name
    html = '<' + html + '></' + html + '>';
  }

  var i = angular.element(opt_parent).injector();

  if (i) {
    os.ui.window.launchInternal(html,
        opt_parent,
        opt_scope || i.get('$rootScope'),
        opt_compile || i.get('$compile'),
        opt_scopeOptions);
  }
};


/**
 * Internal convenience function that handles scope and compile injection.
 * @param {!string} html
 * @param {!string} parent The selector for the parent
 * @param {!angular.Scope} $scope
 * @param {!angular.$compile} $compile
 * @param {Object.<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 * @ngInject
 */
os.ui.window.launchInternal = function(html, parent, $scope, $compile, opt_scopeOptions) {
  // make a new scope
  var s = $scope.$new();
  if (goog.isDefAndNotNull(opt_scopeOptions)) {
    goog.object.extend(s, opt_scopeOptions);
  }

  // compile and add
  $compile(html)(s).appendTo(parent);
};


/**
 * Brings a window to the front of all other windows
 * @param {string} id The window's id (without the #)
 */
os.ui.window.bringToFront = function(id) {
  var win = os.ui.window.getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).bringToFront();
    }
  }
};


/**
 * Temporary toggle windows off with callback
 * @param {?string=} opt_id The window's id (without the #)
 * @return {?Function} callback to toggle windows that got turn off back on
 */
os.ui.window.toggleVisibility = function(opt_id) {
  var callback = null;
  var wins = opt_id ? os.ui.window.getById(opt_id) : angular.element('.window:not(.ng-hide)');
  if (wins) {
    wins.addClass('hidden');
    var modalbg = angular.element('.window-modal-bg');
    if (modalbg) {
      modalbg.removeClass('window-modal-bg');
    }

    /**
     * callback removes the hidden class and adds modal background if necessary
     */
    callback = function() {
      wins.removeClass('hidden');
      if (modalbg) {
        modalbg.addClass('window-modal-bg');
      }
    };
  }

  return callback;
};


/**
 * Turns on modality
 * @param {string} id The window's id (without the #)
 */
os.ui.window.enableModality = function(id) {
  var win = os.ui.window.getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).addModalBg();
      scope['modal'] = true;
    }
  }
};


/**
 * Turns off modality
 * @param {string} id The window's id (without the #)
 */
os.ui.window.disableModality = function(id) {
  var win = os.ui.window.getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).removeModalBg();
      scope['modal'] = false;
    }
  }
};


/**
 * Closes the window that contains the given element
 * @param {?angular.JQLite} el An element within the window
 */
os.ui.window.close = function(el) {
  if (el) {
    var scope = el.hasClass('window') ? el.children().scope() : el.parents('.window').children().scope();
    if (scope) {
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).close();
    }
  }
};


/**
 * Closes all windows
 * @param {string=} opt_parent
 */
os.ui.window.closeAll = function(opt_parent) {
  var container = '#win-container';
  if (opt_parent) {
    container = opt_parent;
  }
  var winContainer = angular.element(container);
  if (winContainer.length) {
    var wins = winContainer.find('.window');
    if (wins instanceof Array) {
      goog.array.forEach(wins, function(win) {
        os.ui.window.close(win);
      });
    } else {
      os.ui.window.close(wins);
    }
  }
};


/**
 * Gets a reference to a window with the provided id, if it exists in the application.
 * @param {string} id The window's id (without the #)
 * @return {?angular.JQLite} The window, if it exists.
 */
os.ui.window.getById = function(id) {
  var win = angular.element('.window#' + id);
  if (win.length == 0) {
    win = angular.element('[key="' + id + '"]');
  }
  if (win.length == 0) {
    win = null;
  }
  return win;
};


/**
 * Look up a window by ID and call setParams on it's controller
 * @param {string} id
 * @param {Object} params
 */
os.ui.window.setParams = function(id, params) {
  var win = os.ui.window.getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).setParams(params);
    }
  }
};


/**
 * Checks if a window with the provided id exists in the application.
 * @param {string} id The window's id (without the #)
 * @return {boolean} If the window exists.
 */
os.ui.window.exists = function(id) {
  return !!os.ui.window.getById(id);
};


/**
 * Make a window start or stop blinking
 * @param {!string} id window ID
 * @param {boolean=} opt_start Defaults to start (true), stop blinking if false is specified.
 */
os.ui.window.blink = function(id, opt_start) {
  var win = os.ui.window.getById(id);
  if (win) {
    var start = goog.isDef(opt_start) ? opt_start : true;
    var blinkEl = win.find('.window-header .header-text i.fa');
    if (start) {
      blinkEl.addClass('pulsate');
    } else {
      blinkEl.removeClass('pulsate');
    }
  }
};


/**
 * @typedef {{
 *   id: string,
 *   iconClass: string,
 *   tooltip: string,
 *   onClick: function(!jQuery)
 * }}
 */
os.ui.window.HeaderBtnConfig;


/**
 * @enum {string}
 */
os.ui.WindowEventType = {
  CANCEL: 'windowCancel',
  CLOSING: 'windowClosing',
  CLOSE: 'windowClose',
  DRAGSTART: 'windowDragStart',
  DRAGSTOP: 'windowDragStop',
  HEADERBTN: 'windowHeaderBtn',
  READY: 'window.ready'
};



/**
 * Controller for the draggable window directive. You must have mark the window container
 * with <code>id="win-container"</code>.
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

  $scope['windowContainer'] = $scope['windowContainer'] || '#win-container';
  var container = angular.element($scope['windowContainer']);

  if ($scope['id']) {
    $element[0].id = $scope['id'];
  }

  if ($scope['x'] == 'center') {
    $scope['x'] = (container.width() - $scope['width']) / 2;
  }

  if ($scope['y'] == 'center') {
    var maxHeight = Math.min($(window).height(), container.height());
    if ($scope['height'] == 'auto') {
      // Put the element off the screen
      $element.css('top', '20000px');

      var that = this;
      var readyPromise;
      var readyOff;
      var onWindowReady = function() {
        var height = 0;
        // Only works if window html structure is followed
        var content = $element.find('.window-content-wrapper');
        if (content) {
          height = content.height();
        }
        $scope['y'] = (maxHeight - height) / 2;
        $element.css('top', $scope['y'] + 'px');
        that.constrainWindow_();
      };

      // make sure the window gets positioned eventually. windows should fire a os.ui.WindowEventType.READY event to
      // indicate they are initialized and ready to be positioned.
      readyPromise = $timeout(function() {
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
  } else {
    // use z-index override, otherwise place the window on top of all others
    $element.css('z-index', $scope['zIndex'] || (++os.ui.WindowCtrl.Z + ''));
  }

  // make the element draggable
  if (!$scope['disableDrag']) {
    var handler = $scope['overlay'] ? '.window-header, .window-overlay-content' : '.window-header';
    var dragConfig = {
      'containment': $scope['windowContainer'],
      'handle': handler,
      'start': this.onDragStart_.bind(this),
      'stop': this.onDragStop_.bind(this)
    };
    $element.draggable(dragConfig);
  }

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
      'resize': this.updateContent_.bind(this),
      'start': this.onDragStart_.bind(this),
      'stop': this.onDragStop_.bind(this)
    };
    goog.object.extend(resizeConfig, $scope['resizeOptions'] || {});
    $element.resizable(resizeConfig);
  }

  $element.css('overflow-y', 'unset');

  $element.css('left', $scope['x'] + 'px');
  $element.css('top', $scope['y'] + 'px');
  $element.css('width', $scope['width'] + 'px');

  var height = $scope['height'];
  if ($scope['height'] == 'auto') {
    $element.addClass('autosize');
  } else {
    height += 'px';
  }
  $element.css('height', height);

  // update the window content element after it has been initialized
  setTimeout(this.updateContent_.bind(this), 10);

  /**
   * Monitor changes to the browser viewport size.
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();
  this.vsm_.listen(goog.events.EventType.RESIZE, this.onViewportResize_, false, this);

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
  this.scope.$watch('closeFlag', this.onCloseFlag_.bind(this));
  this.scope.$on('$destroy', this.dispose.bind(this));

  this.scope['active'] = true;

  this.constrainWindow_();
  this.element.focus();
};
goog.inherits(os.ui.WindowCtrl, goog.Disposable);


/**
 * Z-index of the top window.
 * @type {number}
 */
os.ui.WindowCtrl.Z = 2000;


/**
 * @inheritDoc
 */
os.ui.WindowCtrl.prototype.disposeInternal = function() {
  os.ui.WindowCtrl.base(this, 'disposeInternal');

  if (!this.closing_) {
    // destroy called by angular, likely by ng-if
    this.close(true);
  }

  goog.events.unlisten(window, goog.events.EventType.MOUSEDOWN, this.onBlurOrFocus_, true, this);
  goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEDOWN, this.updateZIndex_, true, this);
  if (this.scope['overlay']) {
    goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEOVER, this.showOverlayWindow_, true, this);
    goog.events.unlisten(this.element[0], goog.events.EventType.MOUSEOUT, this.hideOverlayWindow_, true, this);
  }

  if (this.scope['modal']) {
    this.removeModalBg();
  }

  goog.dispose(this.vsm_);
  this.vsm_ = null;

  this.element = null;
  this.scope = null;
};


/**
 * Adds the modal backdrop
 */
os.ui.WindowCtrl.prototype.addModalBg = function() {
  if (!this.modalElement) {
    var container = angular.element(this.scope['windowContainer']);
    this.modalElement = container.append('<div class="window-modal-bg"></div>');
    container.css('overflow', 'hidden');
    this.element.css('z-index', this.scope['zIndex'] || '10001');
  }
};


/**
 * Removes the modal backdrop
 */
os.ui.WindowCtrl.prototype.removeModalBg = function() {
  if (this.modalElement) {
    $('.window-modal-bg').first().remove();
    $(this.scope['windowContainer']).css('overflow', 'auto');
    this.modalElement = null;
  }
};


/**
 * Moves the window on top of other windows in the application.
 */
os.ui.WindowCtrl.prototype.bringToFront = function() {
  this.updateZIndex_();
};
goog.exportProperty(os.ui.WindowCtrl.prototype, 'bringToFront', os.ui.WindowCtrl.prototype.bringToFront);


/**
 * Broadcast a params update event down the scope of the window controller for transcluded contents to handle.
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
  var header = this.element.find('.window-header');
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
  var header = this.element.find('.window-header');
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
 * @param {boolean=} opt_cancel If the cancel event should be fired
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

  // for use with ng-if
  if (goog.isDefAndNotNull(this.scope['closeFlag'])) {
    this.scope['closeFlag'] = !this.scope['closeFlag'];
  } else {
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
  }
};
goog.exportProperty(os.ui.WindowCtrl.prototype, 'close', os.ui.WindowCtrl.prototype.close);


/**
 * Toggles the window content
 */
os.ui.WindowCtrl.prototype.toggle = function() {
  if (!this.scope['modal']) {
    var content = this.element.find('.window-wrapper');

    if (!isNaN(this.lastHeight_)) {
      this.element.height(this.lastHeight_);
      this.lastHeight_ = NaN;
      content.toggle();
      this.element.resizable('option', 'disabled', false);
      this.constrainWindow_();
      this.scope['collapsed'] = false;
    } else {
      this.element.resizable('option', 'disabled', true);
      this.lastHeight_ = this.element.height();
      content.toggle();
      var header = this.element.find('.window-header');
      this.element.height(header.height());
      this.scope['collapsed'] = true;
    }
  }
};
goog.exportProperty(os.ui.WindowCtrl.prototype, 'toggle', os.ui.WindowCtrl.prototype.toggle);


/**
 * Update the window content element.
 * @private
 */
os.ui.WindowCtrl.prototype.updateContent_ = function() {
  if (this.scope && this.scope['noScroll'] === 'true') {
    this.element.find('.window-content').css('overflow', 'hidden');
  }
};


/**
 * Hide (not close) the window and raise an event
 */
os.ui.WindowCtrl.prototype.hide = function() {
  if (this.scope['id']) {
    os.ui.window.toggleVisibility(this.scope['id']);
    var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, this.scope['id']);
    os.dispatcher.dispatchEvent(event);
  }
};
goog.exportProperty(os.ui.WindowCtrl.prototype, 'hide', os.ui.WindowCtrl.prototype.hide);


/**
 * Updates on change
 * @param {?Object} event
 * @param {?Object} ui
 * @protected
 */
os.ui.WindowCtrl.prototype.onChange = function(event, ui) {
  // this is for extensions to this class
};


/**
 * Drag start handler. Fires a start event in case the parent needs to take action.
 * @param {?Object} event
 * @param {?Object} ui
 * @private
 */
os.ui.WindowCtrl.prototype.onDragStart_ = function(event, ui) {
  this.scope.$emit(os.ui.WindowEventType.DRAGSTART);

  // iframes kill mouse events if you roll over them while dragging, so we'll nip that in the bud
  angular.element('iframe').addClass('no-mouse');
};


/**
 * Drag end handler. Fires an end event in case the parent needs to take action.
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
  angular.element('iframe').removeClass('no-mouse');

  // ensure the window is still constrained within the browser window
  this.constrainWindow_();
};


/**
 * Handle modal flag change.
 * @param {boolean=} opt_new
 * @param {boolean=} opt_old
 * @private
 */
os.ui.WindowCtrl.prototype.onToggleModal_ = function(opt_new, opt_old) {
  if (goog.isDef(opt_new) && opt_new != opt_old) {
    if (opt_new) {
      this.addModalBg();
    } else {
      this.removeModalBg();
    }
  }
};


/**
 * Handle close flag change. This updates the window z-index when it's opened.
 * @param {boolean=} opt_new
 * @param {boolean=} opt_old
 * @private
 */
os.ui.WindowCtrl.prototype.onCloseFlag_ = function(opt_new, opt_old) {
  if (opt_new && opt_new != opt_old) {
    this.updateZIndex_();
  }
};


/**
 * If the window isn't a modal and didn't override its z-index, put it on top of other windows by incrementing the
 * global z-index and applying it to the window.
 * @private
 */
os.ui.WindowCtrl.prototype.updateZIndex_ = function() {
  if (!this.scope['modal'] && !this.scope['zIndex'] && this.element &&
      this.element.css('z-index') != os.ui.WindowCtrl.Z) {
    this.element.css('z-index', ++os.ui.WindowCtrl.Z + '');
  }

  if (!this.scope['active']) {
    this.scope['active'] = true;
    os.ui.apply(this.scope);
  }
};


/**
 * Handle viewport resize event.
 * @param {goog.events.Event=} opt_e The resize event.
 * @private
 */
os.ui.WindowCtrl.prototype.onViewportResize_ = function(opt_e) {
  this.constrainWindow_();
};


/**
 * Constrain the window element within the boundaries of the browser window.
 * @private
 */
os.ui.WindowCtrl.prototype.constrainWindow_ = function() {
  // this moves the window back into view rather simplistically
  var x = parseFloat(this.element.css('left').replace('px', ''));
  var y = parseFloat(this.element.css('top').replace('px', ''));
  var w = parseFloat(this.element.css('width').replace('px', ''));
  var h = parseFloat(this.element.css('height').replace('px', ''));

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

  if (y < 0) {
    this.element.css('top', '0px');
  } else if ((y + h) > size.height) {
    y = Math.max(size.height - h, 0);
    this.element.css('top', y + 'px');
  }
};


/**
 * Handle header button click
 * @param {!Event} event
 * @param {!os.ui.window.HeaderBtnConfig} headerBtnCfg
 */
os.ui.WindowCtrl.prototype.onHeaderBtnClick = function(event, headerBtnCfg) {
  var winEl = $(event.target).parents('.window');
  headerBtnCfg.onClick(winEl);
};
goog.exportProperty(
    os.ui.WindowCtrl.prototype,
    'onHeaderBtnClick',
    os.ui.WindowCtrl.prototype.onHeaderBtnClick);
