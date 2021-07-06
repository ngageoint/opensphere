goog.module('os.ui.config.SettingNode');
goog.module.declareLegacyNamespace();

const TriState = goog.require('os.structs.TriState');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const ISearchable = goog.requireType('os.data.ISearchable');
const SettingPlugin = goog.requireType('os.ui.config.SettingPlugin');


/**
 * Tree nodes for layers
 *
 * @implements {ISearchable}
 */
class SettingNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?SettingPlugin}
     * @private
     */
    this.settingPlugin_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.settingPlugin_ = null;
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    var t = '';

    if (this.settingPlugin_) {
      t += this.settingPlugin_.getLabel();
      t += this.getTags() ? (' ' + this.getTags().join(' ')) : '';
      t += ' ' + this.settingPlugin_.getCategories().join(' ');
    }

    return t;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.settingPlugin_ && this.settingPlugin_.getTags() || null;
  }

  /**
   * @inheritDoc
   */
  getCheckboxVisible() {
    return false;
  }

  /**
   * @return {?SettingPlugin}
   */
  getModel() {
    return this.settingPlugin_;
  }

  /**
   * @param {?SettingPlugin} value
   */
  setModel(value) {
    this.settingPlugin_ = value;

    if (this.settingPlugin_) {
      this.setId(this.settingPlugin_.getId());
      this.setLabel(this.settingPlugin_.getLabel());
      this.setState(TriState.ON);
      this.setCheckboxVisible(false);
      this.setToolTip(this.settingPlugin_.getDescription());
    }
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var s = null;

    if (this.settingPlugin_) {
      s = this.settingPlugin_.getIcon();
    }

    if (!s) {
      return super.formatIcons();
    }

    return s;
  }
}

exports = SettingNode;
