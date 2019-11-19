goog.provide('os.ui.WindowCtrl');
goog.provide('os.ui.WindowEventType');
goog.provide('os.ui.window');
goog.provide('os.ui.window.HeaderBtnConfig');
goog.provide('os.ui.windowCommonElements');
goog.provide('os.ui.windowCommonOptionalElements');
goog.provide('os.ui.windowDirective');
goog.provide('os.ui.windowSelector');
goog.provide('os.ui.windowZIndexMax');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyHandler');
goog.require('goog.log');
goog.require('ol.array');
goog.require('os.array');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.onboarding.contextOnboardingDirective');


/**
 * Selectors for window compontents
 * @enum {string}
 */
os.ui.windowSelector = {
  APP: '#ng-app',
  CONTAINER: '#js-window__container',
  CONTENT: '.js-window__content',
  HEADER: '.js-window__header',
  HEADER_TEXT: '.js-window__header-text',
  MODAL_BG: '.modal-backdrop',
  WINDOW: '.js-window',
  WRAPPER: '.js-window__wrapper'
};


/**
 * Common selectors for window elements which are always considered for positioning application UI's.
 * Individual applications may append items to this array as needed.
 * @type {!Array.<!string>}
 */
os.ui.windowCommonElements = ['.js-navtop', '.js-navbottom'];

/**
 * Common selectors for elements which are optionally considered for positioning application UI's.
 * Individual applicatoins may append items to this array as needed, and any positioning logic should determine
 * whether or not to use these optional elements on a case-by-case basis.
 * For example, some fixed, overlaying panels may not want to consider these elements, but other inline panels do.
 * @type {!Array.<!string>}
 */
os.ui.windowCommonOptionalElements = [];


/**
 * The max z-index for windows
 * @enum {number}
 */
os.ui.windowZIndexMax = {
  MODAL: 1049,
  STANDARD: 990
};


/**
 * Number of pixels to cascade windows.
 * @type {number}
 * @const
 */
os.ui.window.CASCADE_OFFSET = 20;


/**
 * Logger for os.ui.window.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.window.LOGGER_ = goog.log.getLogger('os.ui.window');


/**
 * Map of currently open windows.
 * @type {!Object<string, !Array<!Element>>}
 * @private
 */
os.ui.window.openWindows_ = {};


/**
 * Map of currently open windows.
 * @type {!Object<string, boolean>}
 * @private
 */
