goog.declareModuleId('os.ui.config.AbstractSettingsCtrl');

import {resetSettings} from '../util/resetsettings.js';
import SettingNode from './settingnode.js';
import SettingsManager from './settingsmanager.js';
import SettingsManagerEventType from './settingsmanagereventtype.js';
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Controller for the save export window
 * @unrestricted
 */
export default class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
    /**
     * @type {SettingsManager}
     * @protected
     */
    this.settingsManager = SettingsManager.getInstance();

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
     * @type {Array.<SlickTreeNode>}
     */
    this.scope['settingsNodes'] = null;

    /**
     * @type {SettingNode}
     */
    this.scope['selected'] = null;

    this.scope.$watch('selected', this.onSelected.bind(this));
    this.scope.$on('$destroy', this.destroy.bind(this));

    this.settingsManager.listen(SettingsManagerEventType.SETTING_ADDED, this.refresh_, false, this);
    this.settingsManager.listen(SettingsManagerEventType.SELECTED_CHANGE, this.refresh_, false, this);
    this.refresh_();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.scope['settingsNodes'] = null;
    this.scope = null;
    this.timeout_ = null;

    this.settingsManager.unlisten(SettingsManagerEventType.SETTING_ADDED, this.refresh_, false, this);
    this.settingsManager.unlisten(SettingsManagerEventType.SELECTED_CHANGE, this.refresh_, false, this);
    this.settingsManager = null;
  }

  /**
   * @param {SettingNode} newVal
   * @param {SettingNode} oldVal
   * @protected
   */
  onSelected(newVal, oldVal) {
    if (newVal && newVal.getId) {
      this.settingsManager.setSelected(newVal);
    }
  }

  /**
   * @param {*} item
   * @return {?string}
   * @export
   */
  getUi(item) {
    if (item && item instanceof SettingNode) {
      var node = /** @type {SettingNode} */ (item);
      var model = node.getModel();

      return model.getUI() || 'defaultsettingui';
    }

    return null;
  }

  /**
   * Close the window
   *
   * @export
   */
  reset() {
    resetSettings();
  }

  /**
   * @private
   */
  refresh_() {
    this.scope['settingsNodes'] = this.settingsManager.getChildren();

    this.timeout_(function() {
      if (this.scope && this.settingsManager) {
        this.scope['selected'] = this.settingsManager.getSelected();
        if (!this.scope['selected']) {
          // nothing selected - select the first setting
          this.scope['selected'] = this.settingsManager.initSelection();
        }
      }
    }.bind(this));
  }
}
