goog.module('os.ui.filter.ui.FilterTypeGroupBy');
goog.module.declareLegacyNamespace();

const {insert} = goog.require('goog.array');
const {toTitleCase} = goog.require('goog.string');
const FilterGroupBy = goog.require('os.ui.filter.ui.FilterGroupBy');

const FilterNode = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * Groups nodes by type
 */
class FilterTypeGroupBy extends FilterGroupBy {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /**
     * @type {Array<!string>}
     */
    var ids = [];

    /**
     * @type {?string}
     */
    var val = /** @type {FilterNode} */ (node).getEntry().type;

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
            val = val.substring(0, secHashIdx) + ' ' + toTitleCase(category);
          }
          val = val.replace('#', ' ');
        }
      } catch (e) {
        // weirdly structured typename
      }
    }

    insert(ids, val);
    return ids;
  }
}

exports = FilterTypeGroupBy;
