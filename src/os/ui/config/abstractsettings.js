goog.provide('os.ui.config.AbstractSettingsCtrl');
goog.require('os.config.Settings');
goog.require('os.structs.ITreeNode');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingDefaultUICtrl');
goog.require('os.ui.config.SettingNode');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.config.SettingsManagerEventType');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.TreeSearch');
goog.require('os.ui.slick.slickTreeDirective');
goog.require('os.ui.uiSwitchDirective');
goog.require('os.ui.util.ResetSettings');



/**
 * Controller for the save export window
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.config.AbstractSettingsCtrl = function($scope, $timeout) {
  /**
   * @type {os.ui.config.SettingsManager}
   * @protected
   */
  this.settingsManager = os.ui.config.SettingsManager.getInstance();

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {Array.<os.ui.slick.SlickTreeNode>}
   */
  this.scope['settingsNodes'] = null;

  /**
   * @type {os.ui.config.SettingNode}
   */
  this.scope['selected'] = null;

  /**
   * @type {string}
   */
  this.scope['resetDisabledText'] = '';

  this.scope.$watch('selected', this.onSelected.bind(this));
  this.scope.$on('$destroy', this.destroy.bind(this));

  this.settingsManager.listen(os.ui.config.SettingsManagerEventType.SETTING_ADDED, this.refresh_, false, this);
  this.settingsManager.listen(os.ui.config.SettingsManagerEventType.SELECTED_CHANGE, this.refresh_, false, this);
  this.refresh_();
};


/**
 * Cleanup
 */
os.ui.config.AbstractSettingsCtrl.prototype.destroy = function() {
  this.scope['settingsNodes'] = null;
  this.scope = null;
  this.timeout_ = null;

  this.settingsManager.unlisten(os.ui.config.SettingsManagerEventType.SETTING_ADDED, this.refresh_, false, this);
  this.settingsManager.unlisten(os.ui.config.SettingsManagerEventType.SELECTED_CHANGE, this.refresh_, false, this);
  this.settingsManager = null;
};


/**
 * @param {os.ui.config.SettingNode} newVal
 * @param {os.ui.config.SettingNode} oldVal
 * @protected
 */
os.ui.config.AbstractSettingsCtrl.prototype.onSelected = function(newVal, oldVal) {
  if (newVal && newVal.getId) {
    this.settingsManager.setSelected(newVal);
  }
};


/**
 * @param {*} item
 * @return {?string}
 * @export
 */
os.ui.config.AbstractSettingsCtrl.prototype.getUi = function(item) {
  if (item && item instanceof os.ui.config.SettingNode) {
    var node = /** @type {os.ui.config.SettingNode} */ (item);
    var model = node.getModel();

    return model.getUI() || 'defaultsettingui';
  }

  return null;
};


/**
 * Close the window
 *
 * @export
 */
os.ui.config.AbstractSettingsCtrl.prototype.reset = function() {
  if (!this.scope['resetDisabledText']) {
    os.ui.util.resetSettings();
  } else {
    os.ui.window.ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      'prompt': this.scope['resetDisabledText'],
      'yesText': 'Ok',
      'noText': '',
      'windowOptions': {
        'id': 'resetDisabled',
        'label': 'Reset Disabled',
        'icon': 'fa fa-refresh',
        'width': '400',
        'height': 'auto',
        'no-scroll': true,
        'modal': true,
        'headerClass': 'bg-danger u-bg-danger-text'
      }
    }));
  }
};


/**
 * @private
 */
os.ui.config.AbstractSettingsCtrl.prototype.refresh_ = function() {
  this.scope['settingsNodes'] = this.settingsManager.getChildren();

  this.timeout_(goog.bind(function() {
    this.scope['selected'] = this.settingsManager.getSelected();
    if (!this.scope['selected']) {
      // nothing selected - select the first setting
      this.scope['selected'] = this.settingsManager.initSelection();
    }
  }, this));
};
