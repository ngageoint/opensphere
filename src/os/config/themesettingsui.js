goog.declareModuleId('os.config.ThemeSettingsUI');

import * as dispatcher from '../dispatcher.js';
import {ROOT} from '../os.js';
import Module from '../ui/module.js';
import {apply} from '../ui/ui.js';
import {getSettings} from './configinstance.js';
import {DEFAULT_THEME, DEFAULT_THEMES, Keys} from './theme.js';
import ThemeSettingsAccessibilityChangeEvent from './themesettingsaccessibilitychangeevent.js';

const GoogEvent = goog.require('goog.events.Event');

const {default: SettingChangeEvent} = goog.requireType('os.events.SettingChangeEvent');


/**
 * The unit settings UI directive
 *
 * @return {angular.Directive}
 */
export const directive = function() {
  return {
    restrict: 'E',
    templateUrl: ROOT + 'views/config/themesettings.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'themesettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for unit settings
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    const settings = getSettings();

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {Object<string>}
     */
    this['themes'] = settings.get(Keys.THEMES, DEFAULT_THEMES);

    /**
     * @type {Object<string>}
     */
    this['accessibleThemes'] = settings.get(Keys.ACCESSIBLE_THEMES, {});

    /**
     * @type {string}
     */
    this['theme'] = settings.get(Keys.THEME, DEFAULT_THEME);

    /**
     * @type {string}
     */
    this['accessibleTheme'] = settings.get(Keys.ACCESSIBLE_THEME);

    /**
     * @type {boolean}
     */
    this['showAccessibleThemes'] = this['accessibleTheme'] ? true : false;

    /**
     * @type {string}
     */
    this['accessibilitySupportPage'] = settings.get('accessibilitySupportPage');

    settings.listen(Keys.THEME, this.onSettingsChange_, false, this);
    settings.listen(Keys.ACCESSIBLE_THEME, this.onAccessibilitySettingsChange_, false, this);

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    const settings = getSettings();
    settings.unlisten(Keys.THEME, this.onSettingsChange_, false, this);
    settings.unlisten(Keys.ACCESSIBLE_THEME, this.onAccessibilitySettingsChange_, false, this);
    this.scope_ = null;
  }

  /**
   * Handle units change via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onSettingsChange_(event) {
    if (event.newVal && event.newVal !== this['theme']) {
      this['theme'] = event.newVal;
      apply(this.scope_);
    }
  }

  /**
   * Handle units change via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onAccessibilitySettingsChange_(event) {
    if (event.newVal && event.newVal !== this['accessibleTheme']) {
      this['accessibleTheme'] = event.newVal;
      apply(this.scope_);
    }
  }

  /**
   * Save to settings.
   *
   * @param {string} newVal
   * @param {string} oldVal
   * @export
   */
  onThemeChange(newVal, oldVal) {
    if (newVal != this['theme']) {
      getSettings().set(Keys.THEME, this['theme']);
    }
  }

  /**
   * Save to settings.
   *
   * @param {string} newVal
   * @param {string} oldVal
   * @export
   */
  onAccessibleThemeChange(newVal, oldVal) {
    getSettings().set(Keys.ACCESSIBLE_THEME, this['accessibleTheme']);
    if (dispatcher.getInstance()) {
      dispatcher.getInstance().dispatchEvent(new GoogEvent(ThemeSettingsAccessibilityChangeEvent));
    }
  }
}