os.ui.window.opening_ = {};


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
      'noScroll': '@',
      'overlay': '@',
      'modal': '=',
      'disableDrag': '@',
      'windowContainer': '@',
      /* Array.<os.ui.window.HeaderBtnConfig> */
      'headerBtns': '=?',
      'border': '='
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
 *
 * @param {Object.<string, *>} options The attibute/value pairs for the window
 * @param {!string} html The HTML or directive name
 * @param {string=} opt_parent The selector for the parent defaults to <code>#js-window__container</code>
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object.<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
os.ui.window.create = function(options, html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (options['id']) {
    if (os.ui.window.isOpening(/** @type {string} */ (options['id']))) {
      return;
    }
    os.ui.window.opening_['#' + options['id']] = true;
  }

  if (!opt_parent) {
    opt_parent = os.ui.windowSelector.CONTAINER;
  }

  if (html.indexOf('<') == -1) {
    // we were just given the directive name
    html = '<' + html + '></' + html + '>';
  }

  var win = '<' + ('key' in options ? 'savedwindow' : 'window');

  for (var key in options) {
    var val = options[key];
    if (key === 'label' && typeof val === 'string') {
      val = val.replace(/"/g, '&quot;');
    }
    win += ' ' + key + '="' + val + '"';
  }

  win += '>' + html + '</' + ('key' in options ? 'savedwindow' : 'window') + '>';
  os.ui.window.launch(win, opt_parent, opt_scope, opt_compile, opt_scopeOptions);
};


/**
 * Convenience function for adding a new window to the application
 *
 * @param {!string} html The HTML to launch
 * @param {string=} opt_parent The selector for the parent. Defaults to <code>#js-window__container</code>.
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object.<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
os.ui.window.launch = function(html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (!opt_parent) {
    opt_parent = os.ui.windowSelector.CONTAINER;
  }

  if (html.indexOf('<') == -1) {
    // we were just given the directive name
    html = '<' + html + '></' + html + '>';
  }

  var i = angular.element(opt_parent).injector();

  if (i) {
    os.ui.window.launchInternal(html,
        opt_parent,
        opt_scope || $('[ng-view]').scope() || i.get('$rootScope'),
        opt_compile || i.get('$compile'),
        opt_scopeOptions);
  }
};


/**
 * Internal convenience function that handles scope and compile injection.
 *
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
  if (opt_scopeOptions != null) {
    goog.object.extend(s, opt_scopeOptions);
  }

  // compile and add
  $compile(html)(s).appendTo(parent);
};


/**
 * Brings a window to the front of all other windows
 *
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
 *
 * @param {?string=} opt_id The window's id (without the #)
 * @return {?Function} callback to toggle windows that got turn off back on
 */
os.ui.window.toggleVisibility = function(opt_id) {
  var callback = null;
  var wins = opt_id ? os.ui.window.getById(opt_id) : angular.element(os.ui.windowSelector.WINDOW + ':not(.ng-hide)');
  if (wins) {
    wins.removeClass('d-flex');
    wins.addClass('d-none');
    var modalbg = angular.element(os.ui.windowSelector.MODAL_BG);
    if (modalbg) {
      modalbg.addClass('d-none');
    }

    /**
     * callback removes the hidden class and adds modal background if necessary
     */
    callback = function() {
      wins.removeClass('d-none');
      wins.addClass('d-flex');
      if (modalbg) {
        modalbg.removeClass('d-none');
      }
    };
  }

  return callback;
};


/**
 * Turns on modality
 *
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
    win.draggable('option', 'zIndex', os.ui.windowZIndexMax.MODAL);
    win.css('zIndex', String(os.ui.windowZIndexMax.MODAL));
  }
};


/**
 * Turns off modality
 *
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
    win.draggable('option', 'zIndex', os.ui.windowZIndexMax.STANDARD);
    win.css('zIndex', String(os.ui.windowZIndexMax.STANDARD));
  }
};


/**
 * Closes the window that contains the given element
 *
 * @param {?angular.JQLite} el An element within the window
 */
os.ui.window.close = function(el) {
  if (el) {
    var scope = el.is(os.ui.windowSelector.WINDOW) ?
      el.children().scope() : el.parents(os.ui.windowSelector.WINDOW).children().scope();
    if (scope && scope['windowCtrl']) {
      // scope for a window directive, so call the close function
      /** @type {os.ui.WindowCtrl} */ (scope['windowCtrl']).close();
    } else {
      // check if the element has a close flag on its scope.
      scope = el.children().first().scope();

      if (scope && scope['closeFlag']) {
        scope['closeFlag'] = false;
        os.ui.apply(scope);
      }
    }
  }
};


/**
 * Closes all windows
 *
 * @param {string=} opt_parent
 */
os.ui.window.closeAll = function(opt_parent) {
  var container = os.ui.windowSelector.CONTAINER;
  if (opt_parent) {
    container = opt_parent;
  }
  var winContainer = angular.element(container);
  if (winContainer.length) {
    var wins = winContainer.find(os.ui.windowSelector.WINDOW);
    if (wins instanceof Array) {
      os.array.forEach(wins, function(win) {
        os.ui.window.close(win);
      });
    } else {
      os.ui.window.close(wins);
    }
  }
};


/**
 * Gets a reference to all windows with the provided id, if open in the application.
 *
 * @param {string} id The id, without the leading `#`.
 * @return {?angular.JQLite} The window(s), if found.
 */
os.ui.window.getById = function(id) {
  // check if registered by id
  var wins = os.ui.window.openWindows_['#' + id];

  if (!wins || !wins.length) {
    // check if registered by key
    wins = os.ui.window.openWindows_[id];
  }

  return wins && wins.length ? angular.element(wins) : null;
};


/**
 * Look up a window by ID and call setParams on it's controller
 *
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
 *
 * @param {string} id The id, without the leading `#`.
 * @return {boolean} If the window exists.
 */
os.ui.window.exists = function(id) {
  return !!os.ui.window.getById(id);
};


/**
 * Checks if a window with the provided id is in the process of being opened.
 *
 * @param {string} id The id, without the leading `#`.
 * @return {boolean} If the window exists.
 */
os.ui.window.isOpening = function(id) {
  var wins = os.ui.window.opening_['#' + id];
  return wins ? true : false;
};


/**
 * Make a window start or stop blinking
 *
 * @param {!string} id window ID
 * @param {boolean=} opt_start Defaults to start (true), stop blinking if false is specified.
 */
os.ui.window.blink = function(id, opt_start) {
  var win = os.ui.window.getById(id);
  if (win) {
    var start = opt_start !== undefined ? opt_start : true;
    var blinkEl = win.find(os.ui.windowSelector.HEADER + ' ' + os.ui.windowSelector.HEADER_TEXT + ' i.fa');
    if (start) {
      blinkEl.addClass('a-pulsate');
    } else {
      blinkEl.removeClass('a-pulsate');
    }
  }
};


/**
 * Cascade a window against another.
 *
 * @param {!Element} win The window to cascade.
 * @param {!Element} from The window to cascade against.
 * @param {Element=} opt_container The window container.
 */
os.ui.window.cascade = function(win, from, opt_container) {
  // Shift the window right/down by the cascade offset.
  var fromRect = from.getBoundingClientRect();
  var x = fromRect.x + os.ui.window.CASCADE_OFFSET;
  var y = fromRect.y + os.ui.window.CASCADE_OFFSET;

  //
  // If there is a container:
  //  - Test if the window would exceed the right edge. If so, move to the left edge.
  //  - Test if the window would exceed the bottom edge. If so, move to the top edge.
  //
  if (opt_container) {
    var containerRect = opt_container.getBoundingClientRect();
    var winRect = win.getBoundingClientRect();
    if (x + winRect.width > containerRect.x + containerRect.width) {
      x = containerRect.x;
    }

    if (y + winRect.height > containerRect.y + containerRect.height) {
      y = containerRect.y;
    }
  }

  // Set the window position.
  $(win).css('left', x + 'px');
  $(win).css('top', y + 'px');
};


/**
 * Stack all the windows under this window
 *
 * @param {!Element} topWin The top window.
 */
os.ui.window.stack = function(topWin) {
  var windows = /** @type {!Array<Element>} */ ($.makeArray($(os.ui.windowSelector.WINDOW)))
      .sort(os.ui.window.sortByZIndex);

  // move the target window to the front
  for (var i = 0; i < windows.length; i++) {
    if (windows[i] === topWin) {
      windows.unshift(windows.splice(i, 1));
      break;
    }
  }

  var windowCategories = goog.array.bucket(windows, function(win) {
    return $($(win).children()[0]).scope()['modal'] ? 'modal' : 'standard';
  });

  if (windowCategories['modal']) {
    // Go through and set the zIndex for all the windows
    windowCategories['modal'].forEach(function(win, index) {
      var zIndex = String(os.ui.windowZIndexMax.MODAL - index);
      $(win).draggable('option', 'zIndex', zIndex);
      $(win).css('zIndex', zIndex);
    });
  }

  if (windowCategories['standard']) {
    // Go through and set the zIndex for all the windows
    windowCategories['standard'].forEach(function(win, index) {
      var zIndex = String(os.ui.windowZIndexMax.STANDARD - index);
      $(win).draggable('option', 'zIndex', zIndex);
      $(win).css('zIndex', zIndex);
    });
  }
};


/**
 * Sort window elements by descending CSS `zIndex`.
 *
 * @param {Element} a A window.
 * @param {Element} b Another window.
 * @return {number} The sort value.
 */
os.ui.window.sortByZIndex = function(a, b) {
  var aIndex = $(a).css('zIndex') || 0;
  var bIndex = $(b).css('zIndex') || 0;
  return aIndex > bIndex ? -1 : aIndex < bIndex ? 1 : 0;
};


/**
 * Register an open window.
 *
 * @param {string} id The window id.
 * @param {!Element} el The element.
 */
os.ui.window.registerWindow = function(id, el) {
  delete os.ui.window.opening_[id];

  if (!os.ui.window.openWindows_[id]) {
    os.ui.window.openWindows_[id] = [el];
  } else {
    os.ui.window.openWindows_[id].push(el);
  }
};


/**
 * Remove a window from the open window map.
 *
 * @param {string} id The window id.
 * @param {!Element} el The element.
 */
os.ui.window.unregisterWindow = function(id, el) {
  var wins = os.ui.window.openWindows_[id];
  if (wins) {
    ol.array.remove(wins, el);

    if (wins.length === 0) {
      delete os.ui.window.openWindows_[id];
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
  RECONSTRAIN: 'windowReConstrain',
  READY: 'window.ready'
};



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

  if ($scope['y'] == 'center') {
    var maxHeight = Math.min($(window).height(), container.height());
    if ($scope['height'] == 'auto') {
      // Put the element off the screen at the top
      $element.css('top', '-20000px');

      var readyPromise;
      var readyOff;
      var onWindowReady = function() {
        // Try cascading the window first. If there aren't any windows to cascade against, use the config.
        if (!this.cascade()) {
          var height = $element.height();
          $scope['y'] = (maxHeight - height) / 2;
          $element.css('top', $scope['y'] + 'px');
        }

        this.constrainWindow_();
      }.bind(this);

      // make sure the window gets positioned eventually. windows should fire a os.ui.WindowEventType.READY event to
      // indicate they are initialized and ready to be positioned.
      readyPromise = $timeout(function() {
        // fail an assertion to make this more obvious in debug mode, and log a warning otherwise.
        var errorMessage = 'Window READY event was not fired for "' + $scope['label'] + '"!';
        goog.asserts.fail(errorMessage);
        goog.log.warning(os.ui.window.LOGGER_, errorMessage);

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
    goog.object.extend(resizeConfig, $scope['resizeOptions'] || {});
    $element.resizable(resizeConfig);
  }

  $element.css('width', $scope['width'] + 'px');

  var height = $scope['height'];
  if ($scope['height'] == 'auto') {
    $element.css('bottom', 'auto');
  } else {
    height += 'px';
  }
  $element.css('height', height);

  if (!this.cascade()) {
    // if the window wasn't cascaded, position it based off the config
    $element.css('left', $scope['x'] + 'px');

    if (!($scope['y'] == 'center' && $scope['height'] == 'auto')) {
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
    this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
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
    this.bringToFront();

    if (this.element && !this.resizeFn_) {
      this.resizeFn_ = this.onWindowResize_.bind(this);
      os.ui.resize(this.element, this.resizeFn_);
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
    this.keyHandler_.unlisten(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
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
    this.removeModalBg();
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
 */
os.ui.WindowCtrl.prototype.removeModalBg = function() {
  if (this.modalElement) {
    $('body').removeClass('modal-open');
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
      this.element.resizable('option', 'disabled', false);
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
  if (!this.scope['modal']) {
    this.bringToFront();
  }

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

  if (y < winContainerTop) {
    this.element.css('top', winContainerTop + 'px');
  } else if ((y + h) > size.height) {
    y = Math.max(size.height - h, winContainerTop);
    this.element.css('top', y + 'px');
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
