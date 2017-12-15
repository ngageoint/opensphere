goog.provide('os');

goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');
goog.require('goog.userAgent.product.isVersion');
goog.require('os.mixin.closure');
goog.require('os.ol.license');


/**
 * The global event dispatcher.
 * @type {goog.events.EventTarget}
 */
os.dispatcher = new goog.events.EventTarget();


/**
 * The logging window.
 * @type {os.debug.FancierWindow}
 */
os.logWindow = null;


/**
 * @type {string}
 */
os.MainAppSelector = '.os-app';


/**
 * Whether or not we're in OSX
 * @return {boolean}
 */
os.isOSX = function() {
  return /os\s?x/i.test(navigator.userAgent);
};


/**
 * Tests if obj is a numeric value.
 * @param {?} obj
 * @return {boolean}
 */
os.isNumeric = function(obj) {
  // parseFloat NaNs numeric-cast false positives (null|true|false|"")
  // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
  // subtraction forces infinities to NaN
  return !goog.isArrayLike(obj) && obj - parseFloat(obj) >= 0;
};


/**
 * Return the browser type/version, more browser checks (Android) if desired
 * @return {string}
 */
os.browserVersion = function() {
  var key = 'UNKNOWN';
  if (goog.userAgent.product.CHROME) {
    key = 'CHROME';
  } else if (goog.userAgent.product.IE) {
    key = 'IE';
  } else if (goog.userAgent.product.EDGE) {
    key = 'EDGE';
  } else if (goog.userAgent.product.FIREFOX) {
    key = 'FIREFOX';
  } else if (goog.userAgent.product.OPERA) {
    key = 'OPERA';
  } else if (goog.userAgent.product.SAFARI) {
    key = 'SAFARI';
  }
  var version = goog.userAgent.product.VERSION || goog.userAgent.VERSION;
  version = version.split('.')[0];
  var browser = key + '.' + version;
  return browser;
};


/**
 * Debounces the calls of a function by the amount specified in wait.
 * @param {function(...*)} func The function to call
 * @param {number} wait Wait time in ms
 * @param {boolean=} opt_immediate Whether to call it immediately before starting the cooldown
 * @return {function()}
 */
os.debounce = function(func, wait, opt_immediate) {
  var timeout;
  return function() {
    var context = this;
    var args = arguments;
    var later = function() {
      timeout = null;
      if (!opt_immediate) {
        func.apply(context, args);
      }
    };
    if (opt_immediate && !timeout) {
      func.apply(context, args);
    }
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};


/**
 * Strips off any minor revision portions of a string.  That is, anything after and including a second '.'
 * @param {?string} version The complete application version - e.g.: "1.0.1.2"
 * @return {!string} The major version portion of the supplied value - e.g.: "1.0".
 *  Will always return `<thing>.<thing>`, inserting '0' where necessary.
 */
os.getMajorVersion = function(version) {
  if (!version) {
    return '0.0';
  }

  var firstDotIndex = version.indexOf('.');
  var secondDotIndex;
  if (firstDotIndex < 0) {
    // no dot, append one
    return version + '.0';
  } else {
    if (firstDotIndex === 0) {
      // no major version, prepend one
      version = '0' + version;
      firstDotIndex = 1;
    }

    secondDotIndex = version.indexOf('.', firstDotIndex + 1);
    if (secondDotIndex < 0) {
      if (version.lastIndexOf('.') === version.length - 1) {
        // last char is a '.', append 0
        return version + '0';
      } else {
        return version;
      }
    } else {
      return version.substring(0, secondDotIndex);
    }
  }
};


/**
 * Get the parent Window, catching exceptions that may occur. This tests for access to the Window object to avoid
 * cross-origin security exceptions that may occur if the application was launched from a webpage on another domain.
 * @return {!Window}
 */
os.getParentWindow = function() {
  try {
    // all browsers will block cross-origin access to Window.document and throw an exception
    var parent = window.opener || window.parent;
    if (parent && parent.document) {
      return parent;
    }
  } catch (e) {
    // fall through
  }

  // no accessible parent, so return this window
  return window;
};


/**
 * Checks if the current window or optionally an known external window is loaded inside an iframe.
 *
 * If you have an element of an external window, you can get its reference from the DOM.
 *
 *   var doc = elem.ownerDocument; //NOTE, NOT A JQUERY ELEMENT! Use $element[0] to get the DOM element.
 *   var myWin = doc.defaultView || doc.parentWindow;
 *
 * @param {Window=} opt_windowContext a windowContext other than the "this" window.
 * @return {boolean} If inside an iframe
 */
os.inIframe = function(opt_windowContext) {
  var win = opt_windowContext || window;
  try {
    return win.self !== win.top;
  } catch (e) {
    // from stackoverflow: some browsers may block window.top in iframes due to cross-origin policy. not a problem if
    // the iframe is in the same origin, but may as well cover our bases.
    return true;
  }
};


/**
 * Checks whether the current window context contains the main app selector.
 * @return {boolean} If this is the main window.
 */
os.isMainWindow = function() {
  return !!document.querySelector(os.MainAppSelector);
};


/**
 * Opens an HTML popup with the given parameters passed in.
 * @param {string} title The title for the popup
 * @param {string} htmlBody The body HTML text for the popup
 * @param {string=} opt_bgColor Optional color for the background. Defaults to white
 * @param {string=} opt_textColor Optional color for the text. Defaults to black
 */
os.openPopup = function(title, htmlBody, opt_bgColor, opt_textColor) {
  if (!opt_bgColor) {
    opt_bgColor = '#FFFFFF';
  }
  if (!opt_textColor) {
    opt_textColor = '#000000';
  }

  if (htmlBody.indexOf('<![CDATA[') == 0) {
    htmlBody = htmlBody.substring(9);
  }
  if (htmlBody.indexOf('\]\]\>') == htmlBody.length - 3) {
    htmlBody = htmlBody.substring(0, htmlBody.indexOf('\]\]\>'));
  }

  var html;
  if (htmlBody.indexOf('</html>') > -1) {
    html = htmlBody;
  } else {
    html = '<html style=\"background-color: ' + opt_bgColor + '; color: ' + opt_textColor + ';\"><title>' + title +
        '</title><body>' + htmlBody + '</body></html>';
  }
  try {
    if (window['popup']) {
      window['popup'].close();
    }
    window['popup'] = window.open('popup.html', 'description', 'height=' + (window.screen.height / 2.5) +
        ',width=' + (window.screen.width / 2.5) + ',menubar=no,scrollbars=yes,resizable=yes');
    window['popup'].document.write(html);
  } catch (e) {
  }
};


/**
 * @type {?os.xt.Peer}
 */
os.peer = null;
