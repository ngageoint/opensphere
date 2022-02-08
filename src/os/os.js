goog.declareModuleId('os');

import './mixin/closuremixin.js';
import './ol/license.js';
import * as keys from './metrics/metricskeys.js';

const EventTarget = goog.require('goog.events.EventTarget');
const userAgent = goog.require('goog.userAgent');
const product = goog.require('goog.userAgent.product');

const {default: DataManager} = goog.requireType('os.data.DataManager');
const {default: FancierWindow} = goog.requireType('os.debug.FancierWindow');
const {default: Peer} = goog.requireType('os.xt.Peer');


/**
 * @define {string} The root namespace for DB and storage keys
 */
export const NAMESPACE = goog.define('os.NAMESPACE', 'opensphere');

/**
 * @define {string} The path to this project
 */
export const ROOT = goog.define('os.ROOT', '../opensphere/');

/**
 * @define {string} The path to this project
 */
export const APP_ROOT = goog.define('os.APP_ROOT', './');

/**
 * @define {string} The settings file
 */
export const SETTINGS = goog.define('os.SETTINGS', '.build/settings-debug.json');

/**
 * @define {string} The DB name for settings storage
 */
export const SETTINGS_DB_NAME = goog.define('os.SETTINGS_DB_NAME', NAMESPACE + '.settings');

/**
 * @define {string} The database name used to transfer between apps
 */
export const SHARED_FILE_DB_NAME = goog.define('os.SHARED_FILE_DB_NAME', 'com.bitsys.db');

/**
 * @define {string} Shared IDB store name.
 */
export const SHARED_STORE_NAME = goog.define('os.SHARED_STORE_NAME', 'shared');

/**
 * @define {string} Shared IDB name.
 */
export const SHARED_DB_NAME = goog.define('os.SHARED_DB_NAME', NAMESPACE + '.shared');

/**
 * @define {number} Shared IDB version.
 */
export const SHARED_DB_VERSION = goog.define('os.SHARED_DB_VERSION', 2);

/**
 * @define {string} Area manager's storage save key
 */
export const AREA_STORAGE_KEY = goog.define('os.AREA_STORAGE_KEY', 'areas');

/**
 * @define {string} Area manager's storage save key for all current areas, including temps
 */
export const ALL_AREA_STORAGE_KEY = goog.define('os.ALL_AREA_STORAGE_KEY', 'areasAll');

/**
 * @define {string} The storage key used for column mappings.
 */
export const COLUMN_MAPPINGS_STORAGE_KEY = goog.define('os.COLUMN_MAPPINGS_STORAGE_KEY', 'columnMappings');

/**
 * @define {string} The database name. Override this in the application to use a separate database for storage.
 */
export const FILE_DB_NAME = goog.define('os.FILE_DB_NAME', NAMESPACE + '.files');

/**
 * @define {number} The database version.
 */
export const FILE_DB_VERSION = goog.define('os.FILE_DB_VERSION', 2);

/**
 * @define {string} The file store name
 */
export const FILE_STORE_NAME = goog.define('os.FILE_STORE_NAME', 'files');

/**
 * @define {string} The storage key for filters
 */
export const FILTER_STORAGE_KEY = goog.define('os.FILTER_STORAGE_KEY', 'filters');

/**
 * Global data manager reference. Set this in each application with the app-specific manager reference.
 * @type {DataManager}
 */
export let dataManager = null;

/**
 * Set the global data manager.
 * @param {DataManager} value The data manager.
 */
export const setDataManager = (value) => {
  dataManager = value;
};

/**
 * TODO after running the ES6 conversion on a lot of the files, bring this deprecated to life; it'd add
 * over a thousand warnings right now.
 *
 * The global event dispatcher.
 * @type {!EventTarget}
 * <AT>deprecated Please use goog.require('os.Dispatcher').getInstance() instead
 */
export let dispatcher = new EventTarget();

