goog.module('os.bearing.BearingSettingsUI');

const {ROOT} = goog.require('os');
const BearingSettingsKeys = goog.require('os.bearing.BearingSettingsKeys');
const BearingType = goog.require('os.bearing.BearingType');
const Settings = goog.require('os.config.Settings');
const osUi = goog.require('os.ui');
const Module = goog.require('os.ui.Module');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');
const LocationFormat = goog.requireType('os.ui.location.Format');


/**
 * The bearing settings directive
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/bearingsettings.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'bearing-setting';


/**
 * Add the directive to the module
 */
Module.directive('bearingSetting', [directive]);



/**
 * Controller for bearing settings
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    const settings = Settings.getInstance();
    settings.listen(BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);

    /**
     * @type {string}
     */
    this['format'] = /** @type {string} */ (settings.get(BearingSettingsKeys.BEARING_TYPE, BearingType.TRUE_NORTH));

    var cofVersion = /** @type {string} */ (settings.get(BearingSettingsKeys.COF_VERSION, '2015-2020'));
    var helpUrl = /** @type {string} */ (settings.get(BearingSettingsKeys.MAGNETIC_NORTH_HELP_URL));

    this.scope_['cofVersion'] = cofVersion;
    this.scope_['helpUrl'] = helpUrl;

    this.scope_.$watch('ctrl.format', this.update.bind(this));
    this.scope_.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Destroy
   *
   * @private
   */
  destroy_() {
    Settings.getInstance().unlisten(BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);
  }

  /**
   * Listen for changes from the system and update the setting display
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onBearingChange_(event) {
    if (typeof event.newVal == 'string' && event.newVal !== event.oldVal) {
      this['format'] = event.newVal;
      osUi.apply(this.scope_);
    }
  }

  /**
   * Update and store setting.
   *
   * @param {LocationFormat=} opt_new
   * @param {LocationFormat=} opt_old
   * @export
   */
  update(opt_new, opt_old) {
    if (opt_new && opt_old && opt_new !== opt_old) {
      Settings.getInstance().set(BearingSettingsKeys.BEARING_TYPE, opt_new);
    }
  }
}

exports = {
  directive,
  directiveTag,
  Controller
};
