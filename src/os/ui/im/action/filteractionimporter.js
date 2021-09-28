goog.declareModuleId('os.ui.im.action.FilterActionImporter');

import OSFilterImporter from '../../../filter/im/osfilterimporter.js';
import FilterActionEntry from '../../../im/action/filteractionentry.js';
import {getColumnsFromFilterable} from '../../../im/action/importaction.js';
import {toFilterString} from '../../filter/filter.js';

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 * @template T
 */
export default class FilterActionImporter extends OSFilterImporter {
  /**
   * Constructor.
   * @param {os.parse.IParser<T>} parser The parser.
   * @param {string=} opt_layerId The layer id.
   * @param {boolean=} opt_keepId If the original entry id should be preserved. Defaults to false.
   */
  constructor(parser, opt_layerId, opt_keepId) {
    super(parser, opt_layerId, opt_keepId);
  }

  /**
   * @inheritDoc
   */
  getFilterModel(title, filter, tooltip, opt_type, opt_match) {
    var children = /** @type {FilterActionEntry} */ (filter).getChildren();
    var childModels;
    if (children) {
      childModels = [];
      children.forEach(function(child) {
        var model = this.getFilterModel(child.getTitle(), child, this.getFilterTooltip(child), opt_type);
        childModels.push(model);
      }, this);
    }

    return {
      'title': title,
      'filter': filter,
      'tooltip': tooltip,
      'type': opt_type,
      'matches': opt_match,
      'children': childModels
    };
  }

  /**
   * @inheritDoc
   */
  getFilterTooltip(entry) {
    var tooltip = 'Filter: ' + toFilterString(/** @type {FilterEntry} */ (entry).getFilterNode(), 1000);

    if (entry instanceof FilterActionEntry && entry.actions.length > 0) {
      var actionText = entry.actions.map(function(action) {
        return action.getLabel();
      }).join(', ') || 'None';

      tooltip += '\nActions: ' + actionText;
    }

    return tooltip;
  }

  /**
   * @inheritDoc
   */
  getFilterColumnsFromFilterable(filterable) {
    return getColumnsFromFilterable(filterable);
  }
}
