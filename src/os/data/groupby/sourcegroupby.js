goog.module('os.data.groupby.SourceGroupBy');
goog.module.declareLegacyNamespace();

const RecordField = goog.require('os.data.RecordField');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const FilterNode = goog.require('os.ui.filter.ui.FilterNode');
const {featureKeys} = goog.require('os.ui.query');
const AreaNode = goog.require('os.ui.query.AreaNode');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


// this field is used to track areas by source
if (!featureKeys.includes(RecordField.SOURCE_NAME)) {
  featureKeys.push(RecordField.SOURCE_NAME);
}


/**
 * Groups nodes by their source when available.
 */
class SourceGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_open Keeps groups open by default
   */
  constructor(opt_open) {
    super();

    /**
     * @type {boolean}
     * @private
     */
    this.open_ = opt_open || false;
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    var ids = /** @type {Array<string>} */ ([]);
    var sourceName;

    if (node && node instanceof AreaNode) {
      try {
        sourceName = /** @type {string|undefined} */ (node.getArea().get(RecordField.SOURCE_NAME));
      } catch (e) {
        // can't find the source, so use the default group
      }
    }

    if (node && node instanceof FilterNode) {
      try {
        sourceName = /** @type {string|undefined} */ (node.getEntry().getSource());
      } catch (e) {
        // can't find the source, so use the default group
      }
    }

    if (sourceName) {
      ids.push(sourceName);
    } else {
      ids.push('No Associated Source');
    }

    return ids;
  }

  /**
   * @inheritDoc
   */
  createGroup(node, id) {
    var group = new SlickTreeNode();
    group.setId(id);
    group.setLabel(id);
    group.setCheckboxVisible(false);
    group.collapsed = !this.open_;
    return group;
  }
}

exports = SourceGroupBy;
