goog.module('os.file.FileSettingsUI');

const Settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');


/**
 * The column mapping settings UI directive
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: os.ROOT + 'views/file/filesettings.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filesettings';


Module.directive(directiveTag, [directive]);


/**
 * Base file setting key.
 * @type {string}
 */
const BaseKey = 'os.file';


/**
 * File settings keys.
 * @enum {string}
 */
const FileSetting = {
  AUTO_SAVE: BaseKey + '.autoSaveFiles'
};


/**
 * Controller for file settings.
 * @unrestricted
 */
class Controller {
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
    this['autoSaveFiles'] = Settings.getInstance().get(FileSetting.AUTO_SAVE, true);
  }

  /**
   * Clean up.
   * @protected
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
    const settingKey = BaseKey + '.' + type;
    Settings.getInstance().set(settingKey, this['autoSaveFiles']);
  }
}

exports = {
  directive,
  Controller,
  directiveTag
};
