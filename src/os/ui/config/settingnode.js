goog.provide('os.ui.config.SettingNode');
goog.require('goog.events.EventType');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.structs.TriState');
goog.require('os.ui.config.settingDefaultTreeUIDirective');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree nodes for layers
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.data.ISearchable}
 * @constructor
 */
os.ui.config.SettingNode = function() {
  os.ui.config.SettingNode.base(this, 'constructor');

  /**
   * @type {?os.ui.config.SettingPlugin}
   * @private
   */
  this.settingPlugin_ = null;
};
goog.inherits(os.ui.config.SettingNode, os.ui.slick.SlickTreeNode);


/**
 * @inheritDoc
 */
os.ui.config.SettingNode.prototype.disposeInternal = function() {
  os.ui.config.SettingNode.base(this, 'disposeInternal');
  this.settingPlugin_ = null;
};


/**
 * @inheritDoc
 */
os.ui.config.SettingNode.prototype.getSearchText = function() {
  var t = '';

  if (this.settingPlugin_) {
    t += this.settingPlugin_.getLabel();
    t += this.getTags() ? (' ' + this.getTags().join(' ')) : '';
    t += ' ' + this.settingPlugin_.getCategories().join(' ');
  }

  return t;
};


/**
 * @inheritDoc
 */
os.ui.config.SettingNode.prototype.getTags = function() {
  return this.settingPlugin_ && this.settingPlugin_.getTags() || null;
};


/**
 * @inheritDoc
 */
os.ui.config.SettingNode.prototype.getCheckboxVisible = function() {
  return false;
};


/**
 * @return {?os.ui.config.SettingPlugin}
 */
os.ui.config.SettingNode.prototype.getModel = function() {
  return this.settingPlugin_;
};


/**
 * @param {?os.ui.config.SettingPlugin} value
 */
os.ui.config.SettingNode.prototype.setModel = function(value) {
  this.settingPlugin_ = value;

  if (this.settingPlugin_) {
    this.setId(this.settingPlugin_.getId());
    this.setLabel(this.settingPlugin_.getLabel());
    this.setState(os.structs.TriState.ON);
    this.setCheckboxVisible(false);
    this.setToolTip(this.settingPlugin_.getDescription());
  }
};


/**
 * @inheritDoc
 */
os.ui.config.SettingNode.prototype.formatIcons = function() {
  var s = null;

  if (this.settingPlugin_) {
    s = this.settingPlugin_.getIcon();
  }

  if (!s) {
    return os.ui.config.SettingNode.superClass_.formatIcons.call(this);
  }

  return s;
};
