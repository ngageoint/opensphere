goog.module('os.data.groupby.MockTypeGroupBy');

const {default: BaseGroupBy} = goog.require('os.data.groupby.BaseGroupBy');
const {default: TriStateTreeNode} = goog.require('os.structs.TriStateTreeNode');


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

    if (!ids.includes(val)) {
      ids.push(val);
    }
    return ids;
  }

  /**
   * @inheritDoc
   */
  createGroup(node, id) {
    var group = new TriStateTreeNode();
    group.setId(id);
    group.setLabel(id);
    return group;
  }
}

exports = MockTypeGroupBy;
