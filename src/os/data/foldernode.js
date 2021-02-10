goog.module('os.data.FolderNode');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const Vector = goog.requireType('os.layer.Vector');


/**
 * Tree node representing a layer folder.
 */
class FolderNode extends SlickTreeNode {
  /**
   */
  constructor() {
    super();
    this.nodeUI = '<foldernodeui></foldernodeui>';
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    const open = this.hasChildren() && !this.collapsed;
    return '<i class="fa fa-folder' + (open ? '-open' : '') + ' fa-fw"></i>';
  }
}

exports = FolderNode;
