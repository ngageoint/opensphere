goog.module('plugin.suncalc.LightStripSettingsUI');

const EventType = goog.require('goog.events.EventType');
const {ROOT} = goog.require('os');
const settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');
const {duskMode, SettingKey} = goog.require('plugin.suncalc');


/**
 * The lightstrip settings UI directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'lightstripsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for Light Strip Controller settings
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

exports = {
  Controller,
  directive,
  directiveTag
};
