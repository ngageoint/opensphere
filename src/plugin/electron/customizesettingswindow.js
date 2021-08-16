goog.declareModuleId('plugin.electron.CustomizeSettingsWindow');

import * as CustomizeSettingsUI from './customizesettingsui'; // eslint-disable-line

import {ROOT} from '../../os/os.js';

const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {create: createWindow, close: closeWindow} = goog.require('os.ui.window');


/**
 * The directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/plugin/electron/customizesettingswindow.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'customizesettingswindow';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * If settings have changed since application load.
     * @type {boolean}
     */
    this['changed'] = false;
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
    this.element = null;
  }

  /**
   * Angular $onInit lifecycle hook.
   */
  $onInit() {
    if (this.scope) {
      this.scope.$emit(WindowEventType.READY);
    }
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    if (this.element) {
      closeWindow(this.element);
    }
  }

  /**
   * Restart the application.
   * @export
   */
  confirm() {
    ElectronOS.restart();
  }
}

/**
 * Launch the customize settings window.
 */
export const launchCustomizeSettings = () => {
  const windowOptions = {
    'label': 'Customize Settings',
    'icon': 'fas fa-cogs',
    'x': 'center',
    'y': 'center',
    'width': 650,
    'min-width': 300,
    'max-width': 700,
    'height': 450,
    'min-height': 350,
    'max-height': 1000,
    'show-close': true,
    'modal': true
  };

  const template = `<${directiveTag}></${directiveTag}>`;
  createWindow(windowOptions, template);
};
