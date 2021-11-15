goog.declareModuleId('os.url');

/**
 * Regular expression for mailto links.
 * @type {RegExp}
 */
export const MAILTO_REGEXP = /^mailto:/;

/**
 * Regular expression to test if a string starts with a URL scheme.
 * @type {RegExp}
 */
export const URL_SCHEME_REGEXP = /^(ftp|http|https):\/\//;

/**
 * Regular expression for validating URLs.  Copied from Angular.js.  This one is good for testing things you expect to
 * be a single URL (as opposed to multiple).
 * @type {RegExp}
 */
export const URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

/**
 * Regular expression for validating URLs.  This one is specifically being used by os.string.linkify.  It's
 * probably not a good idea to use this unless you know what you're doing.
 * @type {RegExp}
 */
export const URL_REGEXP_LINKY = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)[^\s'"]*[^\s.;,{}<>'"]/;

/**
 * Test if a string has a URL scheme.
 * @param {string|null|undefined} value The value.
 * @return {boolean}
 */
export const hasUrlScheme = (value) => !!value && URL_SCHEME_REGEXP.test(value);

/**
 * Test if a string is a URL.
 * @param {string|null|undefined} value The value.
 * @return {boolean}
 */
export const isUrl = (value) => !!value && URL_REGEXP.test(value);

/**
 * Convert a {@link goog.Uri.QueryData} to an object.
 *
 * @param {goog.Uri.QueryData} qd The query data.
 * @param {Object=} opt_obj The target object.
 * @return {!Object} An object.
 */
export const queryDataToObject = function(qd, opt_obj) {
  var params = opt_obj || {};

  if (qd) {
    var qdString = qd.toString();
    var paramStrings = qdString.split('&');
    paramStrings.forEach(function(param) {
      var parts = param.split('=');
      if (parts.length == 2) {
        params[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }

  return params;
};
