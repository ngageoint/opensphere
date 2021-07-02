goog.module('os.ui.MockTypeGroupBy');
goog.module.declareLegacyNamespace();

const googArray = goog.require('goog.array');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

/**
 * Groups nodes by type
 */
class MockTypeGroupBy extends BaseGroupBy {
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
    var val = null;

    try {
      if ('getType' in node) {
        val = node['getType']();
      } else if ('type' in node) {
        val = node['type'];
      }
    } catch (e) {
    }

    if (!val) {
      val = 'No Type';
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
    return group;
  }
}

exports = MockTypeGroupBy;
