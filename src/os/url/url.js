goog.module('os.url');
goog.module.declareLegacyNamespace();


/**
 * Regular expression for mailto links.
 * @type {RegExp}
 */
const MAILTO_REGEXP = /^mailto:/;

/**
 * Regular expression for validating URLs.  Copied from Angular.js.  This one is good for testing things you expect to
 * be a single URL (as opposed to multiple).
 * @type {RegExp}
 */
const URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

/**
 * Regular expression for validating URLs.  This one is specifically being used by os.string.linkify.  It's
 * probably not a good idea to use this unless you know what you're doing.
 * @type {RegExp}
 */
const URL_REGEXP_LINKY = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)[^\s'"]*[^\s.;,{}<>'"]/;

/**
 * Convert a {@link goog.Uri.QueryData} to an object.
 *
 * @param {goog.Uri.QueryData} qd The query data.
 * @param {Object=} opt_obj The target object.
 * @return {!Object} An object.
 */
const queryDataToObject = function(qd, opt_obj) {
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

exports = {
  MAILTO_REGEXP,
  URL_REGEXP,
  URL_REGEXP_LINKY,
  queryDataToObject
};
