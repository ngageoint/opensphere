goog.declareModuleId('os.ui.wiz.step.AbstractWizardStepCtrl');

import WizardStepEvent from './wizardstepevent.js';

const {assert} = goog.require('goog.asserts');


/**
 * Abstract wizard step controller.
 *
 * @template T,S
 * @unrestricted
 */
export default class Controller {
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
     * The wizard configuration.
     * @type {T}
     * @protected
     */
    this.config = $scope['config'];
    assert(!!this.config, 'Wizard configuration not defined on scope');

    /**
     * The wizard step.
     * @type {S}
     * @protected
     */
    this.step = $scope['step'];
    assert(!!this.step, 'Wizard step not defined on scope');

    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up everything!
   *
   * @protected
   */
  destroy() {
    this.scope = null;
    this.config = null;
    this.step = null;
  }

  /**
   * Fire a step validity change/update event. If a validity is provided, the step's valid flag will be updated.
   *
   * @protected
   */
  fireValidity() {
    this.scope.$emit(WizardStepEvent.VALIDATE, this.isValid());
  }

  /**
   * Test if the step is valid.
   *
   * @return {boolean}
   * @protected
   */
  isValid() {
    return true;
  }
}
