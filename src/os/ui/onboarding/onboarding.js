goog.declareModuleId('os.ui.onboarding.OnboardingUI');

import EventType from '../eventtype.js';
import Module from '../module.js';
import {directiveTag as ngOnboarding} from './ngonboarding.js';
import OnboardingManager from './onboardingmanager.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OnboardingEvent} = goog.requireType('os.ui.onboarding.OnboardingEvent');


/**
 * The onboarding directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: true,
  template: '<div></div>',
  controller: Controller,
  controllerAs: 'onboardCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'onboarding';

/**
 * Register onboarding directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the onboarding directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    /**
     * @type {boolean}
     */
    this['enabled'] = false;

    /**
     * @type {?Array<Object>}
     */
    this['steps'] = null;

    /**
     * @type {number}
     */
    this['index'] = 0;

    /**
     * @dict
     */
    this['config'] = null;

    /**
     * @type {Function}
     */
    this['onFinishCallback'] = this.onFinishCallback_.bind(this);

    /**
     * @type {string}
     * @private
     */
    this.onboardingTemplate_ =
        `<${ngOnboarding} enabled="onboardCtrl.enabled" steps="onboardCtrl.steps" config="onboardCtrl.config"` +
        `on-finish-callback="onboardCtrl.onFinishCallback" step-index="onboardCtrl.index"></${ngOnboarding}>`;

    /**
     * @type {?angular.$compile}
     * @private
     */
    this.compile_ = $compile;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {OnboardingManager}
     * @private
     */
    this.manager_ = OnboardingManager.getInstance();
    this.manager_.listen(EventType.DISPLAY_ONBOARDING, this.onDisplayOnboarding_, false, this);

    /**
     * @type {Array<OnboardingEvent>}
     * @private
     */
    this.queue_ = [];

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    this.manager_.unlisten(EventType.DISPLAY_ONBOARDING, this.onDisplayOnboarding_, false, this);

    this.element_ = null;
    this.compile_ = null;
    this.scope_ = null;
  }

  /**
   * Handler for onboarding events. Will display the onboarding if there isn't one active, or queue it otherwise.
   *
   * @param {OnboardingEvent} event
   * @private
   */
  onDisplayOnboarding_(event) {
    log.fine(logger, 'Received onboarding: ' + event.title);
    if (!this['enabled']) {
      this.displayOnboarding_(event);
    } else {
      this.queue_.push(event);
    }
  }

  /**
   * Displays an onboarding set.
   *
   * @param {OnboardingEvent} event
   * @private
   */
  displayOnboarding_(event) {
    log.fine(logger, 'Displaying onboarding: ' + event.title);

    if (event.config) {
      this['config'] = event.config;
    }

    this['steps'] = event.steps;
    this['enabled'] = true;
    this['index'] = 0;

    this.obScope_ = this.scope_.$new();
    var obElement = /** @type {Element} */ (this.compile_(this.onboardingTemplate_)(this.obScope_));
    this.element_.append(obElement);
  }

  /**
   * @private
   */
  onFinishCallback_() {
    this.element_.children().remove();
    this.obScope_.$destroy();
    this.obScope_ = null;

    this['config'] = null;
    this['steps'] = null;
    this['enabled'] = false;
    this['index'] = 0;

    // if onboarding has been disabled, dump the remaining queue
    if (!this.manager_ || !this.manager_.isEnabled()) {
      this.queue_.length = 0;
    }

    // display the next queued onboarding
    if (this.queue_.length > 0) {
      this.displayOnboarding_(this.queue_.shift());
    }
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.onboarding.OnboardingUI');
