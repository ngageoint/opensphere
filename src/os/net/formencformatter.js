goog.module('os.net.FormEncFormatter');

const XhrIo = goog.require('goog.net.XhrIo');

const IDataFormatter = goog.requireType('os.net.IDataFormatter');


/**
 * THIS CLASS IS THE DEFAULT POST FORMATTER. IF YOU CHANGE IT, STUFF WILL BREAK.
 * Check out CustomFormatter, JsonEncFormatter, or just go make your own if you
 * need something different.
 *
 * Creates a x-www-form-urlencoded payload for a typical POST request of form data
 *
 * @implements {IDataFormatter}
 */
class FormEncFormatter {
  /**
   * Constructor.
   */
  constructor() {
  }

  /**
   * @inheritDoc
   */
  getContentType() {
    return XhrIo.FORM_CONTENT_TYPE;
  }

  /**
   * @inheritDoc
   */
  format(uri) {
    var q = uri.getQuery();
    uri.getQueryData().clear();
    return q;
  }
}

exports = FormEncFormatter;
