goog.declareModuleId('os.data.FolderNode');

import {directiveTag as folderNodeUi} from '../ui/node/foldernodeui.js';
import SlickTreeNode from '../ui/slick/slicktreenode.js';
const {default: Vector} = goog.requireType('os.layer.Vector');


/**
 * Tree node representing a layer folder.
 */
export default class FolderNode extends SlickTreeNode {
  /**
   * @param {osx.layer.FolderOptions} options
   */
  constructor(options) {
    super();
    this.nodeUI = `<${folderNodeUi}></${folderNodeUi}>`;

    /**
     * The folder options.
     * @type {osx.layer.FolderOptions}
     * @protected
     */
    this.options;

    this.setOptions(options);
  }

  /**
   * Get the folder options.
   * @return {osx.layer.FolderOptions}
   */
  getOptions() {
    return this.options;
  }

  /**
   * Set the folder options.
   * @param {osx.layer.FolderOptions} options
   */
  setOptions(options) {
    this.options = options;
    this.setId(options.id);
    this.setLabel(options.name || 'New Folder');
    this.collapsed = options.collapsed || false;
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    const open = this.hasChildren() && !this.collapsed;
    return `<i class="fa fa-folder${open ? '-open' : ''} fa-fw"></i>`;
  }
}
