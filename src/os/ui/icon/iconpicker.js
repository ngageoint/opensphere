goog.declareModuleId('os.ui.icon.IconPickerUI');

import {ROOT} from '../../os.js';
import {GMAPS_SEARCH, replaceGoogleUri} from '../file/kml/kml.js';
import Module from '../module.js';
import {bringToFront, create, exists} from '../window.js';
import IconPickerEventType from './iconpickereventtype.js';
import {directiveTag as iconSelector} from './iconselector.js';
const {unsafeClone} = goog.require('os.object');


/**
 * A icon picker directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'disabled': '=',
    'ngModel': '=',
    'iconSet': '=',
    'iconSrc': '=?'
  },
  templateUrl: ROOT + 'views/icon/iconpicker.html',
  controller: Controller,
  controllerAs: 'iconPicker'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'iconpicker';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the icon picker directive
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
     * @type {string}
     */
    this['disabled'] = this.scope['disabled'] || !this.scope['iconSet'];
  }

  /**
   * Handles icon pick events.
   *
   * @param {osx.icon.Icon} icon The new icon
   * @private
   */
  onSelection_(icon) {
    if (this.scope) {
      this.scope['ngModel'] = icon;
      this.scope.$emit(IconPickerEventType.CHANGE, icon);
    }
  }

  /**
   * Toggle the icon picker on/off.
   */
  show() {
    var ui = `<${iconSelector} class="d-flex flex-fill" accept-callback="acceptCallback" selected="icon"` +
        ` icon-set="iconSet" icon-src="iconSrc"> </${iconSelector}>`;
    var scopeOptions = {
      'acceptCallback': this.onSelection_.bind(this),
      'icon': unsafeClone(this.scope['ngModel']),
      'iconSet': this.scope['iconSet'],
      'iconSrc': this.scope['iconSrc']
    };
    Controller.launch(ui, scopeOptions);
  }

  /**
   * Translates from google uri if needed
   *
   * @param {string} path
   * @return {string}
   * @export
   */
  getPath(path) {
    return GMAPS_SEARCH.test(path) ? replaceGoogleUri(path) : path;
  }

  /**
   * Launch the icon picker window.
   *
   * @param {string} template
   * @param {Object} scopeOptions
   */
  static launch(template, scopeOptions) {
    var windowId = 'iconselector';
    if (exists(windowId)) {
      bringToFront(windowId);
    } else {
      var windowOptions = {
        'id': windowId,
        'label': 'Choose an Icon',
        'icon': 'fa fa-flag',
        'x': 'center',
        'y': 'center',
        'width': '600',
        'min-width': '400',
        'max-width': '1200',
        'height': '600',
        'min-height': '400',
        'max-height': '1200',
        'show-close': 'true',
        'modal': 'true'
      };

      create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
    }
  }
}
