goog.declareModuleId('os.file.FileSettingsUI');

import Settings from '../config/settings.js';
import {ROOT} from '../os.js';
import Module from '../ui/module.js';
import {BaseSettingKey, FileSetting, FileSettingDefault} from './index.js';


/**
 * The column mapping settings UI directive
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/file/filesettings.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filesettings';


Module.directive(directiveTag, [directive]);


/**
 * Controller for file settings.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * Setting value for auto saving files.
     * @type {boolean}
     */
    this['autoSaveFiles'] = Settings.getInstance().get(FileSetting.AUTO_SAVE,
        FileSettingDefault[FileSetting.AUTO_SAVE]);
  }

  /**
   * Clean up.
   */
  $onDestroy() {
    this.scope = null;
  }

  /**
   * Toggles a file setting value.
   * @param {string} type
   * @export
   */
  toggle(type) {
    const settingKey = BaseSettingKey + '.' + type;
    Settings.getInstance().set(settingKey, this['autoSaveFiles']);
  }
}
