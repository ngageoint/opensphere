goog.declareModuleId('os.ui.column.mapping.ColumnMappingNode');

import {FILTER_KEY_DELIMITER} from '../../filter/filter.js';
import SlickTreeNode from '../../slick/slicktreenode.js';
import {directiveTag as nodeUi} from './columnmappingnodeui.js';

const {default: IColumnMapping} = goog.requireType('os.column.IColumnMapping');


/**
 * Tree node representing a column mapping.
 */
export default class ColumnMappingNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?IColumnMapping}
     * @private
     */
    this.cm_ = null;
    this.setCheckboxVisible(false);
    this.nodeUI = `<${nodeUi}></${nodeUi}>`;
  }

  /**
   * Gets the column mapping associated with this node.
   *
   * @return {?IColumnMapping}
   */
  getColumnMapping() {
    return this.cm_;
  }

  /**
   * Sets the column mapping on this node. This also creates
   *
   * @param {?IColumnMapping} value
   */
  setColumnMapping(value) {
    if (value !== this.cm_) {
      this.setChildren(null);
    }

    this.cm_ = value;

    if (value) {
      var columns = value.getColumns();
      this.setLabel(value.getName());

      for (var i = 0, ii = columns.length; i < ii; i++) {
        var columnModel = columns[i];
        var layer = columnModel['layer'];
        var columnText = columnModel['column'];
        var label = columnText + ' (' + layer + ')';
        var node = new SlickTreeNode();

        if (layer.indexOf(FILTER_KEY_DELIMITER) !== -1) {
          // construct a friendlier looking name
          var serverLayer = layer.split(FILTER_KEY_DELIMITER);
          label = '<b>' + columnText + '</b>  (' + serverLayer[0] + ' - ' + serverLayer[1] + ')';
        }

        node.setLabel(label);
        node.setCheckboxVisible(false);
        this.addChild(node);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.cm_) {
      return this.cm_.getName() || 'New Association';
    }

    return super.getLabel();
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    super.updateFrom(other);
    this.setColumnMapping(/** @type {ColumnMappingNode} */ (other).getColumnMapping());
  }
}
