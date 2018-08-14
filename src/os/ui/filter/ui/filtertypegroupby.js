goog.provide('os.ui.filter.ui.FilterTypeGroupBy');
goog.require('os.ui.filter.ui.FilterGroupBy');



/**
 * Groups nodes by type
 * @extends {os.ui.filter.ui.FilterGroupBy}
 * @constructor
 */
os.ui.filter.ui.FilterTypeGroupBy = function() {
  os.ui.filter.ui.FilterTypeGroupBy.base(this, 'constructor');
};
goog.inherits(os.ui.filter.ui.FilterTypeGroupBy, os.ui.filter.ui.FilterGroupBy);


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterTypeGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  /**
   * @type {?string}
   */
  var val = /** @type {os.ui.filter.ui.FilterNode} */ (node).getEntry().type;

  if (!val) {
    val = 'Unknown';
  } else {
    try {
      var firstHashIdx = val.indexOf('#');
      if (firstHashIdx != -1) {
        val = val.substring(firstHashIdx + 1);
        var secHashIdx = val.indexOf('#');
        if (secHashIdx != -1) {
          var category = val.substring(secHashIdx + 1);
          val = val.substring(0, secHashIdx) + ' ' + goog.string.toTitleCase(category);
        }
        val = val.replace('#', ' ');
      }
    } catch (e) {
      // weirdly structured typename
    }
  }

  goog.array.insert(ids, val);
  return ids;
};
