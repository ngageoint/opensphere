goog.declareModuleId('os.ui.window');

import {forEach} from '../array/array.js';
import {apply} from './ui.js';
import windowSelector from './windowselector.js';
import windowZIndexMax from './windowzindexmax.js';

const {bucket} = goog.require('goog.array');

const {Controller: WindowCtrl} = goog.requireType('os.ui.WindowUI');


/**
 * Number of pixels to cascade windows.
 * @type {number}
 */
export const CASCADE_OFFSET = 20;

/**
 * Map of currently open windows.
 * @type {!Object<string, !Array<!Element>>}
 */
const openWindows = {};

/**
 * Map of currently opening windows.
 * @type {!Object<string, boolean>}
 */
const openingWindows = {};

/**
 * Creates a window by wrapping a window around the given html
 *
 * @param {Object<string, *>} options The attibute/value pairs for the window
 * @param {!string} html The HTML or directive name
 * @param {string=} opt_parent The selector for the parent defaults to <code>#js-window__container</code>
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
export const create = function(options, html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (options['id']) {
    if (isOpening(/** @type {string} */ (options['id']))) {
      return;
    }
    openingWindows['#' + options['id']] = true;
  }

  if (!opt_parent) {
    opt_parent = windowSelector.CONTAINER;
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
  launch(win, opt_parent, opt_scope, opt_compile, opt_scopeOptions);
};

/**
 * Convenience function for adding a new window to the application
 *
 * @param {!string} html The HTML to launch
 * @param {string=} opt_parent The selector for the parent. Defaults to <code>#js-window__container</code>.
 * @param {angular.Scope=} opt_scope The scope that will become the parent scope of the window
 * @param {angular.$compile=} opt_compile The compile function
 * @param {Object<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 */
export const launch = function(html, opt_parent, opt_scope, opt_compile, opt_scopeOptions) {
  if (!opt_parent) {
    opt_parent = windowSelector.CONTAINER;
  }

  if (html.indexOf('<') == -1) {
    // we were just given the directive name
    html = '<' + html + '></' + html + '>';
  }

  var i = angular.element(opt_parent).injector();

  if (i) {
    launchInternal(html,
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
 * @param {Object<string, *>=} opt_scopeOptions Key/value pairs to add to the scope
 * @ngInject
 */
export const launchInternal = function(html, parent, $scope, $compile, opt_scopeOptions) {
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
export const bringToFront = function(id) {
  var win = getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {WindowCtrl} */ (scope['windowCtrl']).bringToFront();
    }
  }
};

/**
 * Temporary toggle windows off with callback
 *
 * @param {?string=} opt_id The window's id (without the #)
 * @return {?Function} callback to toggle windows that got turn off back on
 */
export const toggleVisibility = function(opt_id) {
  var callback = null;
  var wins = opt_id ? getById(opt_id) : angular.element(windowSelector.WINDOW + ':not(.ng-hide)');
  if (wins) {
    wins.removeClass('d-flex');
    wins.addClass('d-none');
    var modalbg = angular.element(windowSelector.MODAL_BG);
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
export const enableModality = function(id) {
  var win = getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {WindowCtrl} */ (scope['windowCtrl']).addModalBg();
      scope['modal'] = true;
    }
    win.draggable('option', 'zIndex', windowZIndexMax.MODAL);
    win.css('zIndex', String(windowZIndexMax.MODAL));
  }
};

/**
 * Turns off modality
 *
 * @param {string} id The window's id (without the #)
 */
export const disableModality = function(id) {
  var win = getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {WindowCtrl} */ (scope['windowCtrl']).removeModalBg();
      scope['modal'] = false;
    }
    win.draggable('option', 'zIndex', windowZIndexMax.STANDARD);
    win.css('zIndex', String(windowZIndexMax.STANDARD));
  }
};

/**
 * Closes the window that contains the given element
 *
 * @param {?angular.JQLite} el An element within the window
 */
export const close = function(el) {
  if (el) {
    var scope = (el.is(windowSelector.WINDOW) || el.is(windowSelector.DOCKED)) ?
      el.children().scope() : el.parents(windowSelector.WINDOW).children().scope();

    if (scope && scope['windowCtrl']) {
      // scope for a window directive, so call the close function
      /** @type {WindowCtrl} */ (scope['windowCtrl']).close();
    } else {
      // check if the element has a close flag on its scope.
      scope = el.children().first().scope();

      if (scope && scope['closeFlag']) {
        scope['closeFlag'] = false;
        apply(scope);
      }
    }
  }
};

