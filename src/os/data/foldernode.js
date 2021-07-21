goog.module('os.data.FolderNode');
goog.module.declareLegacyNamespace();

const {directiveTag: folderNodeUi} = goog.require('os.ui.node.FolderNodeUI');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const Vector = goog.requireType('os.layer.Vector');


/**
 * Tree node representing a layer folder.
 */
class FolderNode extends SlickTreeNode {
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

exports = FolderNode;
