goog.module('os.ui.filter.ui.FilterGroupBy');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.ui.filterGroupUIDirective');

const googArray = goog.require('goog.array');
const DataManager = goog.require('os.data.DataManager');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const FilterNode = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * Groups nodes by type
 */
class FilterGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_useUi
   */
  constructor(opt_useUi) {
    super();

    /**
     * Whether this groupby will use the filtergroupui
     * @type {boolean}
     * @private
     */
    this.useUi_ = opt_useUi || false;
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
            val = val.substring(0, secHashIdx);
          }
        }
      } catch (e) {
        // weirdly structured typename
      }
    }

    googArray.insert(ids, val);
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
    group.collapsed = false;
    if (this.useUi_) {
      group.setNodeUI('<filtergroupui></filtergroupui>');
    }

    var dm = DataManager.getInstance();
    var d = dm.getDescriptor(id);

    if (d) {
      group.setLabel(d.getTitle() + ' (' + d.getProvider() + ')');
    }

    return group;
  }
}

exports = FilterGroupBy;
