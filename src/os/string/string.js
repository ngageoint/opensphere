goog.module('os.string');
goog.module.declareLegacyNamespace();

const {getRandomString, isEmptyOrWhitespace, makeSafe, removeAll} = goog.require('goog.string');
const Const = goog.require('goog.string.Const');
const {escapeHtml} = goog.require('os.ui');
const {MAILTO_REGEXP, URL_REGEXP_LINKY} = goog.require('os.url');


/**
 * Regular expression to test for boolean strings.
 * @type {RegExp}
 */
const BOOLEAN = /^(true|false)$/i;

/**
 * Regular expression to test for hex strings.
 * @type {RegExp}
 */
const HEX = /^(0x)?[0-9A-Fa-f]+$/;

/**
 * Regular expression to test for floats.
 * @type {RegExp}
 */
const FLOAT = /^[+-]?\d+(\.\d*)?(E[+-]\d+)?$/;

/**
 * Regular expression to test for emails separated by commas.
 * @type {RegExp}
 */
const EMAIL = /^\s*[^@,; ]+@[^@,; ]+\.[^@,; ]+\s*(\s*,\s*[^@,; ]+@[^@,; ]+\.[^@,; ]+)*\s*$/;

/**
 * Regular expression to extract for emails from string
 * @type {RegExp}
 */
const EMAILS = /([a-zA-Z0-9._#\$\&'\*\+/=\?\^`{}\|~-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

/**
 * Tests if a string represents a boolean value
 *
 * @param {string} str The string
 * @return {boolean} If the string represents a boolean value
 */
const isBoolean = function(str) {
  return BOOLEAN.test(str);
};

/**
 * Tests if a string represents a float value
 *
 * @param {string} str The string
 * @return {boolean} If the string represents a float value
 */
const isFloat = function(str) {
  return FLOAT.test(str);
};

/**
 * Tests if a string represents a hex value
 *
 * @param {string} str The string
 * @return {boolean} If the string represents a hex value
 */
const isHex = function(str) {
  return HEX.test(str);
};

/**
 * Linkify a plain text string.
 *
 * @param {string} text The plain text
 * @param {string=} opt_target Optional target param for links
 * @param {string=} opt_class Optional class to use for the links
 * @param {string=} opt_title Optional title to use for the links
 * @param {string=} opt_htmlText Optional html text name to give the links
 * @param {string=} opt_clickHandler Optional click handler for the anchor tag
 * @return {string} Linkified text
 */
const linkify = function(text, opt_target, opt_class, opt_title, opt_htmlText, opt_clickHandler) {
  var addText = function(text) {
    if (!text) {
      return;
    }
    html.push(escapeHtml(text));
  };

  var addLink = function(url, text) {
    html.push('<a ');
    if (opt_class) {
      html.push('class="');
      html.push(opt_class);
      html.push('" ');
    }
    if (opt_title) {
      html.push('title="');
      html.push(opt_title);
      html.push('" ');
    }
    if (opt_target) {
      html.push('target="');
      html.push(opt_target);
      html.push('" ');
    }
    if (opt_clickHandler) {
      html.push('ng-click="');
      html.push(opt_clickHandler);
      html.push('" ');
    }
    html.push('href="');
    html.push(url);
    html.push('">');
    addText(opt_htmlText ? opt_htmlText : text);
    html.push('</a>');
  };

  if (!text) {
    return text;
  }
  var match;
  var raw = text;
  var html = [];
  var url;
  var i;
  while ((match = raw.match(URL_REGEXP_LINKY))) {
    // We can not end in these as they are sometimes found at the end of the sentence
    url = match[0];
    // if we did not match ftp/http/mailto then assume mailto
    if (match[2] == match[3]) {
      url = 'mailto:' + url;
    }
    i = match.index;
    addText(raw.substr(0, i));
    addLink(url, match[0].replace(MAILTO_REGEXP, ''));
    raw = raw.substring(i + match[0].length);
  }
  addText(raw);

  return html.join('');
};

/**
 * Automatically determines a delimiter and splits a string.  Optionally takes an array of delimiters ordered by
 * precedence in case the default precedence saddens you.
 *
 * @param {string} str
 * @param {boolean=} opt_removeSpaces If the string should have spaces removed before splitting.  This is helpful
 *   to split with or without spaces (so ',' and ', ' are treated the same).  If space is the delimeter, this option
 *   is not exercised.
 * @param {Array<string>=} opt_precedence
 * @return {!Array<!string>}
 */
const split = function(str, opt_removeSpaces, opt_precedence) {
  var precedence = opt_precedence || [',', ';', '\t', '\n', ' '];
  var removeSpaces = !!opt_removeSpaces;

  var result;
  if (str) {
    var trimmed = str.trim();
    var delim;
    for (var i = 0, ii = precedence.length; i < ii; i++) {
      if (trimmed.includes(precedence[i])) {
        delim = precedence[i];
        break;
      }
    }

    if (removeSpaces && delim !== ' ') {
      trimmed = removeAll(trimmed, ' ');
    }
    result = delim ? trimmed.split(delim) : [trimmed];
    result = result.filter(function(r) {
      return !isEmptyOrWhitespace(makeSafe(r));
    });
  }
  return result || [];
};

/**
 * @suppress {accessControls} To allow creating a constant string from the URL, which varies by environment.
 * @param {!string} str
 * @return {!Const}
 */
const createConstant = function(str) {
  return new Const(Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_, str);
};

/**
 * This keeps the last instance of the substring and removes all others
 *
 * @param {?string} str The full string
 * @param {?string} substr The substring whose duplicates to remove
 * @return {string}
 */
const removeDuplicates = function(str, substr) {
  var result = str || '';
  if (str && substr) {
    var parts = str.split(substr);
    if (parts.length > 1) {
      var b = parts.pop();
      var a = parts.pop();
      result = parts.join('') + a + substr + b;
    } else if (parts.length == 1) {
      result = parts[0];
    }
  }

  return result;
};

/**
 * Generate a random string that conforms to the rules of js variable name conventions
 *
 * @return {string}
 */
const randomString = function() {
  var s = getRandomString();
  var code = s.charCodeAt(0);
  if (code > 64) {
    return s;
  }
  return String.fromCharCode(code + 50) + s.substring(1);
};

exports = {
  BOOLEAN,
  HEX,
  FLOAT,
  EMAIL,
  EMAILS,
  isBoolean,
  isFloat,
  isHex,
  linkify,
  split,
  createConstant,
  removeDuplicates,
  randomString
};
