goog.module('os.ui.feature.tab.descriptionEnableFunction');
goog.module.declareLegacyNamespace();

/**
 * The tab enable function for the description tab.
 *
 * @param {?Object} tabData The data represented in tab
 * @return {!boolean} true if tab should be shown
 */
exports = function(tabData) {
  var feature = /** @type {ol.Feature|undefined} */ (tabData);
  if (feature) {
    var properties = feature.getProperties();
    var description = properties[os.data.RecordField.HTML_DESCRIPTION];
    if (!description) {
      description = /** @type {string|undefined} */ (goog.object.findValue(properties, function(val, key) {
        return os.fields.DESC_REGEXP.test(key) && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val));
      })) || '';
    }

    if (description != null && description != '') {
      return true;
    }
  }
  return false;
};
