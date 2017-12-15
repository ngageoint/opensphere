goog.provide('os.ui.clipboard');


/**
 * Retrieve data from the clipboard.  Different browsers do it differently, so make it convenient.
 * @param {Event} event Clipboard is (in good browsers) only accessible within clipboard events
 * @param {string=} opt_type The type of data to retrieve, defaults to 'text'
 * @return {?string} The data or null if not available
 */
os.ui.clipboard.getData = function(event, opt_type) {
  var type = opt_type || 'text';
  var result = null;
  if (event && event.clipboardData) {
    result = event.clipboardData.getData(type);
  } else if (goog.isDef(window.clipboardData)) {
    result = window.clipboardData.getData(type);
  }
  return goog.isDef(result) ? result : null;
};
