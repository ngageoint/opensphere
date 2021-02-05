goog.provide('os.ui.WindowEventType');
goog.provide('os.ui.window');
goog.provide('os.ui.window.HeaderBtnConfig');
goog.provide('os.ui.windowCommonElements');
goog.provide('os.ui.windowCommonOptionalElements');
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
  DOCKED: '.docked-window',
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

  // TODO rewrite so this is handled with a manager; so there are no circular dependencies
  var tag = 'window';
  if ('dock' in options) {
    tag = 'docked-window';
  } else if ('key' in options) {
    tag = 'savedwindow';
  }

  var win = '<' + tag;


  for (var key in options) {
    var val = options[key];
    if (key === 'label' && typeof val === 'string') {
      val = val.replace(/"/g, '&quot;');
    }
    win += ' ' + key + '="' + val + '"';
  }

  win += '>' + html + '</' + tag + '>';
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
    Object.assign(s, opt_scopeOptions);
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
    var scope = (el.is(os.ui.windowSelector.WINDOW) || el.is(os.ui.windowSelector.DOCKED)) ?
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
    if (wins.length) {
      os.array.forEach(wins, (win) => os.ui.window.close(/** @type {angular.JQLite} */ ($(win))));
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
 * Get the full list of open windows
 *
 * @return {!Object<string, !Array<!Element>>} The window(s)
 */
os.ui.window.getOpenWindows = function() {
  return os.ui.window.openWindows_;
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
  OPEN: 'windowOpen',
  RECONSTRAIN: 'windowReConstrain',
  READY: 'window.ready'
};
