goog.declareModuleId('os.ui.filter.ui.GroupNode');

import {escape as xmlEscape} from '../../../xml.js';
import {directiveTag as nodeIconsUi} from '../../nodeicons.js';
import {directiveTag as nodeToggleFolderUi} from '../../nodetogglefolder.js';
import SlickTreeNode from '../../slick/slicktreenode.js';
import {directiveTag as groupNodeUi} from './groupnodeui.js';
import {directiveTag as groupNodeViewUi} from './groupnodeviewui.js';


/**
 * Tree node representing a grouping in an advanced filter.
 * @unrestricted
 */
export default class GroupNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {boolean=} opt_viewonly
   */
  constructor(opt_viewonly) {
    super();

    /**
     * @type {string}
     */
    this['grouping'] = 'And';
    this.setCheckboxVisible(false);
    if (opt_viewonly) {
      this.nodeUI = `<${groupNodeViewUi}></${groupNodeViewUi}>`;
    } else {
      this.nodeUI = `<${groupNodeUi}></${groupNodeUi}>`;
    }
    this.collapsed = false;
  }

  /**
   * @return {string}
   */
  getGrouping() {
    return this['grouping'];
  }

  /**
   * @param {string} value
   */
  setGrouping(value) {
    this['grouping'] = value;
  }

  /**
   * Depth-first traversal of the filter tree. Writes out this node's grouping around any child nodes.
   * If this group has no children, it will return an empty string.
   *
   * @param {string=} opt_title Optional title to include
   * @param {string=} opt_desc Optional description to include
   * @return {string}
   */
  writeFilter(opt_title, opt_desc) {
    var children = /** @type {Array<GroupNode>} */ (this.getChildren());
    var ret = '';

    if (children) {
      var group = this['grouping'];

      // encode filter name and description to avoid problems with special chars
      if (opt_title) {
        group += ' namehint="' + xmlEscape(opt_title) + '"';
      }
      if (opt_desc) {
        group += ' description="' + xmlEscape(opt_desc) + '"';
      }

      ret = '<' + group + '>';
      for (var i = 0, n = children.length; i < n; i++) {
        ret += children[i].writeFilter();
      }
      ret += '</' + this['grouping'] + '>';
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    super.updateFrom(other);
    this.setGrouping(/** @type {GroupNode} */ (other).getGrouping());
  }

  /**
   * @inheritDoc
   */
  format(row, cell, value) {
    var html = this.getSpacer(19 * this.depth);
    html += `<${nodeToggleFolderUi}></${nodeToggleFolderUi}>`;
    html += `<${nodeIconsUi}></${nodeIconsUi}>`;
    html += this.formatNodeUI();
    return html;
  }
}
