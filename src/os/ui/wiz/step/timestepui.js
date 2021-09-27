goog.declareModuleId('os.ui.wiz.step.TimeStepUI');

import '../wizardpreview.js';
import './timeinstantui.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import * as TimeHelpUI from '../../window/timehelp.js';
import WizardStepEvent from './wizardstepevent.js';


/**
 * The import wizard time step directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/wiz/timestep.html',
  controller: Controller,
  controllerAs: 'timeStep'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'timestep';


/**
 * Add the directive to the os.ui module
 */
Module.directive('timestep', [directive]);


/**
 * Controller for the import wizard time step
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
     * @type {boolean}
     */
    this['startValid'] = true;

    /**
     * @type {boolean}
     */
    this['endValid'] = true;

    $scope.$watch('step.timeType', this.validate_.bind(this));
    $scope.$watch('step.startModel.dateType', this.resizePreview_.bind(this));
    $scope.$watch('step.endModel.dateType', this.resizePreview_.bind(this));
    $scope.$watch('timeStep.startValid', this.validate_.bind(this));
    $scope.$watch('timeStep.endValid', this.validate_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Fires an event to make the preview resize itself.
   *
   * @private
   */
  resizePreview_() {
    this.scope_.$broadcast('resizePreview');
  }

  /**
   * Emits a validation event.
   *
   * @private
   */
  validate_() {
    var timeType = this.scope_['step']['timeType'];
    var valid = true;
    if (timeType == 'range') {
      valid = this['startValid'] && this['endValid'];
    } else if (timeType == 'instant') {
      valid = this['startValid'];
    }

    this.scope_.$emit(WizardStepEvent.VALIDATE, valid);
    this.resizePreview_();
  }

  /**
   * Launches the date/time formatting help dialog.
   *
   * @export
   */
  launchHelp() {
    TimeHelpUI.launchTimeHelp();
  }
}