/**
 * Closes all windows
 *
 * @param {string=} opt_parent
 */
export const closeAll = function(opt_parent) {
  var container = windowSelector.CONTAINER;
  if (opt_parent) {
    container = opt_parent;
  }
  var winContainer = angular.element(container);
  if (winContainer.length) {
    var wins = winContainer.find(windowSelector.WINDOW);
    if (wins.length) {
      forEach(wins, (win) => close(/** @type {angular.JQLite} */ ($(win))));
    }
  }
};

/**
 * Gets a reference to all windows with the provided id, if open in the application.
 *
 * @param {string} id The id, without the leading `#`.
 * @return {?angular.JQLite} The window(s), if found.
 */
export const getById = function(id) {
  // check if registered by id
  var wins = openWindows['#' + id];

  if (!wins || !wins.length) {
    // check if registered by key
    wins = openWindows[id];
  }

  return wins && wins.length ? angular.element(wins) : null;
};

/**
 * Get the full list of open windows
 *
 * @return {!Object<string, !Array<!Element>>} The window(s)
 */
export const getOpenWindows = function() {
  return openWindows;
};

/**
 * Look up a window by ID and call setParams on it's controller
 *
 * @param {string} id
 * @param {Object} params
 */
export const setParams = function(id, params) {
  var win = getById(id);
  if (win) {
    var scope = win.children().first().scope();
    if (scope && scope['windowCtrl']) {
      /** @type {WindowCtrl} */ (scope['windowCtrl']).setParams(params);
    }
  }
};

/**
 * Checks if a window with the provided id exists in the application.
 *
 * @param {string} id The id, without the leading `#`.
 * @return {boolean} If the window exists.
 */
export const exists = function(id) {
  return !!getById(id);
};

/**
 * Checks if a window with the provided id is in the process of being opened.
 *
 * @param {string} id The id, without the leading `#`.
 * @return {boolean} If the window exists.
 */
export const isOpening = function(id) {
  var wins = openingWindows['#' + id];
  return wins ? true : false;
};

/**
 * Make a window start or stop blinking
 *
 * @param {!string} id window ID
 * @param {boolean=} opt_start Defaults to start (true), stop blinking if false is specified.
 */
export const blink = function(id, opt_start) {
  var win = getById(id);
  if (win) {
    var start = opt_start !== undefined ? opt_start : true;
    var blinkEl = win.find(windowSelector.HEADER + ' ' + windowSelector.HEADER_TEXT + ' i.fa');
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
export const cascade = function(win, from, opt_container) {
  // Shift the window right/down by the cascade offset.
  var fromRect = from.getBoundingClientRect();
  var x = fromRect.x + CASCADE_OFFSET;
  var y = fromRect.y + CASCADE_OFFSET;

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
export const stack = function(topWin) {
  var windows = /** @type {!Array<Element>} */ ($.makeArray($(windowSelector.WINDOW)))
      .sort(sortByZIndex);

  // move the target window to the front
  for (var i = 0; i < windows.length; i++) {
    if (windows[i] === topWin) {
      windows.unshift(windows.splice(i, 1));
      break;
    }
  }

  var windowCategories = bucket(windows, function(win) {
    return $($(win).children()[0]).scope()['modal'] ? 'modal' : 'standard';
  });

  if (windowCategories['modal']) {
    // Go through and set the zIndex for all the windows
    windowCategories['modal'].forEach(function(win, index) {
      var zIndex = String(windowZIndexMax.MODAL - index);
      $(win).draggable('option', 'zIndex', zIndex);
      $(win).css('zIndex', zIndex);
    });
  }

  if (windowCategories['standard']) {
    // Go through and set the zIndex for all the windows
    windowCategories['standard'].forEach(function(win, index) {
      var zIndex = String(windowZIndexMax.STANDARD - index);
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
export const sortByZIndex = function(a, b) {
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
export const registerWindow = function(id, el) {
  delete openingWindows[id];

  if (!openWindows[id]) {
    openWindows[id] = [el];
  } else {
    openWindows[id].push(el);
  }
};

/**
 * Remove a window from the open window map.
 *
 * @param {string} id The window id.
 * @param {!Element} el The element.
 */
export const unregisterWindow = function(id, el) {
  var wins = openWindows[id];
  if (wins) {
    var idx = wins.indexOf(el);
    if (idx > -1) {
      wins.splice(idx, 1);
    }

    if (wins.length === 0) {
      delete openWindows[id];
    }
  }
};
