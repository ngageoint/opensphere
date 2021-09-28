goog.declareModuleId('plugin.suncalc.LightStripSettingsUI');

import {ROOT} from '../../os/os.js';
import {SettingKey, duskMode} from './suncalc.js';

const EventType = goog.require('goog.events.EventType');
const settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');



/**
 * The lightstrip settings UI directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/plugin/suncalc/lightstripsettings.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'lightstripsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for Light Strip Controller settings
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
     * @private
     */
    this.scope_ = $scope;

    this.scope_.$on('$destroy', this.destroy_.bind(this));

    this['twilightCalculation'] = /** @type {string} */ (settings.getInstance().get(SettingKey.DUSK_MODE,
        duskMode.ASTRONOMICAL
    ));

    this.scope_.$watch('ctrl.twilightCalculation', this.onSettingsChanged.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    settings.getInstance().unlisten(EventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
    this.scope_ = null;
  }

  /**
   * @param {string=} opt_new
   * @param {string=} opt_old
   * @protected
   */
  onSettingsChanged(opt_new, opt_old) {
    if (opt_new && opt_old && opt_new !== opt_old) {
      if (settings.getInstance()) {
        settings.getInstance().set(SettingKey.DUSK_MODE, opt_new);
      }
    }
  }
}
