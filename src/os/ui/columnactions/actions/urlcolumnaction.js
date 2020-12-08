goog.module('os.ui.columnactions.actions.UrlColumnAction');
goog.module.declareLegacyNamespace();

const googString = goog.require('goog.string');
const window = goog.require('goog.window');
const AbstractColumnAction = goog.require('os.ui.columnactions.AbstractColumnAction');


goog.require('goog.Uri');

/**
 */
class UrlColumnAction extends AbstractColumnAction {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @private
     */
    this.url_;
  }

  /**
   * @inheritDoc
   */
  setAction(action) {
    this.url_ = /** @type {string} */ (action);
  }

  /**
   * @inheritDoc
   */
  execute(value) {
    window.open(this.processValue_(value), {'target': '_blank'});
  }

  /**
   * @inheritDoc
   */
  matches(context, column, value) {
    var sourceId;
    var sourceUrl;
    try {
      if (context != null) {
        sourceId = context['sourceId'];
        sourceUrl = context['sourceUrl'];
      }

      if (this.url_ && this.getDescription()) {
        var regVal = this.regexps['val'];
        var regCol = this.regexps['col'];
        var regUrl = this.regexps['url'];
        var regId = this.regexps['id'];

        if (sourceId && regId && !regId.test(sourceId)) {
          return false;
        }

        if (sourceUrl && regUrl && !regUrl.test(sourceUrl)) {
          return false;
        }

        if (column && regCol && !regCol.test(column.getDataField()) && !regCol.test(column.getTitle())) {
          return false;
        }

        if (regVal) {
          var s = value ? value.toString() : '';

          if (!regVal.test(s)) {
            return false;
          }
        }

        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * @inheritDoc
   */
  toDisplay(value) {
    return {'tooltip': this.processValue_(value), 'text': googString.buildString(value,
        ' <i class=\'fa fa-external-link\'></i>')};
  }

  /**
   *
   * @param {?*} value
   * @return {*}
   */
  getAction(value) {
    return this.processValue_(value);
  }

  /**
   *
   * @param {?*} value
   * @return {string}
   * @private
   */
  processValue_(value) {
    // if there was a value regex, the value should be the matched substring
    var valueRegex = this.regexps['val'];
    if (valueRegex) {
      var result = valueRegex.exec(value);
      if (result && result[0]) {
        value = result[0];
      }
    }
    var search = this.regexps['search'];
    var replace = this.regexps['replace'];
    if (value && search && replace !== null) {
      value = value.replace(search, replace);
    }

    var url = this.url_.replace('%s', /** @type {string} */ (value));
    return url;
  }
}

exports = UrlColumnAction;
