goog.declareModuleId('os.ui.user.settings.LocationSettingsUI');

import {ROOT} from '../../../os.js';
import {LocationSetting} from '../../location/location.js';
import LocationFormat from '../../location/locationformat.js';
import Module from '../../module.js';
import {apply} from '../../ui.js';
const {getSettings} = goog.require('os.config.instance');


/**
 * The layers window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/config/locationsettings.html',
  controller: Controller,
  controllerAs: 'locSet'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'location-setting';


/**
 * Add the directive to the os.ui module
 */
Module.directive('locationSetting', [directive]);


/**
 * Controller for location settings
 * @unrestricted
 */
export class Controller {
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

    const settings = getSettings();
    settings.listen(LocationSetting.POSITION, this.onFormatChange_, false, this);

    /**
     * @type {?LocationFormat}
     */
    this['format'] = /** @type {string} */ (settings.get(LocationSetting.POSITION, LocationFormat.DEG));

    this.scope_.$watch('locSet.format', this.update.bind(this));
    this.scope_.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Destroy
   *
   * @private
   */
  destroy_() {
    getSettings().unlisten(LocationSetting.POSITION, this.onFormatChange_, false, this);
  }

  /**
   * Listen for changes from the system and update the setting display
   *
   * @param {os.events.SettingChangeEvent} event
   * @private
   */
  onFormatChange_(event) {
    if (event && typeof event.newVal == 'string' && event.newVal !== event.oldVal) {
      this['format'] = event.newVal;
      apply(this.scope_);
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
      getSettings().set(LocationSetting.POSITION, opt_new);
    }
  }
}