/**
 * Set the global event dispatcher.
 * @param {!EventTarget} value The dispatcher.
 */
export const setDispatcher = (value) => {
  dispatcher = value;
};

/**
 * The logging window.
 * @type {FancierWindow}
 */
export let logWindow = null;

/**
 * Set the log window.
 * @param {FancierWindow} win The log window.
 */
export const setLogWindow = (win) => {
  logWindow = win;
};

/**
 * @type {string}
 */
export const MainAppSelector = '.os-app';

/**
 * @type {string}
 */
export const DefaultAppName = 'OpenSphere';

/**
 * Whether or not we're in OSX
 *
 * @return {boolean}
 */
export const isOSX = function() {
  return /os\s?x/i.test(navigator.userAgent);
};

/**
 * Tests if obj is a numeric value.
 *
 * @param {?} obj
 * @return {boolean}
 */
export const isNumeric = function(obj) {
  // parseFloat NaNs numeric-cast false positives (null|true|false|"")
  // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
  // subtraction forces infinities to NaN
  return !goog.isArrayLike(obj) && obj - parseFloat(obj) >= 0;
};

/**
 * Return the browser type/version, more browser checks (Android) if desired
 *
 * @return {string}
 */
export const browserVersion = function() {
  var key = 'UNKNOWN';
  if (product.CHROME) {
    key = 'CHROME';
  } else if (product.IE) {
    key = 'IE';
  } else if (product.EDGE) {
    key = 'EDGE';
  } else if (product.FIREFOX) {
    key = 'FIREFOX';
  } else if (product.OPERA) {
    key = 'OPERA';
  } else if (product.SAFARI) {
    key = 'SAFARI';
  }
  var version = product.VERSION || userAgent.VERSION;
  version = version.split('.')[0];
  var browser = key + '.' + version;
  return browser;
};

/**
 * Return the browser type/version, more browser checks (Android) if desired
 *
 * @return {string}
 */
export const operatingSystem = function() {
  var key = 'os.UNKNOWN';
  if (userAgent.LINUX) {
    key = keys.OS.LINUX;
  } else if (userAgent.WINDOWS) {
    key = keys.OS.WINDOWS;
  } else if (userAgent.MAC) {
    key = keys.OS.MAC;
  } else if (userAgent.IOS) {
    key = keys.OS.IOS;
  } else if (userAgent.ANDROID) {
    key = keys.OS.ANDROID;
  }
  return key;
};

/**
 * Debounces the calls of a function by the amount specified in wait.
 *
 * @param {function(...*)} func The function to call
 * @param {number} wait Wait time in ms
 * @param {boolean=} opt_immediate Whether to call it immediately before starting the cooldown
 * @return {function()}
 */
export const debounce = function(func, wait, opt_immediate) {
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
 *
 * @param {?string} version The complete application version - e.g.: "1.0.1.2"
 * @return {!string} The major version portion of the supplied value - e.g.: "1.0".
 *  Will always return `<thing>.<thing>`, inserting '0' where necessary.
 */
export const getMajorVersion = function(version) {
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
 *
 * @return {!Window}
 */
export const getParentWindow = function() {
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
export const inIframe = function(opt_windowContext) {
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
 *
 * @return {boolean} If this is the main window.
 */
export const isMainWindow = function() {
  return !!document.querySelector(MainAppSelector);
};

/**
 * Opens an HTML popup with the given parameters passed in.
 *
 * @param {string} title The title for the popup
 * @param {string} htmlBody The body HTML text for the popup
 * @param {string=} opt_bgColor Optional color for the background. Defaults to white
 * @param {string=} opt_textColor Optional color for the text. Defaults to black
 */
export const openPopup = function(title, htmlBody, opt_bgColor, opt_textColor) {
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
 * The global peer instance.
 * @type {Peer}
 */
export let peer = null;

/**
 * Set the global peer instance.
 * @param {Peer} value The instance.
 */
export const setPeer = (value) => {
  peer = value;
};
