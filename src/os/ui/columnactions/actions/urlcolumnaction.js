goog.provide('os.ui.columnactions.actions.UrlColumnAction');
goog.require('goog.Uri');
goog.require('goog.string');
goog.require('goog.window');
goog.require('os.ui.columnactions.AbstractColumnAction');



/**
 * @extends {os.ui.columnactions.AbstractColumnAction}
 * @constructor
 */
os.ui.columnactions.actions.UrlColumnAction = function() {
  os.ui.columnactions.actions.UrlColumnAction.base(this, 'constructor');

  /**
   * @type {string}
   * @private
   */
  this.url_;
};
goog.inherits(os.ui.columnactions.actions.UrlColumnAction, os.ui.columnactions.AbstractColumnAction);


/**
 * @inheritDoc
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.setAction = function(action) {
  this.url_ = /** @type {string} */ (action);
};


/**
 * @inheritDoc
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.execute = function(value) {
  goog.window.open(this.processValue_(value), {'target': '_blank'});
};


/**
 * @inheritDoc
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.matches = function(context, column, value) {
  var sourceId;
  var sourceUrl;
  try {
    if (goog.isDefAndNotNull(context)) {
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
};


/**
 * @inheritDoc
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.toDisplay = function(value) {
  return {'tooltip': this.processValue_(value), 'text': goog.string.buildString(value,
      ' <i class=\'fa fa-external-link\'></i>')};
};


/**
 *
 * @param {?*} value
 * @return {*}
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.getAction = function(value) {
  return this.processValue_(value);
};


/**
 *
 * @param {?*} value
 * @return {string}
 * @private
 */
os.ui.columnactions.actions.UrlColumnAction.prototype.processValue_ = function(value) {
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
};
