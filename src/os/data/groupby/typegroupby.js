goog.module('os.data.groupby.TypeGroupBy');

const googArray = goog.require('goog.array');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const {default: DescriptorNode} = goog.require('os.ui.data.DescriptorNode');
const {default: SlickTreeNode} = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Groups nodes by type
 */
class TypeGroupBy extends BaseGroupBy {
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
      if (node instanceof DescriptorNode) {
        var d = /** @type {DescriptorNode} */ (node).getDescriptor();
        val = d.getType();
      } else {
        // Unclear what these types are expected to be, but rather than risk breaking behavior we'll cast the type as
        // a generic object.
        var obj = /** @type {!Object} */ (node);
        if ('getType' in obj) {
          val = obj['getType']();
        } else if ('type' in obj) {
          val = obj['type'];
        }
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

exports = TypeGroupBy;
