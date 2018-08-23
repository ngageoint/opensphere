goog.provide('os.style.StyleType');


/**
 * Properties for styles
 * @enum {string}
 */
os.style.StyleType = {
  FEATURE: '_style',
  SELECT: '_selectStyle',
  HIGHLIGHT: '_highlightStyle',
  CUSTOM_HIGHLIGHT: '_customHighlightStyle',
  LABEL: '_labelStyle'
};


/**
 * @type {RegExp}
 * @const
 */
os.style.StyleType.REGEXP = (function() {
  var values = goog.object.getValues(os.style.StyleType);
  for (var i = 0, n = values.length; i < n; i++) {
    values[i] = '(' + values[i] + ')';
  }

  return new RegExp('^(' + values.join('|') + ')$');
})();
