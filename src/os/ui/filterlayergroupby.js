goog.declareModuleId('os.ui.FilterLayerGroupBy');

import BaseFilterManager from '../filter/basefiltermanager.js';
import Vector from '../layer/vector.js';
import {getFilterManager} from '../query/queryinstance.js';
import FilterGroupBy from './filter/ui/filtergroupby.js';

const {default: FilterNode} = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * Groups nodes by type
 */
export default class FilterLayerGroupBy extends FilterGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_type
   */
  constructor(opt_type) {
    super();

    /**
     * @type {boolean|undefined}
     * @private
     */
    this.useType_ = opt_type;
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /**
     * @type {Array<string>}
     */
    var ids = [];

    /**
     * @type {?string}
     */
    var type = /** @type {FilterNode} */ (node).getEntry().type;
    var val = 'Unknown';

    if (type) {
      var filterable = getFilterManager().getFilterable(type);
      if (filterable instanceof Vector) {
        val = filterable.getTitle();
        if (this.useType_) {
          val += ' ' + filterable.getExplicitType();
        }
        var provider = filterable.getProvider();
        if (provider) {
          val += ' (' + provider + ')';
        }
      } else {
        val = BaseFilterManager.prettyPrintType(type, this.useType_) + ' (not loaded)';
      }
    }

    if (!ids.includes(val)) {
      ids.push(val);
    }
    return ids;
  }
}
