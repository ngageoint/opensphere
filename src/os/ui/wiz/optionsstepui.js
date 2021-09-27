goog.declareModuleId('os.ui.wiz.OptionsStepUI');

import '../color/colorpicker.js';
import '../icon/iconpicker.js';
import '../util/validationmessage.js';
import {ROOT} from '../../os.js';
import {ShapeType} from '../../style/style.js';
import {GOOGLE_EARTH_ICON_SET, replaceGoogleUri, getDefaultIcon} from '../file/kml/kml.js';
import Module from '../module.js';
import WizardStepEvent from './step/wizardstepevent.js';
const {getLocalUrl} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');


/**
 * The import wizard options step directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/wiz/optionsstep.html',
  controller: Controller,
  controllerAs: 'optionsStep'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'optionsstep';


/**
 * Add the directive to the module
 */
Module.directive('optionsstep', [directive]);


/**
 * Controller for the import wizard options step
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

    /**
     * @type {string}
     * @private
     */
    this.originalTitle_ = $scope['config']['title'];

    /**
     * Whether to set a custom icon
     * @type {boolean}
     */
    this['showIcon'] = $scope['config']['icon'];

    /**
     * Icons available to the icon picker.
     * @type {!Array<!osx.icon.Icon>}
     */
    this['iconSet'] = GOOGLE_EARTH_ICON_SET;

    /**
     * Function to translate image sources from the icon set.
     * @type {function(string):string}
     */
    this['iconSrc'] = replaceGoogleUri;

    /**
     * Supported shapes.
     * @type {Array}
     */
    this['shapes'] = [
      ShapeType.DEFAULT,
      ShapeType.POINT,
      ShapeType.SQUARE,
      ShapeType.TRIANGLE,
      ShapeType.ICON
    ];

    /**
     * When to show the icon picker
     * @type {boolean}
     */
    this['showIcon'] = false;

    if (this.scope_['config']) {
      if (!this.scope_['config']['shapeName']) {
        this.scope_['config']['shapeName'] = ShapeType.DEFAULT;
      }
      if (!this.scope_['config']['icon']) {
        this.scope_['config']['icon'] = getDefaultIcon();
      }
    }

    $scope.$watch('config.title', this.onTitleChange_.bind(this));
    $scope.$watch('optionsForm.$valid', this.onValidationChange_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Handles changes to the title field, checking if the title already exists.
   *
   * @param {string} newVal The new title value
   * @private
   */
  onTitleChange_(newVal) {
    if (newVal && newVal != this.originalTitle_) {
      var exists = FileStorage.getInstance().fileExists(getLocalUrl(newVal));
      this.scope_['optionsForm']['title'].$setValidity('exists', !exists);
    } else {
      this.scope_['optionsForm']['title'].$setValidity('exists', true);
    }
  }

  /**
   * Handles validation changes in the options form.
   *
   * @param {boolean} valid If the form is valid.
   * @private
   */
  onValidationChange_(valid) {
    this.scope_.$emit(WizardStepEvent.VALIDATE, valid);
  }

  /**
   * Fire a scope event when the shape is changed by the user.
   *
   * @export
   */
  onShapeChange() {
    this['showIcon'] = this.scope_['config']['shapeName'] == ShapeType.ICON;
  }
}
