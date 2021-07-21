goog.module('os.ui.feature.tab.descriptionEnableFunction');
goog.module.declareLegacyNamespace();

const {findValue} = goog.require('goog.object');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const RecordField = goog.require('os.data.RecordField');
const {DESC_REGEXP} = goog.require('os.fields');

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
    var description = properties[RecordField.HTML_DESCRIPTION];
    if (!description) {
      description = /** @type {string|undefined} */ (findValue(properties, function(val, key) {
        return DESC_REGEXP.test(key) && !isEmptyOrWhitespace(makeSafe(val));
      })) || '';
    }

    if (description != null && description != '') {
      return true;
    }
  }
  return false;
};
