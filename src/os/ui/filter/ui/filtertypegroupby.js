goog.declareModuleId('os.ui.filter.ui.FilterTypeGroupBy');

import FilterGroupBy from './filtergroupby.js';

const {toTitleCase} = goog.require('goog.string');

const {default: FilterNode} = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * Groups nodes by type
 */
export default class FilterTypeGroupBy extends FilterGroupBy {
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

    if (!ids.includes(val)) {
      ids.push(val);
    }
    return ids;
  }
}
