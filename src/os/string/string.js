goog.provide('os.string');
goog.require('goog.array');
goog.require('goog.string');
goog.require('os.url');


/**
 * Regular expression to test for boolean strings.
 * @type {RegExp}
 * @const
 */
os.string.BOOLEAN = /^(true|false)$/i;


/**
 * Regular expression to test for hex strings.
 * @type {RegExp}
 * @const
 */
os.string.HEX = /^(0x)?[0-9A-Fa-f]+$/;


/**
 * Regular expression to test for floats.
 * @type {RegExp}
 * @const
 */
os.string.FLOAT = /^[+-]?\d+(\.\d*)?(E[+-]\d+)?$/;


/**
 * Regular expression to test for emails separated by commas.
 * @type {RegExp}
 * @const
 */
os.string.EMAIL = /^\s*[^@,; ]+@[^@,; ]+\.[^@,; ]+\s*(\s*,\s*[^@,; ]+@[^@,; ]+\.[^@,; ]+)*\s*$/;


/**
 * Regular expression to extract for emails from string
 * @type {RegExp}
 * @const
 */
os.string.EMAILS = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;


/**
 * Tests if a string represents a boolean value
 * @param {string} str The string
 * @return {boolean} If the string represents a boolean value
 */
os.string.isBoolean = function(str) {
  return os.string.BOOLEAN.test(str);
};


/**
 * Tests if a string represents a float value
 * @param {string} str The string
 * @return {boolean} If the string represents a float value
 */
os.string.isFloat = function(str) {
  return os.string.FLOAT.test(str);
};


/**
 * Tests if a string represents a hex value
 * @param {string} str The string
 * @return {boolean} If the string represents a hex value
 */
os.string.isHex = function(str) {
  return os.string.HEX.test(str);
};


/**
 * Linkify a plain text string.
 * @param {string} text The plain text
 * @param {string=} opt_target Optional target param for links
 * @param {string=} opt_class Optional class to use for the links
 * @param {string=} opt_title Optional title to use for the links
 * @param {string=} opt_htmlText Optional html text name to give the links
 * @return {string} Linkified text
 */
os.string.linkify = function(text, opt_target, opt_class, opt_title, opt_htmlText) {
  var addText = function(text) {
    if (!text) {
      return;
    }
    html.push(text);
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
  while ((match = raw.match(os.url.URL_REGEXP_LINKY))) {
    // We can not end in these as they are sometimes found at the end of the sentence
    url = match[0];
    // if we did not match ftp/http/mailto then assume mailto
    if (match[2] == match[3]) {
      url = 'mailto:' + url;
    }
    i = match.index;
    addText(raw.substr(0, i));
    addLink(url, match[0].replace(os.url.MAILTO_REGEXP, ''));
    raw = raw.substring(i + match[0].length);
  }
  addText(raw);

  return html.join('');
};


/**
 * Automatically determines a delimiter and splits a string.  Optionally takes an array of delimiters ordered by
 * precedence in case the default precedence saddens you.
 * @param {string} str
 * @param {boolean=} opt_removeSpaces If the string should have spaces removed before splitting.  This is helpful
 *   to split with or without spaces (so ',' and ', ' are treated the same).  If space is the delimeter, this option
 *   is not exercised.
 * @param {Array.<string>=} opt_precedence
 * @return {!Array.<!string>}
 */
os.string.split = function(str, opt_removeSpaces, opt_precedence) {
  var precedence = opt_precedence || [',', ';', '\t', '\n', ' '];
  var removeSpaces = !!opt_removeSpaces;

  var result;
  if (str) {
    var trimmed = goog.string.trim(str);
    var delim;
    for (var i = 0, ii = precedence.length; i < ii; i++) {
      if (goog.string.contains(trimmed, precedence[i])) {
        delim = precedence[i];
        break;
      }
    }

    if (removeSpaces && delim !== ' ') {
      trimmed = goog.string.removeAll(trimmed, ' ');
    }
    result = delim ? trimmed.split(delim) : [trimmed];
    result = goog.array.filter(result, function(r) {
      return !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(r));
    });
  }
  return result || [];
};


/**
 * @suppress {accessControls} To allow creating a constant string from the URL, which varies by environment.
 * @param {!string} str
 * @return {!goog.string.Const}
 */
os.string.createConstant = function(str) {
  return goog.string.Const.create__googStringSecurityPrivate_(str);
};
