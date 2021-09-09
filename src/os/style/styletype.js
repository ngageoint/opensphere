goog.module('os.style.StyleType');


/**
 * Properties for styles
 * @enum {string}
 */
const StyleType = {
  FEATURE: '_style',
  SELECT: '_selectStyle',
  CUSTOM_SELECT: '_customSelectStyle',
  HIGHLIGHT: '_highlightStyle',
  CUSTOM_HIGHLIGHT: '_customHighlightStyle',
  LABEL: '_labelStyle'
};

/**
 * @type {RegExp}
 */
StyleType.REGEXP = (function() {
  var values = Object.values(StyleType);
  for (var i = 0, n = values.length; i < n; i++) {
    values[i] = '(' + values[i] + ')';
  }

  return new RegExp('^(' + values.join('|') + ')$');
})();

exports = StyleType;
